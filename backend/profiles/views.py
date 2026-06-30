"""
Profile views.

The `/api/me` endpoint returns the authenticated `AppUser` together
with their `Profile`. PATCH updates the profile fields.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import AppUserSerializer
from accounts.services import get_current_user
from profiles.serializers import ProfileSerializer, ProfileUpdateSerializer
from profiles.services import get_or_create_profile, update_profile


class MeView(APIView):
    """Return and update the current user's profile."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get the current user's profile.",
        responses=ProfileSerializer,
    )
    def get(self, request: Request) -> Response:
        user = get_current_user(request)
        profile = get_or_create_profile(user)
        return Response(ProfileSerializer(profile).data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Update the current user's profile.",
        request=ProfileUpdateSerializer,
        responses=ProfileSerializer,
    )
    def patch(self, request: Request) -> Response:
        user = get_current_user(request)
        serializer = ProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = update_profile(user, serializer.validated_data)
        return Response(ProfileSerializer(profile).data, status=status.HTTP_200_OK)


class MeWithIdentityView(APIView):
    """Return the `AppUser` together with the `Profile` in one call."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get the current user and their profile.",
        responses={200: "object"},
    )
    def get(self, request: Request) -> Response:
        user = get_current_user(request)
        profile = get_or_create_profile(user)
        return Response(
            {
                "user": AppUserSerializer(user).data,
                "profile": ProfileSerializer(profile).data,
            },
            status=status.HTTP_200_OK,
        )