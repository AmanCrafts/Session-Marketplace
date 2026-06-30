"""
Session domain models.

A `Session` is a marketplace listing created by a creator. `Tag`,
`SessionTag`, and `SessionImage` provide richer metadata and a future
hook for object storage URLs.
"""

from __future__ import annotations

from django.db import models

from accounts.models import AppUser
from common.models import BaseModel


class SessionStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PUBLISHED = "published", "Published"
    UNPUBLISHED = "unpublished", "Unpublished"
    ARCHIVED = "archived", "Archived"


class Difficulty(models.TextChoices):
    BEGINNER = "beginner", "Beginner"
    INTERMEDIATE = "intermediate", "Intermediate"
    ADVANCED = "advanced", "Advanced"


class LocationType(models.TextChoices):
    ONLINE = "online", "Online"
    IN_PERSON = "in_person", "In person"
    HYBRID = "hybrid", "Hybrid"


class Tag(BaseModel):
    name = models.CharField(max_length=40, unique=True)

    class Meta:
        ordering = ("name",)

    def __str__(self) -> str:
        return self.name


class Session(BaseModel):
    creator = models.ForeignKey(
        AppUser,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=60, blank=True)
    difficulty = models.CharField(
        max_length=20,
        choices=Difficulty.choices,
        default=Difficulty.BEGINNER,
    )
    duration_minutes = models.PositiveIntegerField(default=60)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="USD")
    capacity = models.PositiveIntegerField(default=1)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    location_type = models.CharField(
        max_length=16,
        choices=LocationType.choices,
        default=LocationType.ONLINE,
    )
    status = models.CharField(
        max_length=16,
        choices=SessionStatus.choices,
        default=SessionStatus.DRAFT,
    )
    thumbnail_url = models.URLField(blank=True)
    tags = models.ManyToManyField(Tag, through="SessionTag", related_name="sessions", blank=True)

    class Meta:
        ordering = ("-scheduled_at", "-created_at")
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["creator", "status"]),
            models.Index(fields=["scheduled_at"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self) -> str:
        return self.title

    # -- Helpers --------------------------------------------------------- #

    @property
    def is_published(self) -> bool:
        return self.status == SessionStatus.PUBLISHED

    @property
    def is_bookable(self) -> bool:
        return self.status == SessionStatus.PUBLISHED and self.capacity > 0

    @property
    def requires_payment(self) -> bool:
        """A session requires payment when its price is strictly positive."""
        return bool(self.price) and self.price > 0


class SessionTag(BaseModel):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="session_tags")
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name="tag_sessions")

    class Meta:
        unique_together = ("session", "tag")
        ordering = ("session", "tag")

    def __str__(self) -> str:
        return f"{self.session_id} -> {self.tag_id}"


class SessionImage(BaseModel):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="images")
    image_url = models.URLField()
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("sort_order", "created_at")

    def __str__(self) -> str:
        return f"{self.session_id} image {self.sort_order}"