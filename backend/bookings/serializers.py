"""
Booking serializers.
"""

from __future__ import annotations

from rest_framework import serializers

from bookings.models import Booking
from sessions.serializers import SessionReadSerializer


class BookingCreateSerializer(serializers.Serializer):
    """Payload accepted by `POST /api/bookings`."""

    session_id = serializers.UUIDField()


class BookingReadSerializer(serializers.ModelSerializer):
    """Booking payload including the embedded session."""

    session = SessionReadSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = (
            "id",
            "session",
            "status",
            "booked_at",
            "canceled_at",
            "amount_paid",
            "currency",
            "payment_status",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class BookingCancelSerializer(serializers.Serializer):
    """Empty payload for cancel; kept for API symmetry and future flags."""

    reason = serializers.CharField(required=False, allow_blank=True, max_length=240)