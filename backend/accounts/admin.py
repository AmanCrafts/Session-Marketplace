from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from accounts.models import AppUser


@admin.register(AppUser)
class AppUserAdmin(DjangoUserAdmin):
    list_display = ("email", "supabase_user_id", "role", "is_active", "created_at")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("email", "supabase_user_id")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at", "last_login", "date_joined")

    fieldsets = (
        (None, {"fields": ("supabase_user_id", "email", "role")}),
        (
            "Status",
            {"fields": ("is_active", "is_staff", "is_superuser", "last_login", "date_joined")},
        ),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("supabase_user_id", "email", "role", "is_active", "is_staff"),
            },
        ),
    )