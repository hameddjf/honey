"""
Customer address book (project brief section 7).

Kept in its own module rather than crowding serializers.py/views.py, since
it's a self-contained, owner-scoped feature unrelated to auth/profile
management.
"""

from django.db import transaction
from rest_framework import permissions, serializers, viewsets

from .models import Address


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["id", "title", "city", "detail", "postal_code", "is_default", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class AddressViewSet(viewsets.ModelViewSet):
    """
    Full CRUD over the *current user's own* addresses only — there is no
    way to see or modify anyone else's through this endpoint; get_queryset
    is the enforcement point (never trust a client-supplied user id, and
    this serializer doesn't even expose one).
    """

    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # The first address a user saves becomes their default automatically.
        is_first = not Address.objects.filter(user=self.request.user).exists()
        serializer.save(user=self.request.user, is_default=is_first)

    @transaction.atomic
    def perform_update(self, serializer):
        if serializer.validated_data.get("is_default"):
            Address.objects.filter(user=self.request.user).exclude(pk=serializer.instance.pk).update(is_default=False)
        serializer.save()

    @transaction.atomic
    def perform_destroy(self, instance):
        was_default = instance.is_default
        instance.delete()
        if was_default:
            # Promote the most recently created remaining address so the
            # user always has exactly one default (when they have any
            # addresses left at all) — checkout can rely on that.
            next_addr = Address.objects.filter(user=self.request.user).order_by("-created_at").first()
            if next_addr:
                next_addr.is_default = True
                next_addr.save(update_fields=["is_default"])
