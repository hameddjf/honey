"""
Mode 1 had an order status value of "paid" that conflated fulfillment
state with payment state. Mode 2 splits those apart (see
orders.models.Order.Status vs Order.PaymentStatus) and "paid" is no
longer a valid order status.

This is a non-destructive safety net: if any Mode 1 database already has
orders with status="paid", move them to "confirmed" (the closest
equivalent — payment_status already separately tracks paid/unpaid) so
no historical order is left with an invalid status value. On a fresh
database this migration is a no-op.
"""

from django.db import migrations


def migrate_paid_to_confirmed(apps, schema_editor):
    Order = apps.get_model("orders", "Order")
    Order.objects.filter(status="paid").update(status="confirmed")


def noop_reverse(apps, schema_editor):
    # Not reversible in a meaningful way — "confirmed" orders could have
    # started as "pending" too. Left as a no-op rather than guessing.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0002_order_status_workflow_and_shipping_info"),
    ]

    operations = [
        migrations.RunPython(migrate_paid_to_confirmed, noop_reverse),
    ]
