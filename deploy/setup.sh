#!/bin/bash
set -e

echo "=== 1. System packages ==="
sudo apt-get update -qq
sudo apt-get install -y -qq python3.11 python3.11-venv python3-pip nginx

echo "=== 2. Extract project ==="
mkdir -p /home/ubuntu/saso-app
tar -xzf /home/ubuntu/saso-app.tar.gz -C /home/ubuntu/saso-app
cp /home/ubuntu/env.prod /home/ubuntu/saso-app/.env
mkdir -p /home/ubuntu/saso-app/logs

echo "=== 3. Python virtualenv ==="
cd /home/ubuntu/saso-app
python3.11 -m venv venv
venv/bin/pip install --upgrade pip -q
venv/bin/pip install -r requirements.txt -q

echo "=== 4. Django migrate + collectstatic ==="
venv/bin/python manage.py migrate --run-syncdb
venv/bin/python manage.py collectstatic --noinput -v 0

echo "=== 5. Seed super admin ==="
venv/bin/python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@oct.edu.ph', 'admin1234', role='super_admin', first_name='System', last_name='Administrator')
    print('Created admin user')
else:
    print('Admin user already exists')
"

echo "=== 6. Nginx ==="
sudo cp /home/ubuntu/saso-app/deploy/nginx.conf /etc/nginx/sites-available/saso-app
sudo ln -sf /etc/nginx/sites-available/saso-app /etc/nginx/sites-enabled/saso-app
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "=== 7. Gunicorn service ==="
sudo cp /home/ubuntu/saso-app/deploy/gunicorn.service /etc/systemd/system/gunicorn-saso.service
sudo systemctl daemon-reload
sudo systemctl start gunicorn-saso
sudo systemctl enable gunicorn-saso

echo ""
echo "=== DONE ==="
echo "App running at http://47.130.246.172"
sudo systemctl status gunicorn-saso --no-pager
