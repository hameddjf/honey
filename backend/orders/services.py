"""
Order pricing/creation logic.

This is the one place that is allowed to decide what an order costs.
Views and serializers must never accept subtotal/shipping/total from the
client — they call into this module instead, which always re-derives
prices from the trusted Product records in the database.
"""

from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from content.models import StoreSettings
from products.models import Product

from .models import Order, OrderItem

# The only order-status moves that are allowed. Deliberately a flat lookup
# table rather than a workflow engine — this is meant to stay simple for
# the MVP. Cancellation is only reachable from the early stages; once an
# order has shipped it can no longer be cancelled through this API.
ALLOWED_STATUS_TRANSITIONS = {
    Order.Status.PENDING: {Order.Status.CONFIRMED, Order.Status.CANCELLED},
    Order.Status.CONFIRMED: {Order.Status.PREPARING, Order.Status.CANCELLED},
    Order.Status.PREPARING: {Order.Status.SHIPPED, Order.Status.CANCELLED},
    Order.Status.SHIPPED: {Order.Status.DELIVERED},
    Order.Status.DELIVERED: set(),
    Order.Status.CANCELLED: set(),
}


def transition_order_status(order: Order, new_status: str) -> Order:
    """
    Move an order to ``new_status`` if the transition is allowed.

    Raises ValidationError on any invalid or out-of-order transition. This
    is the single place that changes order.status — callers (views) should
    never set order.status directly.
    """
    if new_status == order.status:
        return order

    allowed = ALLOWED_STATUS_TRANSITIONS.get(order.status, set())
    if new_status not in allowed:
        raise ValidationError(
            f"Cannot move an order from '{order.status}' to '{new_status}'."
        )

    order.status = new_status
    order.save(update_fields=["status", "updated_at"])
    return order


def mark_payment(order: Order, *, payment_status: str, payment_reference: str = "") -> Order:
    """
    The single place that changes payment_status/payment_reference/paid_at.

    Only ever called from the staff-only "payment" action (or, once a real
    gateway exists, from its verified webhook handler — see
    orders/payments.py) — never from checkout/order-creation, and never
    just because the client selected "online". ``paid_at`` is stamped the
    first time (and only the first time) the order moves into PAID.
    """
    order.payment_status = payment_status
    if payment_reference:
        order.payment_reference = payment_reference
    if payment_status == Order.PaymentStatus.PAID and not order.paid_at:
        order.paid_at = timezone.now()
    order.save(update_fields=["payment_status", "payment_reference", "paid_at", "updated_at"])
    return order


def recalculate_totals(order: Order) -> Order:
    """Recompute subtotal/total for an order from its current line items."""
    subtotal = sum((item.line_total for item in order.items.all()), Decimal("0.00"))
    order.subtotal = subtotal
    order.total = subtotal + order.shipping_cost
    order.save(update_fields=["subtotal", "total", "updated_at"])
    return order


@transaction.atomic
def create_order(
    *,
    user=None,
    guest_email="",
    shipping_address="",
    contact_phone="",
    customer_name="",
    payment_method="",
    line_requests,
):
    """
    Create an order and its items from trusted server-side data only.

    line_requests: an iterable of {"product_id": int, "quantity": int}.
    Product price/name/stock are always read fresh from the database —
    any price or total supplied by the caller is ignored. Shipping cost is
    derived from StoreSettings + the computed subtotal, never from the
    client. payment_status always starts at its model default (unpaid) —
    selecting payment_method="online" here never marks the order paid;
    only orders.services.mark_payment (staff action / future verified
    gateway webhook) can do that.
    """

    if not line_requests:
        raise ValidationError("An order must contain at least one item.")

    if not user and not guest_email:
        raise ValidationError("An order needs either an authenticated user or a guest email.")

    settings_obj = StoreSettings.load()
    if not user and not settings_obj.guest_checkout_enabled:
        raise ValidationError("Guest checkout is currently disabled. Please sign in to place an order.")

    if payment_method and payment_method not in Order.PaymentMethod.values:
        raise ValidationError(f"Unknown payment_method '{payment_method}'.")

    order = Order.objects.create(
        user=user,
        guest_email=guest_email or "",
        shipping_address=shipping_address or "",
        contact_phone=contact_phone or "",
        customer_name=customer_name or "",
        payment_method=payment_method or "",
    )

    # Locking every line's product row up front (in a fixed, deterministic
    # order) — rather than one SELECT FOR UPDATE per line as we go — means
    # two concurrent orders that share products always try to acquire their
    # locks in the same order, so neither can deadlock waiting on the other.
    product_ids = sorted({line.get("product_id") for line in line_requests if line.get("product_id")})
    locked_products = {
        p.pk: p
        for p in Product.objects.select_for_update().filter(pk__in=product_ids, is_active=True)
    }

    subtotal = Decimal("0.00")
    for line in line_requests:
        product_id = line.get("product_id")
        quantity = line.get("quantity")

        if not product_id:
            raise ValidationError("Each order line requires a product_id.")
        if not isinstance(quantity, int) or quantity < 1:
            raise ValidationError("Each order line requires a quantity of at least 1.")

        product = locked_products.get(product_id)
        if product is None:
            raise ValidationError(f"Product {product_id} does not exist or is inactive.")

        # Row is locked (select_for_update above), so this stock check is
        # race-free: no other transaction can concurrently decrement the
        # same row until this transaction commits or rolls back.
        if product.stock < quantity:
            raise ValidationError(f"Not enough stock for '{product.name}'.")

        OrderItem.objects.create(
            order=order,
            product=product,
            product_name=product.name,
            unit_price=product.price,
            quantity=quantity,
        )

        product.stock -= quantity
        product.save(update_fields=["stock", "updated_at"])
        subtotal += product.price * quantity

    order.shipping_cost = settings_obj.compute_shipping_cost(subtotal)
    order.save(update_fields=["shipping_cost", "updated_at"])

    recalculate_totals(order)
    return order

