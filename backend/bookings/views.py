"""
Booking views.

  * `GET  /api/bookings/me`      — list the current user's bookings
  * `POST /api/bookings`         — create a booking
  * `POST /api/bookings/<id>/cancel` — cancel a booking
  * `GET  /api/creator/bookings` — creator's incoming bookings
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.services import get_current_user
from bookings.serializers import (
    BookingCancelSerializer,
    BookingCreateSerializer,
    BookingReadSerializer,
)
from bookings.services import (
    cancel_booking,
    create_booking,
    list_creator_bookings,
    list_user_bookings,
)
from common.pagination import StandardResultsSetPagination


class MyBookingsView(APIView):
    """List bookings belonging to the current user."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List my bookings.",
        responses=BookingReadSerializer(many=True),
    )
    def get(self, request: Request) -> Response:
        user = get_current_user(request)
        qs = list_user_bookings(user).order_by("-booked_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = BookingReadSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class CreateBookingView(APIView):
    """Create a booking for the current user."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Book a session.",
        request=BookingCreateSerializer,
        responses={201: BookingReadSerializer},
    )
    def post(self, request: Request) -> Response:
        user = get_current_user(request)
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = create_booking(
            user=user,
            session_id=serializer.validated_data["session_id"],
        )
        return Response(
            BookingReadSerializer(booking).data,
            status=status.HTTP_201_CREATED,
        )


class BookingCancelView(APIView):
    """Cancel a booking owned by the current user."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Cancel a booking.",
        request=BookingCancelSerializer,
        responses=BookingReadSerializer,
    )
    def post(self, request: Request, booking_id) -> Response:
        user = get_current_user(request)
        serializer = BookingCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = cancel_booking(user=user, booking_id=booking_id)
        return Response(BookingReadSerializer(booking).data, status=status.HTTP_200_OK)


class CreatorBookingsView(APIView):
    """List bookings for sessions owned by the current creator."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List bookings for sessions I own.",
        responses=BookingReadSerializer(many=True),
    )
    def get(self, request: Request) -> Response:
        user = get_current_user(request)
        qs = list_creator_bookings(user).order_by("-booked_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = BookingReadSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)