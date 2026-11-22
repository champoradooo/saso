import requests, json

USERNAME = 'your-pythonanywhere-username'
TOKEN = 'your-pythonanywhere-api-token'
H = {'Authorization': 'Token ' + TOKEN}
BASE = 'https://www.pythonanywhere.com/api/v0/user/' + USERNAME
DOMAIN = USERNAME + '.pythonanywhere.com'

def api(method, path, **kw):
    return getattr(requests, method)(BASE + path, headers=H, **kw)

# Set virtualenv and source directory
print('Setting virtualenv path...')
r = api('patch', '/webapps/' + DOMAIN + '/', data={
    'virtualenv_path': '/home/' + USERNAME + '/saso-app/venv',
    'source_directory': '/home/' + USERNAME + '/saso-app',
})
print('  Status:', r.status_code, r.text[:120])

# Write WSGI file
print('Writing WSGI file...')
wsgi_lines = [
    'import sys, os',
    'from dotenv import load_dotenv',
    '',
    'path = "/home/' + USERNAME + '/saso-app"',
    'if path not in sys.path:',
    '    sys.path.insert(0, path)',
    '',
    'load_dotenv(os.path.join(path, ".env"))',
    'os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")',
    '',
    'from django.core.wsgi import get_wsgi_application',
    'application = get_wsgi_application()',
]
wsgi_content = '\n'.join(wsgi_lines)
wsgi_path = '/var/www/' + USERNAME + '_pythonanywhere_com_wsgi.py'
r = api('post', '/files/path' + wsgi_path,
        files={'content': ('wsgi.py', wsgi_content.encode())})
print('  WSGI upload:', r.status_code)

# Static file mappings
print('Adding static file mappings...')
existing = api('get', '/webapps/' + DOMAIN + '/static_files/').json()
for sf in existing:
    api('delete', '/webapps/' + DOMAIN + '/static_files/' + str(sf['id']) + '/')

r1 = api('post', '/webapps/' + DOMAIN + '/static_files/',
         json={'url': '/static/', 'path': '/home/' + USERNAME + '/saso-app/staticfiles'})
r2 = api('post', '/webapps/' + DOMAIN + '/static_files/',
         json={'url': '/assets/', 'path': '/home/' + USERNAME + '/saso-app/frontend/dist/assets'})
print('  /static/:', r1.status_code, '  /assets/:', r2.status_code)

# Reload
print('Reloading...')
r = api('post', '/webapps/' + DOMAIN + '/reload/')
print('  Reload:', r.status_code, r.text)

print()
print('DONE -> https://' + DOMAIN)
