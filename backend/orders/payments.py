"""
Payment gateway extension point.

No real payment gateway is integrated in this pass (per the project
brief: "Do NOT integrate a real bank gateway unless the project already
has a selected provider and credentials" — it doesn't yet). This module
exists so that decision is a single, obvious place to land later, instead
of being scattered across views/services.

When a real Iranian gateway (e.g. ZarinPal, IDPay, ZibalIPG, ...) is
selected:

1. Add its SDK/HTTP client here.
2. Implement ``initiate_payment(order)`` for real: request a payment
   session/token from the gateway using ``order.total`` (a Decimal — never
   trust a client-supplied amount) and return the redirect URL the
   frontend should send the customer to.
3. Implement a webhook/callback view (in orders/views.py or a new
   orders/webhooks.py) that verifies the gateway's callback signature,
   looks the order up by the reference this module stored, and — only
   after independently verifying the payment with the gateway's own
   verify/confirm API — calls ``orders.services.mark_paid(order, ...)``.
   A client redirect back to the site is never sufficient proof of
   payment by itself; the server must confirm with the gateway directly.

Until then, "online" at checkout is accepted as a payment_method choice
(so the UI/data model are ready), but it is never enough by itself to
mark an order paid — see orders.services.create_order and
orders.services.mark_paid.
"""

from dataclasses import dataclass


@dataclass
class PaymentInitiationResult:
    """What a real gateway integration would return from initiate_payment."""

    redirect_url: str
    reference: str


def initiate_payment(order) -> PaymentInitiationResult:
    """
    Placeholder for starting a real online-payment session for ``order``.

    No gateway is wired up yet, so this intentionally does not perform a
    network call or mark anything as paid — it just documents the shape a
    real implementation would return. Cash-on-delivery orders never call
    this at all.
    """
    raise NotImplementedError(
        "No payment gateway is configured yet. Cash-on-delivery ('cod') "
        "works without this; 'online' checkout is accepted and stored on "
        "the order, but no live payment session can be started until a "
        "real gateway is integrated here."
    )
