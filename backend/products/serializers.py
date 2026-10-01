from rest_framework import serializers

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "is_active", "product_count"]
        read_only_fields = ["id", "slug", "product_count"]


class ProductImageSerializer(serializers.ModelSerializer):
    """
    Read-only representation used both in the product detail/list response
    and as the response body of the image-management actions on
    ProductViewSet. Same shape for staff and public callers — there is no
    staff-only image data (see ProductViewSet.get_queryset for why the
    same is true of the product list itself).
    """

    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "url", "alt_text", "sort_order", "is_primary"]
        read_only_fields = fields

    def get_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class ProductImageWriteSerializer(serializers.ModelSerializer):
    """
    Staff-only write serializer for a single ProductImage — used by
    ProductViewSet's upload/update image actions. ``product`` is never
    accepted from the request body; it's always set by the view from the
    URL (the product the action was called on), so a client can never
    attach an image to a different product than the one in the URL.
    """

    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "sort_order", "is_primary"]
        read_only_fields = ["id"]

    def validate_image(self, value):
        max_size = 5 * 1024 * 1024  # 5 MB
        if value.size > max_size:
            raise serializers.ValidationError("حجم تصویر نباید بیشتر از ۵ مگابایت باشد.")
        # Django's ImageField already verifies (via Pillow) that the upload
        # is a real, decodable image — an invalid/corrupt file is rejected
        # automatically before this method even runs.
        return value


class ProductSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(slug_field="slug", queryset=Category.objects.all())
    is_in_stock = serializers.BooleanField(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "category",
            "short_description",
            "description",
            "price",
            "previous_price",
            "stock",
            "size_value",
            "size_unit",
            "is_active",
            "is_featured",
            "is_in_stock",
            "images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at", "is_in_stock", "images"]

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_previous_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Previous price cannot be negative.")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock cannot be negative.")
        return value

    def validate_size_value(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Size value must be greater than zero.")
        return value

    def _current(self, attrs, field):
        """Effective value of ``field`` after this (possibly partial) update."""
        if field in attrs:
            return attrs[field]
        return getattr(self.instance, field, None) if self.instance else None

    def validate(self, attrs):
        price = self._current(attrs, "price")
        previous_price = self._current(attrs, "previous_price")
        if previous_price is not None and price is not None and previous_price < price:
            raise serializers.ValidationError(
                {"previous_price": "قیمت قبلی/اصلی نمی‌تواند کمتر از قیمت فعلی باشد."}
            )

        size_value = self._current(attrs, "size_value")
        size_unit = self._current(attrs, "size_unit") or ""
        if size_value is not None and not size_unit:
            raise serializers.ValidationError(
                {"size_unit": "با تعیین اندازه/وزن/حجم، انتخاب واحد اندازه هم الزامی است."}
            )
        if size_unit and size_value is None:
            raise serializers.ValidationError(
                {"size_value": "با انتخاب واحد اندازه، مقدار اندازه/وزن/حجم هم الزامی است."}
            )
        return attrs
