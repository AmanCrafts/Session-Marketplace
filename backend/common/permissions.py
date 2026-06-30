"""
Shared permissions.
"""

from __future__ import annotations

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsCreator(BasePermission):
    """Allows access only to authenticated users with the `creator` role."""

    message = "Creator role required."

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and user.is_creator)


class IsSelfOrReadOnly(BasePermission):
    """Object-level permission allowing owners to edit their own profile."""

    message = "You can only modify your own profile."

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, "user", obj)
        return bool(
            request.user
            and request.user.is_authenticated
            and owner == request.user
        )