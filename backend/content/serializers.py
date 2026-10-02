from django.conf import settings
from rest_framework import serializers

from .models import BlogPost, MediaAsset, SiteContent, StoreSettings


def _absolutize_media(request, value):
    """
    Only Django-served uploads (``/media/...``) need the backend host in front.
    Relative paths such as ``/images/posters/...`` are static files that ship
    with the Next.js frontend (``frontend/public``) — turning those into
    ``http://backend/images/...`` makes them 404, so they are left untouched.
    """
    media_prefix = "/" + settings.MEDIA_URL.strip("/") + "/"
    if request and value and value.startswith(media_prefix):
        return request.build_absolute_uri(value)
    return value


class SiteContentSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request:
            for field in ("hero_image_url", "video_poster_image_url"):
                data[field] = _absolutize_media(request, data.get(field) or "")
        return data

    class Meta:
        model = SiteContent
        fields = [
            "hero_title",
            "hero_subtitle",
            "hero_image_url",
            "topbar_message",
            "topbar_is_active",
            "contact_email",
            "contact_phone",
            "contact_address",
            "social_instagram",
            "social_telegram",
            "social_whatsapp",
            "footer_text",
            "promo_message",
            "promo_is_active",
            "video_label",
            "video_embed_url",
            "video_poster_image_url",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]


class BlogPostSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        data["cover_image_url"] = _absolutize_media(request, data.get("cover_image_url") or "")
        return data

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "body",
            "cover_image_url",
            "tag",
            "author",
            "published_at",
        ]
        read_only_fields = fields


class MediaAssetSerializer(serializers.ModelSerializer):
    """Read shape — includes the absolute file URL for direct <img> use."""

    url = serializers.SerializerMethodField()

    class Meta:
        model = MediaAsset
        fields = [
            "id",
            "file",
            "url",
            "label",
            "tag",
            "alt_text",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "file", "url", "created_at"]

    def get_url(self, obj):
        if not obj.file:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(obj.file.url) if request else obj.file.url


class MediaAssetWriteSerializer(serializers.ModelSerializer):
    """Upload/create shape — ``file`` is required and write-only here.

    ``is_active`` is declared explicitly (rather than left to
    ModelSerializer's auto-generated field) because DRF's BooleanField,
    combined with multipart/form-data parsing, otherwise treats an
    omitted key as an explicit False instead of falling through to the
    model's default=True — every plain file upload (which never sends
    is_active at all) would silently land inactive without this.
    """

    is_active = serializers.BooleanField(required=False, default=True)

    class Meta:
        model = MediaAsset
        fields = ["file", "label", "tag", "alt_text", "is_active"]


class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSettings
        fields = [
            "shipping_enabled",
            "shipping_flat_cost",
            "free_shipping_threshold",
            "guest_checkout_enabled",
            "maintenance_mode",
            "low_stock_threshold",
            "notify_new_order",
            "notify_low_stock",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]
