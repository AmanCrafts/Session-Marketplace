"""
Profile signals. A profile is created lazily on first access in the
service layer to avoid surprises during authentication.
"""

from __future__ import annotations

from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import AppUser
from profiles.models import Profile


@receiver(post_save, sender=AppUser)
def ensure_profile_for_new_user(sender, instance: AppUser, created: bool, **kwargs) -> None:
    if created:
        Profile.objects.get_or_create(user=instance)