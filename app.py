"""
Render start-command shim.

Some Render services are configured with `gunicorn app:app`.
This module exposes the Django WSGI application under that name.
"""

from backend.wsgi import application as app

__all__ = ["app"]
