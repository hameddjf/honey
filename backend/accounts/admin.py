from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Address, PasswordResetRequest, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ["-created_at"]
    list_display = ["email", "full_name", "phone_number", "is_staff", "is_active", "created_at"]
    search_fields = ["email", "full_name", "phone_number"]
    readonly_fields = ["created_at", "updated_at", "last_login"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name", "phone_number")}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Important dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "phone_number", "password1", "password2"),
            },
        ),
    )


@admin.register(PasswordResetRequest)
class PasswordResetRequestAdmin(admin.ModelAdmin):
    """Read-only ops visibility — never exposes the OTP itself (only its hash)."""

    list_display = ["email", "user", "attempts", "verified_at", "consumed_at", "expires_at", "created_at"]
    search_fields = ["email", "user__email"]
    readonly_fields = [f.name for f in PasswordResetRequest._meta.fields]

    def has_add_permission(self, request):
        return False


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ["title", "user", "city", "is_default", "created_at"]
    list_filter = ["is_default"]
    search_fields = ["title", "city", "user__email"]
