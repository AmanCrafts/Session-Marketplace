"""
Domain exceptions and the DRF exception handler that turns them into
a stable JSON envelope.
"""

from __future__ import annotations

import logging
from typing import Any

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger("sessions_marketplace")


class DomainError(APIException):
    """Base class for application-defined business errors."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "A domain error occurred."
    default_code = "domain_error"

    def __init__(self, detail: str | None = None, code: str | None = None):
        super().__init__(detail=detail, code=code or self.default_code)


class CapacityExceeded(DomainError):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Session is fully booked."
    default_code = "capacity_exceeded"


class DuplicateBooking(DomainError):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "You already have a booking for this session."
    default_code = "duplicate_booking"


class SessionNotBookable(DomainError):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This session is not currently bookable."
    default_code = "session_not_bookable"


class OwnershipRequired(DomainError):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You do not have permission to modify this resource."
    default_code = "ownership_required"


def _envelope(detail: Any, code: str, status_code: int) -> dict[str, Any]:
    return {
        "error": {
            "code": code,
            "detail": detail,
            "status": status_code,
        }
    }


def api_exception_handler(exc, context):
    """DRF exception handler that emits a consistent error envelope."""
    response = drf_exception_handler(exc, context)
    if response is None:
        logger.exception("Unhandled exception in API view")
        return Response(
            _envelope("Internal server error.", "internal_error", 500),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    code: str
    if isinstance(exc, APIException):
        code = getattr(exc, "default_code", None) or "api_error"
        if isinstance(exc.detail, (list, dict)) and "code" not in response.data:
            # Keep DRF default structure when validators return a dict.
            return Response(
                _envelope(response.data, code, response.status_code),
                status=response.status_code,
            )
    else:
        code = "api_error"

    detail = response.data.get("detail") if isinstance(response.data, dict) else None
    if detail is None:
        detail = response.data

    return Response(
        _envelope(detail, code, response.status_code),
        status=response.status_code,
    )