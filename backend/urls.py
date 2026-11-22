from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import FileResponse, HttpResponse, JsonResponse
from django.views.static import serve as static_serve
from pathlib import Path

DIST_DIR = (
    Path(__file__).resolve().parent.parent
    / "frontend"
    / "dist"
)


def healthz(_request):
    """Render / load-balancer health check — always 200 when the app is up."""
    return JsonResponse({"status": "ok"})


def react_index(request):
    """
    Serve the React/Vite frontend.

    This is only used for frontend routes that are not handled
    by Django's API, admin, media, static, or asset routes.
    """
    index = DIST_DIR / "index.html"

    if not index.exists():
        # Avoid 404 on "/" so Render health checks pass before/without a UI build.
        return HttpResponse(
            "SASO API is running. Build the frontend (frontend/dist) to serve the UI.",
            content_type="text/plain; charset=utf-8",
            status=200,
        )

    return FileResponse(
        open(index, "rb"),
        content_type="text/html; charset=utf-8",
    )


urlpatterns = [
    path("healthz", healthz),
    path("healthz/", healthz),

    # Django Admin
    path("admin/", admin.site.urls),

    # API
    path("api/", include("apps.urls")),
]

# Serve Vite build assets in production (frontend/dist/assets)
if DIST_DIR.exists():
    urlpatterns += [
        re_path(
            r"^assets/(?P<path>.*)$",
            static_serve,
            {"document_root": DIST_DIR / "assets"},
        ),
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