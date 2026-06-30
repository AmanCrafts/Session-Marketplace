"""
Profile serializers.
"""

from __future__ import annotations

from rest_framework import serializers

from profiles.models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    """Full profile payload for the /api/me endpoint."""

    class Meta:
        model = Profile
        fields = (
            "id",
            "full_name",
            "avatar_url",
            "bio",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Subset of fields a user is allowed to mutate."""

    class Meta:
        model = Profile
        fields = ("full_name", "avatar_url", "bio")