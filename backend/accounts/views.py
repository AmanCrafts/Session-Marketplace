"""
Account-related views.
"""

from __future__ import annotations

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import AppUserSerializer
from accounts.services import get_current_user


class CurrentUserView(APIView):
    """Return the authenticated user identity."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get the currently authenticated user.",
        responses={200: AppUserSerializer},
    )
    def get(self, request: Request) -> Response:
        user = get_current_user(request)
        return Response(AppUserSerializer(user).data, status=status.HTTP_200_OK)


class CurrentUserRoleView(APIView):
    """Convenience endpoint exposing the role of the current user."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get the role of the currently authenticated user.",
        responses={200: OpenApiResponse(description="role and is_creator flag")},
    )
    def get(self, request: Request) -> Response:
        user = get_current_user(request)
        return Response({"role": user.role, "is_creator": user.is_creator})