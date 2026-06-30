"""
Filters for the public session catalog.
"""

from __future__ import annotations

import django_filters as df

from sessions.models import Difficulty, LocationType, Session, SessionStatus


class SessionFilter(df.FilterSet):
    q = df.CharFilter(field_name="title", lookup_expr="icontains")
    category = df.CharFilter(field_name="category", lookup_expr="iexact")
    difficulty = df.ChoiceFilter(choices=Difficulty.choices)
    location_type = df.ChoiceFilter(choices=LocationType.choices)
    status = df.ChoiceFilter(choices=SessionStatus.choices)
    scheduled_from = df.IsoDateTimeFilter(field_name="scheduled_at", lookup_expr="gte")
    scheduled_to = df.IsoDateTimeFilter(field_name="scheduled_at", lookup_expr="lte")
    price_min = df.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = df.NumberFilter(field_name="price", lookup_expr="lte")
    tag = df.CharFilter(field_name="tags__name", lookup_expr="iexact")
    creator = df.UUIDFilter(field_name="creator_id")

    class Meta:
        model = Session
        fields = (
            "q",
            "category",
            "difficulty",
            "location_type",
            "status",
            "scheduled_from",
            "scheduled_to",
            "price_min",
            "price_max",
            "tag",
            "creator",
        )