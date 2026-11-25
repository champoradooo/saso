"""
Render start-command shim.

Some Render services are configured with `gunicorn app:app`.
This module exposes the Django WSGI application under that name
and ensures migrations + a default admin user exist on boot.
"""

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

import django

django.setup()

from django.contrib.auth import get_user_model
from django.core.management import call_command

from backend.wsgi import application as app

__all__ = ["app"]


def _bootstrap_database():
    """Create tables and default admin if missing (fresh Render disks)."""
    call_command("migrate", interactive=False, verbosity=0)

    User = get_user_model()
    if User.objects.filter(username="admin").exists():
        return

    User.objects.create_superuser(
        username="admin",
        email="admin@oct.edu.ph",
        password="admin1234",
        role="admin",
        first_name="System",
        last_name="Administrator",
    )


_bootstrap_database()
