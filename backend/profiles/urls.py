from django.urls import path

from profiles.views import MeView, MeWithIdentityView

urlpatterns = [
    path("me/profile", MeView.as_view(), name="me-profile"),
    path("me/full", MeWithIdentityView.as_view(), name="me-full"),
]