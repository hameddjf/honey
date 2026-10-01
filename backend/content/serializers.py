from rest_framework import serializers

from .models import BlogPost, MediaAsset, SiteContent, StoreSettings


class SiteContentSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request:
            for field in ("hero_image_url", "video_poster_image_url"):
                value = data.get(field) or ""
                if value.startswith("/"):
                    data[field] = request.build_absolute_uri(value)
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
        value = data.get("cover_image_url") or ""
        if request and value.startswith("/"):
            data["cover_image_url"] = request.build_absolute_uri(value)
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
