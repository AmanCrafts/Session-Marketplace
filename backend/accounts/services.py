"""
Accounts services.

Services encapsulate identity-resolution logic so views stay thin.
"""

from __future__ import annotations

from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request

from accounts.models import AppUser


def get_current_user(request: Request) -> AppUser:
    """Return the authenticated `AppUser` for the current request.

    Raises `AuthenticationFailed` if no user is present. In practice
    `IsAuthenticated` should guard every view that calls this.
    """
    user = getattr(request, "user", None)
    if user is None or not getattr(user, "is_authenticated", False):
        raise AuthenticationFailed("Authentication required.")
    return user