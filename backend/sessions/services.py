"""
Session services.

Business logic for the marketplace. Views should never mutate
sessions directly.
"""

from __future__ import annotations

from typing import Any, Iterable

from django.db import transaction
from django.db.models import Count, Q

from accounts.models import AppUser
from common.exceptions import OwnershipRequired
from sessions.models import (
    Session,
    SessionImage,
    SessionStatus,
    SessionTag,
    Tag,
)


# --------------------------------------------------------------------------- #
# Selectors
# --------------------------------------------------------------------------- #


def list_published_sessions():
    return (
        Session.objects.select_related("creator__profile")
        .prefetch_related("tags", "images")
        .filter(status=SessionStatus.PUBLISHED)
    )


def list_sessions_for_creator(creator: AppUser):
    return (
        Session.objects.select_related("creator__profile")
        .prefetch_related("tags", "images")
        .filter(creator=creator)
    )


def get_session_for_detail(session_id) -> Session:
    return (
        Session.objects.select_related("creator__profile")
        .prefetch_related("tags", "images")
        .get(pk=session_id)
    )


def get_owned_session(session_id, creator: AppUser) -> Session:
    try:
        session = (
            Session.objects.select_related("creator__profile")
            .prefetch_related("tags", "images")
            .get(pk=session_id)
        )
    except Session.DoesNotExist:
        raise
    if session.creator_id != creator.id:
        raise OwnershipRequired("You can only modify your own sessions.")
    return session


# --------------------------------------------------------------------------- #
# Mutations
# --------------------------------------------------------------------------- #


@transaction.atomic
def create_session(creator: AppUser, data: dict[str, Any]) -> Session:
    tag_names = _pop_tags(data)
    image_urls = data.pop("images", []) or []
    session = Session.objects.create(creator=creator, **data)
    _apply_tags(session, tag_names)
    _apply_images(session, image_urls)
    return session


@transaction.atomic
def update_session(session: Session, data: dict[str, Any]) -> Session:
    tag_names = _pop_tags(data) if "tags" in data else None
    image_urls = data.pop("images", None) if "images" in data else None

    for field, value in data.items():
        if value is not None:
            setattr(session, field, value)

    session.save()
    if tag_names is not None:
        _apply_tags(session, tag_names)
    if image_urls is not None:
        _apply_images(session, image_urls)
    return session


def delete_session(session: Session) -> None:
    session.delete()


def publish_session(session: Session) -> Session:
    return set_session_status(session, SessionStatus.PUBLISHED)


def unpublish_session(session: Session) -> Session:
    return set_session_status(session, SessionStatus.UNPUBLISHED)


def archive_session(session: Session) -> Session:
    return set_session_status(session, SessionStatus.ARCHIVED)


def set_session_status(session: Session, status: str) -> Session:
    """Persist a status transition and bump `updated_at`."""
    session.status = status
    session.save(update_fields=["status", "updated_at"])
    return session


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #


def _pop_tags(data: dict[str, Any]) -> list[str]:
    raw = data.pop("tags", []) or []
    return [str(t).strip().lower() for t in raw if str(t).strip()]


def _apply_tags(session: Session, names: Iterable[str]) -> None:
    cleaned: list[str] = []
    seen: set[str] = set()
    for name in names:
        key = name.lower()
        if key and key not in seen:
            cleaned.append(key)
            seen.add(key)
    if not cleaned:
        session.session_tags.all().delete()
        return

    existing = {t.name: t for t in Tag.objects.filter(name__in=cleaned)}
    new_names = [name for name in cleaned if name not in existing]
    if new_names:
        Tag.objects.bulk_create([Tag(name=n) for n in new_names], ignore_conflicts=True)
        # `ignore_conflicts=True` does not return PKs, so we refetch only
        # the rows we just inserted to pick up their IDs.
        existing.update(
            {t.name: t for t in Tag.objects.filter(name__in=new_names)}
        )

    # Replace through-table entries atomically.
    session.session_tags.all().delete()
    SessionTag.objects.bulk_create(
        [SessionTag(session=session, tag=existing[name]) for name in cleaned],
        ignore_conflicts=True,
    )


def _apply_images(session: Session, urls: Iterable[str]) -> None:
    cleaned = [str(url).strip() for url in urls if str(url).strip()]
    session.images.all().delete()
    if not cleaned:
        return
    SessionImage.objects.bulk_create(
        [
            SessionImage(session=session, image_url=url, sort_order=idx)
            for idx, url in enumerate(cleaned)
        ]
    )


# --------------------------------------------------------------------------- #
# Aggregates
# --------------------------------------------------------------------------- #


def annotate_with_booking_counts(queryset):
    """Attach `bookings_count` to a session queryset for list views.

    `bookings.session` is a single FK, so `distinct=True` would force an
    unnecessary sort/hash. Omit it.
    """
    from bookings.models import ACTIVE_BOOKING_STATUSES

    return queryset.annotate(
        bookings_count=Count(
            "bookings",
            filter=Q(bookings__status__in=ACTIVE_BOOKING_STATUSES),
        )
    )