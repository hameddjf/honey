from rest_framework import serializers

from .models import Order, OrderItem
from . import services


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "unit_price", "quantity", "line_total"]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    """Read serializer for an existing order (fully server-computed)."""

    items = OrderItemSerializer(many=True, read_only=True)
    customer_email = serializers.SerializerMethodField()
    invoice_number = serializers.ReadOnlyField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "invoice_number",
            "status",
            "payment_status",
            "payment_method",
            "payment_reference",
            "paid_at",
            "user",
            "guest_email",
            "customer_email",
            "customer_name",
            "shipping_address",
            "contact_phone",
            "subtotal",
            "shipping_cost",
            "total",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_customer_email(self, obj):
        """The email to show for this order, whether registered or guest."""
        if obj.user_id:
            return obj.user.email
        return obj.guest_email


class OrderLineInputSerializer(serializers.Serializer):
    """One requested line item — quantity only; price is never accepted."""

    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    """
    Write serializer for placing an order.

    Deliberately only accepts product_id + quantity per line, plus an
    optional guest_email for unauthenticated checkout and payment_method.
    Any price or total the client sends is not part of this schema and is
    silently ignored — totals (including shipping) are always derived
    server-side in orders.services. Selecting payment_method never sets
    payment_status — see orders.services.create_order.
    """

    guest_email = serializers.EmailField(required=False, allow_blank=True)
    shipping_address = serializers.CharField(required=False, allow_blank=True, max_length=300)
    contact_phone = serializers.CharField(required=False, allow_blank=True, max_length=30)
    customer_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices, required=False, allow_blank=True)
    items = OrderLineInputSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value


class OrderStatusUpdateSerializer(serializers.Serializer):
    """
    Staff-only: move an order to a new status.

    Validity of the transition itself (e.g. you can't jump straight from
    "pending" to "delivered") is enforced in orders.services, not here —
    this serializer only checks that the value is one of the known
    statuses at all.
    """

    status = serializers.ChoiceField(choices=Order.Status.choices)

    def validate_status(self, value):
        order = self.context["order"]
        if value not in services.ALLOWED_STATUS_TRANSITIONS.get(order.status, set()) and value != order.status:
            raise serializers.ValidationError(
                f"Cannot move an order from '{order.status}' to '{value}'."
            )
        return value


class OrderPaymentUpdateSerializer(serializers.Serializer):
    """Staff-only: record a payment outcome (see orders.services.mark_payment)."""

    payment_status = serializers.ChoiceField(choices=Order.PaymentStatus.choices)
    payment_reference = serializers.CharField(required=False, allow_blank=True, max_length=100)
