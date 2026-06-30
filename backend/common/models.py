"""
Shared base models and mixins.
"""

from __future__ import annotations

import uuid

from django.db import models


class UUIDPrimaryKeyMixin(models.Model):
    """Mixin that swaps the auto-increment primary key for a UUID4."""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    class Meta:
        abstract = True


class TimestampedMixin(models.Model):
    """Adds `created_at` and `updated_at` timestamps."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class BaseModel(UUIDPrimaryKeyMixin, TimestampedMixin):
    """Common base model for app-owned entities."""

    class Meta:
        abstract = True
        ordering = ("-created_at",)