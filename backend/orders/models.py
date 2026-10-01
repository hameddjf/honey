import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from core.models import TimeStampedModel
from products.models import Product


class Order(TimeStampedModel):
    class Status(models.TextChoices):
        """
        Order fulfillment stage — intentionally separate from payment state
        (see PaymentStatus below / project brief section 15). The normal
        progression is PENDING -> CONFIRMED -> PREPARING -> SHIPPED ->
        DELIVERED. CANCELLED is reachable from the early stages only; see
        orders.services.ALLOWED_STATUS_TRANSITIONS for the exact rules.
        """

        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        PREPARING = "preparing", "Preparing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentStatus(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    class PaymentMethod(models.TextChoices):
        ONLINE = "online", "Online (gateway placeholder)"
        COD = "cod", "Cash on delivery"

    order_number = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    # Guest checkout stays possible: user may be null if guest_email is set.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    guest_email = models.EmailField(blank=True)

    # Basic shipping info captured at checkout. No shipping-provider
    # integration — this is just enough to show "where is this going" on
    # the order (see project brief section 14).
    shipping_address = models.CharField(max_length=300, blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    # Display name for the invoice/order ("گیرنده سفارش") — captured at
    # checkout time and snapshotted here for the same reason product
    # name/price are snapshotted on OrderItem: a guest has no account
    # record to read it back from later, and even a signed-in user's
    # profile name could change after the fact.
    customer_name = models.CharField(max_length=150, blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    # Payment "foundation" only — no gateway integration yet.
    payment_status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID
    )
    payment_method = models.CharField(max_length=50, choices=PaymentMethod.choices, blank=True)
    # Gateway transaction/reference id, once a real gateway exists (see
    # orders/payments.py). Never populated by client input — only ever set
    # server-side via the staff "payment" action or a future gateway
    # webhook handler.
    payment_reference = models.CharField(max_length=100, blank=True)
    # Set only when payment_status transitions to PAID — never at order
    # creation, and never just because payment_method == "online" (see
    # orders/services.py — selecting "online" at checkout never marks an
    # order paid by itself).
    paid_at = models.DateTimeField(null=True, blank=True)

    # Server-authoritative totals — always (re)computed from OrderItem rows
    # and never trusted from client input. See services.recalculate_totals.
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    shipping_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return str(self.order_number)

    @property
    def invoice_number(self):
        """
        A stable, human-friendly invoice number derived from the order's
        own UUID — no separate Invoice model/table is needed since Order +
        OrderItem already snapshot everything an invoice needs (see
        FINAL_CLOSURE_REPORT.md, item 1). Deterministic and unique because
        order_number itself is unique; just formatted for display.
        """
        return f"NK-{str(self.order_number)[:8].upper()}"

    def clean(self):
        from django.core.exceptions import ValidationError

        if not self.user_id and not self.guest_email:
            raise ValidationError("An order needs either an authenticated user or a guest email.")


class OrderItem(TimeStampedModel):
    """
    A line item on an order.

    Product name and unit price are snapshotted at the time of purchase so
    that historical orders remain accurate even if the underlying Product
    is later renamed, repriced, or deleted.
    """

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="order_items"
    )

    product_name = models.CharField(max_length=200)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"

    @property
    def line_total(self):
        return self.unit_price * self.quantity
