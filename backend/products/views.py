from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsStaffOrReadOnly

from .filters import ProductFilter
from .models import Category, Product, ProductImage
from .serializers import (
    CategorySerializer,
    ProductImageSerializer,
    ProductImageWriteSerializer,
    ProductSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.annotate(product_count=Count("products"))
    serializer_class = CategorySerializer
    permission_classes = [IsStaffOrReadOnly]
    lookup_field = "slug"
    filterset_fields = ["is_active"]
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(is_active=True)
        return qs


class ProductViewSet(viewsets.ModelViewSet):
    """
    Public read + staff write, same as CategoryViewSet — plus a set of
    staff-only nested actions for image management (upload / edit /
    reorder+primary / delete). There is no separate staff-only product
    serializer: every field on ProductSerializer (including images) is
    safe for public consumption, so the same shape is returned to
    everyone — get_queryset below is what actually restricts what public
    callers can see (active products only).
    """

    queryset = Product.objects.select_related("category").prefetch_related("images").all()
    serializer_class = ProductSerializer
    permission_classes = [IsStaffOrReadOnly]
    lookup_field = "slug"
    filterset_class = ProductFilter
    search_fields = ["name", "short_description", "description"]
    ordering_fields = ["price", "created_at", "name", "stock"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(is_active=True)
        return qs

    @staticmethod
    def _make_primary(product, image):
        """Unset any other primary image on ``product``, then mark ``image``
        primary. Two separate statements (rather than one UPDATE) so the
        DB's partial-unique constraint on is_primary is never violated
        mid-transaction — see ProductImage.Meta.constraints."""
        product.images.filter(is_primary=True).exclude(pk=image.pk).update(is_primary=False)
        if not image.is_primary:
            image.is_primary = True
            image.save(update_fields=["is_primary", "updated_at"])

    @action(detail=True, methods=["post"], url_path="images")
    def upload_image(self, request, slug=None):
        """Staff-only: POST /products/{slug}/images/ (multipart) — adds one
        image to the product. The first image uploaded for a product is
        always made primary automatically, regardless of what the request
        sent, so a product with images is never left without a primary
        one."""
        product = self.get_object()
        serializer = ProductImageWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            is_first_image = not product.images.exists()
            wants_primary = serializer.validated_data.pop("is_primary", False)
            image = serializer.save(product=product, is_primary=False)
            if is_first_image or wants_primary:
                self._make_primary(product, image)

        out = ProductImageSerializer(image, context=self.get_serializer_context())
        return Response(out.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path=r"images/(?P<image_id>\d+)")
    def update_image(self, request, slug=None, image_id=None):
        """Staff-only: PATCH /products/{slug}/images/{id}/ — edit alt_text
        and/or sort_order, and/or make this the primary image (is_primary:
        true). Also doubles as the "reorder" and "choose primary" actions
        the admin UI needs — no separate endpoints for those."""
        product = self.get_object()
        image = get_object_or_404(ProductImage, pk=image_id, product=product)
        serializer = ProductImageWriteSerializer(image, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            wants_primary = serializer.validated_data.pop("is_primary", False)
            updated = serializer.save()
            if wants_primary:
                self._make_primary(product, updated)
                updated.refresh_from_db()

        out = ProductImageSerializer(updated, context=self.get_serializer_context())
        return Response(out.data)

    @update_image.mapping.delete
    def delete_image(self, request, slug=None, image_id=None):
        """Staff-only: DELETE /products/{slug}/images/{id}/. If the deleted
        image was the primary one and other images remain, the next one
        (by sort_order) is automatically promoted to primary — a product
        never silently ends up with images but no primary."""
        product = self.get_object()
        image = get_object_or_404(ProductImage, pk=image_id, product=product)
        was_primary = image.is_primary

        with transaction.atomic():
            image.delete()
            if was_primary:
                next_image = product.images.order_by("sort_order", "created_at").first()
                if next_image:
                    next_image.is_primary = True
                    next_image.save(update_fields=["is_primary", "updated_at"])

        return Response(status=status.HTTP_204_NO_CONTENT)
