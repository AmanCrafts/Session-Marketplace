"""
Profile model.

Profiles are kept separate from `AppUser` so that auth-related state
(email, role, supabase_user_id) is isolated from mutable display data.
"""

from __future__ import annotations

from django.db import models

from accounts.models import AppUser
from common.models import BaseModel


class Profile(BaseModel):
    user = models.OneToOneField(
        AppUser,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    full_name = models.CharField(max_length=120, blank=True)
    avatar_url = models.URLField(blank=True)
    bio = models.TextField(blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return self.full_name or str(self.user)