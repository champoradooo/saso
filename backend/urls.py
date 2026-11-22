from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import FileResponse, Http404
from pathlib import Path


def react_index(request):
    """
    Serve the React/Vite frontend.

    This is only used for frontend routes that are not handled
    by Django's API, admin, media, static, or asset routes.
    """
    index = (
        Path(__file__).resolve().parent.parent
        / "frontend"
        / "dist"
        / "index.html"
    )

    if not index.exists():
        raise Http404(
            "React frontend is not built. "
            "Run 'npm run build' inside the frontend folder."
        )

    return FileResponse(
        open(index, "rb"),
        content_type="text/html; charset=utf-8",
    )


urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),

    # API
    path("api/", include("apps.urls")),
]


# -------------------------------------------------------------------
# MEDIA FILES
# -------------------------------------------------------------------
# IMPORTANT:
# Media must be added BEFORE the React catch-all route.
#
# This allows URLs such as:
# /media/discipline/student_reports/lost-found-lost-report.pdf
#
# to be served as actual files instead of being sent to react_index().
# -------------------------------------------------------------------
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )

    urlpatterns += static(
        settings.STATIC_URL,
        document_root=settings.STATIC_ROOT,
    )


# -------------------------------------------------------------------
# REACT / VITE SPA FALLBACK
# -------------------------------------------------------------------
# Anything that is not:
#   - /api/
#   - /admin/
#   - /media/
#   - /static/
#   - /assets/
#
# will be sent to React.
# -------------------------------------------------------------------
urlpatterns += [
    re_path(
        r"^(?!api/|admin/|media/|static/|assets/).*?$",
        react_index,
    ),
]