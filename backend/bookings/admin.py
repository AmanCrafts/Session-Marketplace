from django.contrib import admin

from bookings.models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "user", "status", "payment_status", "booked_at")
    list_filter = ("status", "payment_status")
    search_fields = ("session__title", "user__email")
    autocomplete_fields = ("session", "user")
    readonly_fields = ("created_at", "updated_at", "booked_at")