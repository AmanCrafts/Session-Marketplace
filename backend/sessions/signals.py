"""
Session signals.
"""

from __future__ import annotations

from django.db.models.signals import post_save
from django.dispatch import receiver

from sessions.models import Session, SessionStatus


@receiver(post_save, sender=Session)
def log_session_status_change(sender, instance: Session, created: bool, **kwargs) -> None:
    # Hook for future audit logging; intentionally left as a no-op now
    # so the signal file has a stable home.
    if created:
        return
    if instance.status == SessionStatus.PUBLISHED:
        return