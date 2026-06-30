"""
Profile services.
"""

from __future__ import annotations

from typing import Any

from accounts.models import AppUser
from profiles.models import Profile


def get_or_create_profile(user: AppUser) -> Profile:
    profile, _ = Profile.objects.get_or_create(user=user)
    return profile


def update_profile(user: AppUser, data: dict[str, Any]) -> Profile:
    profile = get_or_create_profile(user)
    allowed = {"full_name", "avatar_url", "bio"}
    for field, value in data.items():
        if field in allowed and value is not None:
            setattr(profile, field, value)
    profile.save(update_fields=list(allowed) + ["updated_at"])
    return profile