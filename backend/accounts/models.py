"""
Application-owned user model.

Supabase manages authentication (OAuth, password reset, sessions). The
backend never touches Supabase's auth tables. Instead, the backend
maintains a local `AppUser` row for every authenticated identity and
stores the Supabase subject in `supabase_user_id` for the mapping.

Roles live here, not in the JWT, so authorization is always enforced
by backend-owned data.
"""

from __future__ import annotations

import uuid
from typing import Optional

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

from common.models import TimestampedMixin


class Role(models.TextChoices):
    USER = "user", "User"
    CREATOR = "creator", "Creator"


class AppUserManager(BaseUserManager):
    """Manager keyed off `supabase_user_id` because the backend does not
    own passwords."""

    use_in_migrations = True

    def get_by_supabase_id(self, supabase_user_id: str) -> Optional["AppUser"]:
        return self.filter(supabase_user_id=supabase_user_id).first()

    def get_or_create_from_supabase(
        self,
        *,
        supabase_user_id: str,
        email: str | None,
        defaults: dict | None = None,
    ) -> tuple["AppUser", bool]:
        """Return an existing AppUser for the Supabase subject or create
        a new one with default role `user`."""

        user = self.get_by_supabase_id(supabase_user_id)
        if user is not None:
            dirty: list[str] = []
            if email and user.email != email:
                user.email = email
                dirty.append("email")
            if defaults:
                for field, value in defaults.items():
                    if getattr(user, field, None) != value:
                        setattr(user, field, value)
                        dirty.append(field)
            if dirty:
                dirty.append("updated_at")
                user.save(update_fields=dirty)
            return user, False

        create_kwargs: dict = {
            "supabase_user_id": supabase_user_id,
            "email": email or "",
            "role": (defaults or {}).get("role", Role.USER),
        }
        if defaults:
            for field, value in defaults.items():
                if field not in create_kwargs:
                    create_kwargs[field] = value
        user = self.create(**create_kwargs)
        return user, True

    # Required overrides for AbstractBaseUser compatibility.
    def create_user(self, supabase_user_id: str, email: str | None = None, **extra_fields):
        if not supabase_user_id:
            raise ValueError("supabase_user_id is required")
        email = self.normalize_email(email) if email else ""
        extra_fields.setdefault("role", Role.USER)
        extra_fields.setdefault("is_active", True)
        return self.create(supabase_user_id=supabase_user_id, email=email, **extra_fields)

    def create_superuser(self, supabase_user_id: str, email: str | None = None, **extra_fields):
        extra_fields.setdefault("role", Role.CREATOR)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(supabase_user_id, email, **extra_fields)

    def normalize_email(self, email: str | None) -> str:
        if not email:
            return ""
        return super().normalize_email(email).lower()


class AppUser(AbstractBaseUser, PermissionsMixin, TimestampedMixin):
    """Local user record that mirrors the Supabase identity."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supabase_user_id = models.UUIDField(unique=True)
    email = models.EmailField(blank=True)
    role = models.CharField(
        max_length=16,
        choices=Role.choices,
        default=Role.USER,
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    last_login = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "supabase_user_id"
    REQUIRED_FIELDS: list[str] = []

    objects = AppUserManager()

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["role"]),
            models.Index(fields=["email"]),
        ]

    def __str__(self) -> str:
        return f"{self.email or self.supabase_user_id} ({self.role})"

    # -- Helpers ---------------------------------------------------------- #

    @property
    def is_creator(self) -> bool:
        return self.role == Role.CREATOR

    @property
    def is_regular_user(self) -> bool:
        return self.role == Role.USER

    def promote_to_creator(self) -> None:
        if self.role != Role.CREATOR:
            self.role = Role.CREATOR
            self.save(update_fields=["role", "updated_at"])

    def get_full_name(self) -> str:
        if hasattr(self, "profile"):
            full = (self.profile.full_name or "").strip()
            if full:
                return full
        return self.email

    def get_short_name(self) -> str:
        if hasattr(self, "profile"):
            full = (self.profile.full_name or "").strip()
            if full:
                return full.split(" ")[0]
        return self.email