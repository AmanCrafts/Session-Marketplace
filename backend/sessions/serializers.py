"""
Session serializers.
"""

from __future__ import annotations

from rest_framework import serializers

from accounts.serializers import AppUserSerializer
from sessions.models import Session, SessionImage, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name")
        read_only_fields = ("id",)


class SessionImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionImage
        fields = ("id", "image_url", "sort_order")
        read_only_fields = ("id",)


class CreatorSummarySerializer(AppUserSerializer):
    """Compact creator representation embedded in session responses.

    Adds the display name and avatar from `Profile` to the base
    `AppUserSerializer` fields. The queryset must `select_related(
    "profile")` to avoid an N+1.
    """

    full_name = serializers.CharField(source="get_full_name", read_only=True)
    avatar_url = serializers.CharField(source="profile.avatar_url", read_only=True, default="")

    class Meta(AppUserSerializer.Meta):
        fields = AppUserSerializer.Meta.fields + ("full_name", "avatar_url")


class SessionReadSerializer(serializers.ModelSerializer):
    """Public-facing session representation."""

    creator = CreatorSummarySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    images = SessionImageSerializer(many=True, read_only=True)
    bookings_count = serializers.IntegerField(read_only=True, default=0)
    is_bookable = serializers.BooleanField(read_only=True)

    class Meta:
        model = Session
        fields = (
            "id",
            "creator",
            "title",
            "description",
            "category",
            "difficulty",
            "duration_minutes",
            "price",
            "currency",
            "capacity",
            "scheduled_at",
            "location_type",
            "status",
            "thumbnail_url",
            "tags",
            "images",
            "bookings_count",
            "is_bookable",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class SessionWriteSerializer(serializers.ModelSerializer):
    """Payload accepted from creators when creating or updating a session."""

    tags = serializers.ListField(
        child=serializers.CharField(max_length=40, allow_blank=False),
        required=False,
        allow_empty=True,
    )
    images = serializers.ListField(
        child=serializers.URLField(),
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = Session
        fields = (
            "title",
            "description",
            "category",
            "difficulty",
            "duration_minutes",
            "price",
            "currency",
            "capacity",
            "scheduled_at",
            "location_type",
            "status",
            "thumbnail_url",
            "tags",
            "images",
        )
        extra_kwargs = {
            "status": {"required": False},
            "description": {"required": False, "allow_blank": True},
            "category": {"required": False, "allow_blank": True},
            "currency": {"required": False},
            "location_type": {"required": False},
            "difficulty": {"required": False},
            "thumbnail_url": {"required": False, "allow_blank": True},
        }

    def validate_capacity(self, value: int) -> int:
        if value < 1:
            raise serializers.ValidationError("Capacity must be at least 1.")
        return value

    def validate_price(self, value):
        if value is None or value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value


class SessionStatusUpdateSerializer(serializers.Serializer):
    """Payload for the publish / unpublish action endpoint."""

    action = serializers.ChoiceField(choices=("publish", "unpublish", "archive"))