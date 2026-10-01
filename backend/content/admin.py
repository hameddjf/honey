from django.contrib import admin

from .models import BlogPost, MediaAsset, SiteContent, StoreSettings


@admin.register(SiteContent)
class SiteContentAdmin(admin.ModelAdmin):
    list_display = ["__str__", "topbar_is_active", "promo_is_active", "updated_at"]

    def has_add_permission(self, request):
        # Singleton — never allow creating a second row from admin.
        return not SiteContent.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ["title", "tag", "is_published", "published_at", "created_at"]
    list_filter = ["is_published", "tag"]
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ["title", "excerpt"]


@admin.register(MediaAsset)
class MediaAssetAdmin(admin.ModelAdmin):
    list_display = ["__str__", "tag", "is_active", "created_at"]
    list_filter = ["tag", "is_active"]
    search_fields = ["label", "tag", "alt_text"]


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    list_display = ["__str__", "shipping_enabled", "guest_checkout_enabled", "maintenance_mode", "updated_at"]

    def has_add_permission(self, request):
        return not StoreSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
