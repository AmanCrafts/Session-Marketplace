from django.contrib import admin

from sessions.models import Session, SessionImage, SessionTag, Tag


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("title", "creator", "status", "scheduled_at", "capacity", "price", "currency")
    list_filter = ("status", "difficulty", "location_type", "currency")
    search_fields = ("title", "description", "creator__email")
    autocomplete_fields = ("creator",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)


@admin.register(SessionTag)
class SessionTagAdmin(admin.ModelAdmin):
    list_display = ("session", "tag")
    autocomplete_fields = ("session", "tag")


@admin.register(SessionImage)
class SessionImageAdmin(admin.ModelAdmin):
    list_display = ("session", "sort_order", "image_url")
    autocomplete_fields = ("session",)