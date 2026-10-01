from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.response import Response

from core.permissions import IsOwnerOrStaff, IsStaffUser

from . import services
from .filters import OrderFilter
from .models import Order
from .serializers import (
    OrderCreateSerializer,
    OrderPaymentUpdateSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
)


class OrderViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    Orders are created and read through this endpoint; status changes go
    through the separate ``status`` action below.

    Pricing is never taken from the request — see orders/services.py.
    Customers only ever see and create their own orders (or place a guest
    order); staff see and manage every order.
    """

    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]
    filterset_class = OrderFilter
    search_fields = ["guest_email", "user__email", "user__full_name"]
    ordering_fields = ["created_at", "total", "status"]
    ordering = ["-created_at"]

    def get_permissions(self):
        # Placing an order stays open to guests (guest checkout); viewing
        # order history requires authentication; changing status/payment
        # is staff-only. by_number has its own inline ownership check (see
        # below) since a guest order's "owner" isn't an authenticated user
        # at all — it's whoever holds the unguessable order_number.
        if self.action == "create":
            return [permissions.AllowAny()]
        if self.action in ("status", "payment"):
            return [IsStaffUser()]
        if self.action == "by_number":
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        qs = Order.objects.select_related("user").prefetch_related("items")
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return qs
        if not self.request.user.is_authenticated:
            return qs.none()
        return qs.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        if self.action == "status":
            return OrderStatusUpdateSerializer
        if self.action == "payment":
            return OrderPaymentUpdateSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user if request.user.is_authenticated else None
        order = services.create_order(
            user=user,
            guest_email=serializer.validated_data.get("guest_email", ""),
            shipping_address=serializer.validated_data.get("shipping_address", ""),
            contact_phone=serializer.validated_data.get("contact_phone", ""),
            customer_name=serializer.validated_data.get("customer_name", ""),
            payment_method=serializer.validated_data.get("payment_method", ""),
            line_requests=serializer.validated_data["items"],
        )

        return Response(OrderSerializer(order).data, status=201)

    @action(detail=True, methods=["patch"], url_path="status")
    def status(self, request, pk=None):
        """Staff-only: move this order to a new (valid) status."""
        order = self.get_object()
        serializer = self.get_serializer(data=request.data, context={"order": order, **self.get_serializer_context()})
        serializer.is_valid(raise_exception=True)
        services.transition_order_status(order, serializer.validated_data["status"])
        order.refresh_from_db()
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["patch"], url_path="payment")
    def payment(self, request, pk=None):
        """Staff-only: record a payment outcome (see orders.services.mark_payment)."""
        order = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.mark_payment(
            order,
            payment_status=serializer.validated_data["payment_status"],
            payment_reference=serializer.validated_data.get("payment_reference", ""),
        )
        order.refresh_from_db()
        return Response(OrderSerializer(order).data)

    @action(detail=False, methods=["get"], url_path="by-number/(?P<order_number>[0-9a-fA-F-]{36})")
    def by_number(self, request, order_number=None):
        """
        Invoice lookup by the order's own UUID — this is what the public
        /invoice/<order_number> page and the "receipt link" flow use
        instead of the pk-based detail route.

        Owner-scoped: a registered user's order requires them to be signed
        in as that same user (or staff); a guest order (no user attached)
        is readable by anyone holding the exact order_number, since that
        UUID is unguessable and was only ever given to the customer who
        placed the order — the same trust model as any other "private
        link" order-confirmation flow. Never lists or searches by anything
        but the exact UUID.
        """
        try:
            order = Order.objects.select_related("user").prefetch_related("items").get(order_number=order_number)
        except Order.DoesNotExist as exc:
            raise NotFound("Order not found.") from exc

        if order.user_id:
            is_owner = request.user.is_authenticated and request.user.id == order.user_id
            is_staff = request.user.is_authenticated and request.user.is_staff
            if not (is_owner or is_staff):
                raise PermissionDenied("This order belongs to a different account.")

        return Response(OrderSerializer(order).data)
