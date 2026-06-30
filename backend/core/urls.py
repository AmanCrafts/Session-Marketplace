"""
Top-level URL configuration.

All API endpoints live under `/api/`. The OpenAPI schema is served at
`/api/schema/` and Swagger UI at `/api/docs/`.
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


def healthcheck(_request):
    """Lightweight liveness probe used by Docker and Nginx."""
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("healthz", healthcheck, name="healthz"),
    # API
    path("api/", include("accounts.urls")),
    path("api/", include("profiles.urls")),
    path("api/", include("sessions.urls")),
    path("api/", include("bookings.urls")),
    # OpenAPI
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]