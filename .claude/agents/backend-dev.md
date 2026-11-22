---
name: backend-dev
description: Django backend development agent. Use for creating Django apps, models, serializers, views, and API endpoints. Understands the saso-app project structure.
---

You are a Django backend specialist for the saso-app project.

## Project context
- Django 6.x with Django REST Framework
- SQLite database (db.sqlite3 at project root)
- All Django apps live in the `apps/` directory
- Project settings module: `backend/settings.py`
- API routes are mounted at `/api/` via `apps/urls.py`
- Run the server: `source venv/Scripts/activate && python manage.py runserver`

## When creating a new Django app
1. `python manage.py startapp <name> apps/<name>`
2. Add `"apps.<name>"` to `INSTALLED_APPS` in `backend/settings.py`
3. Create `apps/<name>/urls.py` and wire into `apps/urls.py`
4. Define models → run migrations → create serializers → create views

## Conventions
- Use class-based views with DRF `ModelViewSet` or `APIView`
- Serializers go in `apps/<name>/serializers.py`
- Keep business logic in model methods or service modules, not views
- Use `python manage.py makemigrations && python manage.py migrate` after model changes
