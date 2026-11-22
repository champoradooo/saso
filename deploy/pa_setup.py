"""
PythonAnywhere deployment - reliable step by step.
Run: python deploy/pa_setup.py
"""
import requests
import time
import json
import os
import secrets
import string

USERNAME = 'your-pythonanywhere-username'
TOKEN = 'your-pythonanywhere-api-token'
H = {'Authorization': 'Token ' + TOKEN}
BASE = 'https://www.pythonanywhere.com/api/v0/user/' + USERNAME
DOMAIN = USERNAME + '.pythonanywhere.com'
HOME = '/home/' + USERNAME

DEPLOY_DIR = os.path.dirname(os.path.abspath(__file__))

def api(method, path, **kw):
    r = getattr(requests, method)(BASE + path, headers=H, **kw)
    return r

def upload_text(remote_path, text):
    r = api('post', '/files/path' + remote_path,
            files={'content': (os.path.basename(remote_path), text.encode('utf-8'))})
    print('  upload', remote_path, '->', r.status_code)
    return r

def upload_bin(remote_path, local_path):
    with open(local_path, 'rb') as f:
        data = f.read()
    r = api('post', '/files/path' + remote_path,
            files={'content': (os.path.basename(remote_path), data)})
    size_kb = len(data) // 1024
    print(f'  upload {remote_path} ({size_kb}KB) -> {r.status_code}')
    return r

def file_exists(remote_path):
    r = api('get', '/files/path' + remote_path)
    return r.status_code == 200

def run_console_script(script_path, timeout=300):
    """Run a shell script via console API, poll until done."""
    r = api('post', '/consoles/', data={
        'executable': 'bash',
        'working_directory': HOME,
    })
    if r.status_code != 201:
        print('  Console create failed:', r.text)
        return ''
    cid = r.json()['id']
    time.sleep(3)

    cmd = 'bash ' + script_path + ' 2>&1; echo "===FINISHED==="\n'
    api('post', '/consoles/' + str(cid) + '/send_input/', data={'input': cmd})

    output = ''
    deadline = time.time() + timeout
    while time.time() < deadline:
        time.sleep(8)
        resp = api('get', '/consoles/' + str(cid) + '/get_latest_output/')
        output = resp.json().get('output', '')
        if '===FINISHED===' in output:
            break
        print('  ...still running...')

    api('delete', '/consoles/' + str(cid) + '/')
    return output

# ── Step 1: Upload archive ────────────────────────────────────────────────────
print('\nStep 1: Uploading project archive...')
archive_path = HOME + '/saso-app.tar.gz'
upload_bin(archive_path, os.path.join(DEPLOY_DIR, 'saso-app.tar.gz'))

# Verify
if not file_exists(archive_path):
    print('  ERROR: archive not found after upload!')
    exit(1)
print('  Archive verified on server.')

# ── Step 2: Upload production .env ───────────────────────────────────────────
print('\nStep 2: Uploading .env...')
SECRET = ''.join(secrets.choice(string.ascii_letters + string.digits + '!@#^&*(-_=+)') for _ in range(50))
env_text = (
    'DJANGO_SECRET_KEY=' + SECRET + '\n'
    'DEBUG=False\n'
    'ALLOWED_HOSTS=' + DOMAIN + ',www.' + DOMAIN + '\n'
    'CORS_ALLOWED_ORIGINS=https://' + DOMAIN + '\n'
    'CSRF_TRUSTED_ORIGINS=https://' + DOMAIN + '\n'
)
upload_text(HOME + '/saso-app-env', env_text)

# ── Step 3: Upload and run setup script ──────────────────────────────────────
print('\nStep 3: Uploading setup script...')
H2 = HOME  # avoid HOME variable inside f-string
setup_sh = f"""#!/bin/bash
set -e
echo "==> Extracting project"
rm -rf {H2}/saso-app
mkdir -p {H2}/saso-app
tar -xzf {H2}/saso-app.tar.gz -C {H2}/saso-app
cp {H2}/saso-app-env {H2}/saso-app/.env
mkdir -p {H2}/saso-app/logs
echo "==> Creating virtualenv"
python3.12 -m venv {H2}/saso-app/venv
echo "==> Installing dependencies"
{H2}/saso-app/venv/bin/pip install --upgrade pip -q
{H2}/saso-app/venv/bin/pip install -r {H2}/saso-app/requirements.txt
echo "==> Running migrations"
cd {H2}/saso-app && venv/bin/python manage.py migrate --run-syncdb
echo "==> Collecting static files"
cd {H2}/saso-app && venv/bin/python manage.py collectstatic --noinput -v 0
echo "==> Seeding admin user"
cd {H2}/saso-app && venv/bin/python manage.py shell << 'PYEOF'
from django.contrib.auth import get_user_model
U = get_user_model()
if not U.objects.filter(username='admin').exists():
    U.objects.create_superuser('admin', 'admin@oct.edu.ph', 'admin1234', role='super_admin', first_name='System', last_name='Administrator')
    print('Admin created')
else:
    print('Admin already exists')
PYEOF
echo "==> Setup complete"
"""
upload_text(HOME + '/setup.sh', setup_sh)

print('\nStep 4: Running setup script (takes ~3 min for pip install)...')
output = run_console_script(HOME + '/setup.sh', timeout=360)
print('\n--- Console output (last 1500 chars) ---')
print(output[-1500:] if len(output) > 1500 else output)
print('--- End output ---')

if 'Setup complete' not in output:
    print('\nWARNING: Setup may not have completed. Check output above.')
else:
    print('\nSetup completed successfully.')

# ── Step 5: Set virtualenv on web app ────────────────────────────────────────
print('\nStep 5: Configuring web app virtualenv...')
r = api('patch', '/webapps/' + DOMAIN + '/', data={
    'virtualenv_path': HOME + '/saso-app/venv',
    'source_directory': HOME + '/saso-app',
})
print('  Status:', r.status_code, r.text[:150])

# ── Step 6: Write WSGI ────────────────────────────────────────────────────────
print('\nStep 6: Writing WSGI file...')
wsgi_lines = [
    'import sys, os',
    'from dotenv import load_dotenv',
    '',
    'path = "' + HOME + '/saso-app"',
    'if path not in sys.path:',
    '    sys.path.insert(0, path)',
    '',
    'load_dotenv(os.path.join(path, ".env"))',
    'os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")',
    '',
    'from django.core.wsgi import get_wsgi_application',
    'application = get_wsgi_application()',
]
wsgi_path = '/var/www/' + USERNAME + '_pythonanywhere_com_wsgi.py'
upload_text(wsgi_path, '\n'.join(wsgi_lines))

# ── Step 7: Static files ─────────────────────────────────────────────────────
print('\nStep 7: Static file mappings...')
existing = api('get', '/webapps/' + DOMAIN + '/static_files/').json()
for sf in (existing if isinstance(existing, list) else []):
    api('delete', '/webapps/' + DOMAIN + '/static_files/' + str(sf['id']) + '/')

r1 = api('post', '/webapps/' + DOMAIN + '/static_files/',
         json={'url': '/static/', 'path': HOME + '/saso-app/staticfiles'})
r2 = api('post', '/webapps/' + DOMAIN + '/static_files/',
         json={'url': '/assets/', 'path': HOME + '/saso-app/frontend/dist/assets'})
print('  /static/:', r1.status_code, '  /assets/:', r2.status_code)

# ── Step 8: Reload ────────────────────────────────────────────────────────────
print('\nStep 8: Reloading web app...')
r = api('post', '/webapps/' + DOMAIN + '/reload/')
print('  Reload:', r.status_code)

print()
print('=' * 50)
print('URL: https://' + DOMAIN)
print('Login: admin / admin1234')
print('=' * 50)
