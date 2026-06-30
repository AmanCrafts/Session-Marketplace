from django.urls import path

from accounts.views import CurrentUserRoleView, CurrentUserView

urlpatterns = [
    path("me", CurrentUserView.as_view(), name="current-user"),
    path("me/role", CurrentUserRoleView.as_view(), name="current-user-role"),
]