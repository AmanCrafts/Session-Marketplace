"""
Common utilities (mixins, small helpers).
"""

from __future__ import annotations

from decimal import Decimal

from django.db import models


def quantize_money(value: Decimal | float | int | None) -> Decimal:
    """Quantize a monetary value to 2 decimal places."""
    if value is None:
        return Decimal("0.00")
    if not isinstance(value, Decimal):
        value = Decimal(str(value))
    return value.quantize(Decimal("0.01"))


class LowercaseCharField(models.CharField):
    """CharField that always lowercases its value before saving."""

    def to_python(self, value):
        value = super().to_python(value)
        if isinstance(value, str):
            return value.lower()
        return value