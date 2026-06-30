"""
Serializers for the `accounts` app.
"""

from __future__ import annotations

from rest_framework import serializers

from accounts.models import AppUser


class AppUserSerializer(serializers.ModelSerializer):
    """Compact representation of an `AppUser` for nested responses."""

    is_creator = serializers.BooleanField(read_only=True)

    class Meta:
        model = AppUser
        fields = (
            "id",
            "email",
            "role",
            "is_creator",
            "created_at",
        )
        read_only_fields = fields