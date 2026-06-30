"""
Session permissions.

`IsCreatorOrReadOnly` lets anonymous visitors browse published sessions
while reserving mutations to creators. `IsSessionOwner` enforces
ownership at the object level.
"""

from __future__ import annotations

from rest_framework import permissions

from sessions.models import SessionStatus


class IsCreatorOrReadOnly(permissions.BasePermission):
    """Anonymous read on published sessions; writes require the creator role."""

    message = "Creator role required for write operations."

    def has_permission(self, request, view) -> bool:
        if request.method in permissions.SAFE_METHODS:
            # Public read access is limited to published sessions in the viewset.
            return True
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and user.is_creator)


class IsSessionOwner(permissions.BasePermission):
    """Object-level check ensuring the user owns the session."""

    message = "You can only modify your own sessions."

    def has_object_permission(self, request, view, obj: Session) -> bool:
        if request.method in permissions.SAFE_METHODS:
            return True
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and obj.creator_id == user.id)


class PublishedSessionOnly(permissions.BasePermission):
    """Anonymous users can only read sessions that are published."""

    message = "Only published sessions are publicly visible."

    def has_object_permission(self, request, view, obj: Session) -> bool:
        if request.method in permissions.SAFE_METHODS:
            user = getattr(request, "user", None)
            if user and user.is_authenticated:
                # Authenticated users can also see their own drafts via the
                # creator endpoints, but the public detail view hides drafts
                # from non-owners.
                if obj.creator_id == user.id:
                    return True
            return obj.status == SessionStatus.PUBLISHED
        return True