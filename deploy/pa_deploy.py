"""
PythonAnywhere deployment script for SASO app.
Run: python deploy/pa_deploy.py
"""
import requests
import time
import os

USERNAME = 'your-pythonanywhere-username'
TOKEN = 'your-pythonanywhere-api-token'
BASE = f'https://www.pythonanywhere.com/api/v0/user/{USERNAME}'
H = {'Authorization': f'Token {TOKEN}'}
DOMAIN = f'{USERNAME}.pythonanywhere.com'

DEPLOY_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(DEPLOY_DIR)

def api(method, path, **kw):
    r = getattr(requests, method)(f'{BASE}{path}', headers=H, **kw)
    return r

def upload_text(remote_path, content):
    r = api('post', f'/files/path{remote_path}',
            files={'content': (os.path.basename(remote_path), content.encode())})
    assert r.status_code in (200, 201), f'Upload failed {remote_path}: {r.status_code} {r.text}'
    return r

def upload_file(remote_path, local_path):
    with open(local_path, 'rb') as f:
        r = api('post', f'/files/path{remote_path}', files={'content': f})
    assert r.status_code in (200, 201), f'Upload failed: {r.status_code} {r.text[:200]}'
    return r

def run_console(commands, wait=8):
    """Create a fresh bash console, run commands, return output."""
    r = api('post', '/consoles/', data={'executable': 'bash', 'working_directory': f'/home/{USERNAME}'})
    assert r.status_code == 201, f'Console create failed: {r.text}'
    cid = r.json()['id']
    time.sleep(2)

    combined = '\n'.join(commands) + '\necho __DONE__\n'
    api('post', f'/consoles/{cid}/send_input/', data={'input': combined})

    # Poll until __DONE__ appears
    for _ in range(60):
        time.sleep(5)
        out = api('get', f'/consoles/{cid}/get_latest_output/').json().get('output', '')
        if '__DONE__' in out:
            # Clean up console
            api('delete', f'/consoles/{cid}/')
            return out
    api('delete', f'/consoles/{cid}/')
    return out

# -- Step 1: Upload archive ────────────────────────────────────────────────────
print('\n-- Step 1: Uploading project archive...')
upload_file(f'/home/{USERNAME}/saso-app.tar.gz', os.path.join(DEPLOY_DIR, 'saso-app.tar.gz'))
print('   OKArchive uploaded')

# -- Step 2: Upload production .env ───────────────────────────────────────────
print('\n-- Step 2: Uploading production .env...')
import secrets, string
SECRET = ''.join(secrets.choice(string.ascii_letters + string.digits + '!@#$%^&*(-_=+)') for _ in range(50))

env_content = f"""DJANGO_SECRET_KEY={SECRET}
DEBUG=False
ALLOWED_HOSTS={DOMAIN},www.{DOMAIN}
CORS_ALLOWED_ORIGINS=https://{DOMAIN}
CSRF_TRUSTED_ORIGINS=https://{DOMAIN}
"""
upload_text(f'/home/{USERNAME}/saso-app-env', env_content)
print('   OK.env uploaded')

# -- Step 3: Extract & set up environment ─────────────────────────────────────
print('\n-- Step 3: Extracting project & installing dependencies (this takes ~2 min)...')
out = run_console([
    f'rm -rf /home/{USERNAME}/saso-app',
    f'mkdir -p /home/{USERNAME}/saso-app',
    f'tar -xzf /home/{USERNAME}/saso-app.tar.gz -C /home/{USERNAME}/saso-app',
    f'cp /home/{USERNAME}/saso-app-env /home/{USERNAME}/saso-app/.env',
    f'mkdir -p /home/{USERNAME}/saso-app/logs',
    f'cd /home/{USERNAME}/saso-app',
    f'python3.12 -m venv venv',
    f'/home/{USERNAME}/saso-app/venv/bin/pip install --upgrade pip -q',
    f'/home/{USERNAME}/saso-app/venv/bin/pip install -r /home/{USERNAME}/saso-app/requirements.txt -q',
])
if 'error' in out.lower() and 'pip' in out.lower():
    print('   WARNPip output:', out[-500:])
else:
    print('   OKDependencies installed')

# -- Step 4: Migrate, collectstatic, seed ─────────────────────────────────────
print('\n-- Step 4: Running migrations & seeding data...')
out = run_console([
    f'cd /home/{USERNAME}/saso-app',
    f'venv/bin/python manage.py migrate --run-syncdb 2>&1',
    f'venv/bin/python manage.py collectstatic --noinput -v 0 2>&1',
    f'venv/bin/python manage.py shell -c "'
    f'from django.contrib.auth import get_user_model; U=get_user_model(); '
    f'U.objects.filter(username=\"admin\").exists() or '
    f'U.objects.create_superuser(\"admin\",\"admin@oct.edu.ph\",\"admin1234\",role=\"admin\",first_name=\"System\",last_name=\"Administrator\")'
    f'"',
])
print('   OKMigrations done')

# -- Step 5: Create / update web app ──────────────────────────────────────────
print('\n-- Step 5: Configuring web app...')
# Check if web app exists
existing = api('get', f'/webapps/{DOMAIN}/').status_code
if existing == 404:
    r = api('post', '/webapps/', data={
        'domain_name': DOMAIN,
        'python_version': 'python312',
    })
    assert r.status_code == 201, f'Web app creation failed: {r.text}'
    print('   OKWeb app created')
else:
    print('   OKWeb app already exists, updating')

# -- Step 6: Write WSGI file ───────────────────────────────────────────────────
print('\n-- Step 6: Configuring WSGI...')
wsgi = f"""import sys
import os
from dotenv import load_dotenv

path = '/home/{USERNAME}/saso-app'
if path not in sys.path:
    sys.path.insert(0, path)

load_dotenv(os.path.join(path, '.env'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
"""
wsgi_path = f'/var/www/{USERNAME}_pythonanywhere_com_wsgi.py'
upload_text(wsgi_path, wsgi)
print('   OKWSGI file written')

# -- Step 7: Set virtualenv path ───────────────────────────────────────────────
r = api('patch', f'/webapps/{DOMAIN}/', data={
    'virtualenv_path': f'/home/{USERNAME}/saso-app/venv',
    'source_directory': f'/home/{USERNAME}/saso-app',
})
assert r.status_code == 200, f'Patch failed: {r.text}'
print('   OKVirtualenv path set')

# -- Step 8: Static files mappings ────────────────────────────────────────────
print('\n-- Step 8: Setting up static files...')
# Remove existing static files entries first
existing_static = api('get', f'/webapps/{DOMAIN}/static_files/').json()
for sf in existing_static:
    api('delete', f'/webapps/{DOMAIN}/static_files/{sf["id"]}/')

# Django collectstatic
api('post', f'/webapps/{DOMAIN}/static_files/', json={
    'url': '/static/',
    'path': f'/home/{USERNAME}/saso-app/staticfiles',
})
# React build assets
api('post', f'/webapps/{DOMAIN}/static_files/', json={
    'url': '/assets/',
    'path': f'/home/{USERNAME}/saso-app/frontend/dist/assets',
})
print('   OKStatic file mappings added')

# -- Step 9: Reload ────────────────────────────────────────────────────────────
print('\n-- Step 9: Reloading web app...')
r = api('post', f'/webapps/{DOMAIN}/reload/')
assert r.status_code == 200, f'Reload failed: {r.text}'
print('   OKWeb app reloaded')

print(f'\n{"="*50}')
print(f'DEPLOYED SUCCESSFULLY')
print(f'URL: https://{DOMAIN}')
print(f'Login: admin / admin1234')
print(f'{"="*50}')
