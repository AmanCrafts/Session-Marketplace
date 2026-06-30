"""
Booking models.

A booking connects a user to a session. Booking creation must be
transaction-safe so capacity can never be oversold.
"""

from __future__ import annotations

from django.db import models

from accounts.models import AppUser
from common.models import BaseModel
from sessions.models import Session


class BookingStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    CONFIRMED = "confirmed", "Confirmed"
    CANCELED = "canceled", "Canceled"
    FAILED = "failed", "Failed"
    REFUNDED = "refunded", "Refunded"


class PaymentStatus(models.TextChoices):
    NOT_REQUIRED = "not_required", "Not required"
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    REFUNDED = "refunded", "Refunded"
    FAILED = "failed", "Failed"


# Statuses that count toward capacity.
ACTIVE_BOOKING_STATUSES = (
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
)


class Booking(BaseModel):
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name="bookings",
    )
    user = models.ForeignKey(
        AppUser,
        on_delete=models.CASCADE,
        related_name="bookings",
    )
    status = models.CharField(
        max_length=16,
        choices=BookingStatus.choices,
        default=BookingStatus.PENDING,
    )
    booked_at = models.DateTimeField(auto_now_add=True)
    canceled_at = models.DateTimeField(null=True, blank=True)

    # Payment-related fields stay on the booking so payments can be wired
    # later without a schema migration.
    amount_paid = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    currency = models.CharField(max_length=3, default="USD")
    payment_status = models.CharField(
        max_length=16,
        choices=PaymentStatus.choices,
        default=PaymentStatus.NOT_REQUIRED,
    )

    class Meta:
        ordering = ("-booked_at",)
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["session", "status"]),
        ]
        constraints = [
            # A user can hold at most one ACTIVE booking per session.
            # Canceled / failed / refunded bookings do not count.
            models.UniqueConstraint(
                fields=["user", "session"],
                condition=models.Q(status__in=ACTIVE_BOOKING_STATUSES),
                name="uniq_active_booking_per_user_session",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} -> {self.session_id} ({self.status})"

    @property
    def is_active(self) -> bool:
        """A booking is active while pending payment or confirmed."""
        return self.status in ACTIVE_BOOKING_STATUSES