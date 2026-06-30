"""
Booking services.

The booking flow is the only piece of business logic that absolutely
must be transactional and concurrency-safe. Capacity validation lives
here so views stay thin.
"""

from __future__ import annotations

import logging
import uuid
from typing import Iterable

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone

from accounts.models import AppUser
from bookings.models import (
    ACTIVE_BOOKING_STATUSES,
    Booking,
    BookingStatus,
    PaymentStatus,
)
from common.exceptions import (
    CapacityExceeded,
    DuplicateBooking,
    OwnershipRequired,
    SessionNotBookable,
)
from sessions.models import Session

logger = logging.getLogger("sessions_marketplace")


# --------------------------------------------------------------------------- #
# Selectors
# --------------------------------------------------------------------------- #


def list_user_bookings(user: AppUser, *, statuses: Iterable[str] | None = None):
    qs = (
        Booking.objects.select_related("session", "session__creator")
        .prefetch_related("session__tags", "session__images")
        .filter(user=user)
    )
    if statuses is not None:
        qs = qs.filter(status__in=list(statuses))
    return qs


def list_session_bookings(session: Session):
    return Booking.objects.select_related("session").filter(session=session)


def list_creator_bookings(creator: AppUser):
    return Booking.objects.select_related("session").filter(session__creator=creator)


def count_active_bookings(session_id) -> int:
    return Booking.objects.filter(
        session_id=session_id,
        status__in=ACTIVE_BOOKING_STATUSES,
    ).count()


# --------------------------------------------------------------------------- #
# Mutations
# --------------------------------------------------------------------------- #


@transaction.atomic
def create_booking(*, user: AppUser, session_id: uuid.UUID) -> Booking:
    """Create a booking transactionally.

    Uses `SELECT ... FOR UPDATE` to lock the session row and a fresh
    count of active bookings so concurrent callers cannot oversell
    capacity. The `(user, session)` partial unique index on
    `ACTIVE_BOOKING_STATUSES` (see `Booking.Meta.constraints`) is the
    final guard against duplicate active bookings.
    """
    try:
        session = (
            Session.objects.select_for_update()
            .select_related("creator")
            .get(pk=session_id)
        )
    except Session.DoesNotExist:
        from django.http import Http404

        raise Http404("Session not found.")

    if session.creator_id == user.id:
        raise OwnershipRequired("Creators cannot book their own sessions.")

    if not session.is_bookable:
        raise SessionNotBookable()

    if count_active_bookings(session.id) >= session.capacity:
        raise CapacityExceeded()

    payment_status = (
        PaymentStatus.PENDING if session.requires_payment else PaymentStatus.NOT_REQUIRED
    )
    try:
        booking = Booking.objects.create(
            session=session,
            user=user,
            status=BookingStatus.PENDING,
            amount_paid=session.price,
            currency=session.currency,
            payment_status=payment_status,
        )
    except IntegrityError as exc:
        # Partial unique index on (user, session) for active statuses fired.
        raise DuplicateBooking() from exc

    logger.info(
        "Booking created",
        extra={"booking_id": str(booking.id), "session_id": str(session.id), "user_id": str(user.id)},
    )
    return booking


@transaction.atomic
def cancel_booking(*, user: AppUser, booking_id: uuid.UUID) -> Booking:
    try:
        booking = Booking.objects.select_for_update().select_related("session").get(pk=booking_id)
    except Booking.DoesNotExist:
        from django.http import Http404

        raise Http404("Booking not found.")

    if booking.user_id != user.id:
        raise OwnershipRequired("You can only cancel your own bookings.")

    if booking.status in {BookingStatus.CANCELED, BookingStatus.REFUNDED}:
        return booking

    booking.status = BookingStatus.CANCELED
    booking.canceled_at = timezone.now()
    booking.save(update_fields=["status", "canceled_at", "updated_at"])
    return booking