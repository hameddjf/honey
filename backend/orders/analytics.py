"""
Read-only, staff-only analytics for /admin (dashboard) and /admin/reports.

Both endpoints compute everything server-side from real Order/OrderItem/
Product rows — no raw order/product list is shipped to the browser just so
the frontend can crunch numbers itself (see project brief section 4: "Create
a small analytics/report endpoint if needed rather than downloading
excessive raw data into the browser").
"""

from datetime import datetime, timedelta

from django.db.models import Count, DecimalField, F, Sum
from django.db.models.functions import Coalesce, TruncDate
from django.utils import timezone
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from content.models import StoreSettings
from products.models import Product

from .models import Order, OrderItem

ZERO = 0


def _money(value):
    """Order/OrderItem money fields are Decimal — JSON-friendly float out."""
    return float(value or 0)


class AdminDashboardView(APIView):
    """
    Backs the /admin overview screen: orders, revenue, customers, products,
    stock, order-status breakdown, top products, low-stock alerts — all
    real Django data instead of the old adminStore/localStorage demo set.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        orders_qs = Order.objects.all()
        non_cancelled = orders_qs.exclude(status=Order.Status.CANCELLED)

        status_counts = dict(orders_qs.values_list("status").annotate(c=Count("id")).values_list("status", "c"))
        status_breakdown = {choice: status_counts.get(choice, 0) for choice, _ in Order.Status.choices}

        total_revenue = non_cancelled.aggregate(v=Coalesce(Sum("total"), 0, output_field=DecimalField()))["v"]

        settings_obj = StoreSettings.load()
        low_stock_qs = (
            Product.objects.filter(is_active=True, stock__lte=settings_obj.low_stock_threshold)
            .order_by("stock")
            .values("id", "name", "slug", "stock")[:20]
        )

        top_products = (
            OrderItem.objects.exclude(order__status=Order.Status.CANCELLED)
            .values("product_name")
            .annotate(
                units=Coalesce(Sum("quantity"), 0),
                line_revenue=Coalesce(Sum(F("unit_price") * F("quantity"), output_field=DecimalField()), 0, output_field=DecimalField()),
            )
            .order_by("-units")[:5]
        )

        return Response(
            {
                "totals": {
                    "orders": orders_qs.count(),
                    "revenue": _money(total_revenue),
                    "customers": User.objects.filter(is_staff=False).count(),
                    "products": Product.objects.count(),
                    "active_products": Product.objects.filter(is_active=True).count(),
                },
                "orders_by_status": status_breakdown,
                "low_stock_products": [
                    {"id": p["id"], "name": p["name"], "slug": p["slug"], "stock": p["stock"]}
                    for p in low_stock_qs
                ],
                "low_stock_threshold": settings_obj.low_stock_threshold,
                "top_products": [
                    {"product_name": p["product_name"], "quantity": p["units"], "revenue": _money(p["line_revenue"])}
                    for p in top_products
                ],
            }
        )


class AdminReportsView(APIView):
    """
    Backs /admin/reports: date-ranged revenue/order/AOV/status-rate figures,
    a daily sales trend, and sales-by-product — computed authoritatively
    from Order/OrderItem rows for the requested [from, to] window.

    Query params: ``from``/``to`` as ISO dates (YYYY-MM-DD). Defaults to
    the trailing 30 days (inclusive) when omitted.
    """

    permission_classes = [IsAdminUser]

    def _parse_date(self, raw, fallback):
        if not raw:
            return fallback
        try:
            return datetime.strptime(raw, "%Y-%m-%d").date()
        except ValueError:
            return fallback

    def get(self, request):
        today = timezone.localdate()
        date_to = self._parse_date(request.query_params.get("to"), today)
        date_from = self._parse_date(request.query_params.get("from"), today - timedelta(days=29))

        orders_qs = Order.objects.filter(created_at__date__gte=date_from, created_at__date__lte=date_to)
        non_cancelled = orders_qs.exclude(status=Order.Status.CANCELLED)

        order_count = orders_qs.count()
        total_revenue = non_cancelled.aggregate(v=Coalesce(Sum("total"), 0, output_field=DecimalField()))["v"]
        aov = (total_revenue / non_cancelled.count()) if non_cancelled.count() else 0

        delivered_count = orders_qs.filter(status=Order.Status.DELIVERED).count()
        cancelled_count = orders_qs.filter(status=Order.Status.CANCELLED).count()
        delivered_rate = (delivered_count / order_count) if order_count else 0
        cancelled_rate = (cancelled_count / order_count) if order_count else 0

        trend_rows = (
            non_cancelled.annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(revenue=Coalesce(Sum("total"), 0, output_field=DecimalField()), orders=Count("id"))
            .order_by("day")
        )
        sales_trend = [
            {"date": row["day"].isoformat(), "revenue": _money(row["revenue"]), "orders": row["orders"]}
            for row in trend_rows
        ]

        sales_by_product = (
            OrderItem.objects.filter(
                order__created_at__date__gte=date_from,
                order__created_at__date__lte=date_to,
            )
            .exclude(order__status=Order.Status.CANCELLED)
            .values("product_name")
            .annotate(
                units=Coalesce(Sum("quantity"), 0),
                line_revenue=Coalesce(Sum(F("unit_price") * F("quantity"), output_field=DecimalField()), 0, output_field=DecimalField()),
            )
            .order_by("-line_revenue")[:10]
        )

        return Response(
            {
                "from": date_from.isoformat(),
                "to": date_to.isoformat(),
                "total_revenue": _money(total_revenue),
                "order_count": order_count,
                "average_order_value": _money(aov),
                "delivered_rate": round(delivered_rate, 4),
                "cancelled_rate": round(cancelled_rate, 4),
                "sales_trend": sales_trend,
                "sales_by_product": [
                    {"product_name": p["product_name"], "quantity": p["units"], "revenue": _money(p["line_revenue"])}
                    for p in sales_by_product
                ],
            }
        )
