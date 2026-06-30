from django.urls import path

from bookings.views import (
    BookingCancelView,
    CreateBookingView,
    CreatorBookingsView,
    MyBookingsView,
)

urlpatterns = [
    path("bookings", CreateBookingView.as_view(), name="booking-create"),
    path("bookings/me", MyBookingsView.as_view(), name="booking-list-me"),
    path(
        "bookings/<uuid:booking_id>/cancel",
        BookingCancelView.as_view(),
        name="booking-cancel",
    ),
    path("creator/bookings", CreatorBookingsView.as_view(), name="creator-bookings"),
]