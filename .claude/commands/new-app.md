Create a new Django app named "$ARGUMENTS" inside the `apps/` directory.

Steps:
1. Run `source venv/Scripts/activate && python manage.py startapp $ARGUMENTS apps/$ARGUMENTS`
2. Add `"apps.$ARGUMENTS"` to `INSTALLED_APPS` in `backend/settings.py`
3. Create `apps/$ARGUMENTS/serializers.py` (empty scaffold)
4. Create `apps/$ARGUMENTS/urls.py` with empty `urlpatterns = []`
5. Include `apps.$ARGUMENTS.urls` in `apps/urls.py`
6. Report the files created and next steps (define models, run makemigrations)
