from django.urls import include, path
from rest_framework.routers import DefaultRouter

from sessions.views import CreatorSessionViewSet, PublicSessionViewSet

router = DefaultRouter()
router.register(r"sessions", PublicSessionViewSet, basename="session")
router.register(
    r"creator/sessions",
    CreatorSessionViewSet,
    basename="creator-session",
)

urlpatterns = [
    path("", include(router.urls)),
]