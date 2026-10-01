from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from content.models import StoreSettings
from orders import services
from orders.models import Order
from products.models import Category, Product

User = get_user_model()


class ClosureBase(APITestCase):
    def setUp(self):
        cat = Category.objects.create(name="عسل‌ها")
        self.product = Product.objects.create(category=cat, name="عسل", price=Decimal("100000"), stock=20)
        self.user = User.objects.create_user(email="u@example.com", password="pw12345")
        self.other = User.objects.create_user(email="o@example.com", password="pw12345")
        self.staff = User.objects.create_user(email="s@example.com", password="pw12345", is_staff=True)

    def place(self, qty=1, **kw):
        body = {"items": [{"product_id": self.product.id, "quantity": qty}], **kw}
        return self.client.post("/api/v1/orders/", body, format="json")


class ShippingAndPaymentTests(ClosureBase):
    def test_default_shipping_zero(self):
        r = self.place(guest_email="g@example.com")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(Decimal(r.data["shipping_cost"]), 0)

    def test_flat_shipping_and_free_threshold(self):
        s = StoreSettings.load()
        s.shipping_flat_cost = Decimal("30000")
        s.free_shipping_threshold = Decimal("250000")
        s.save()
        r = self.place(qty=1, guest_email="g@example.com")
        self.assertEqual(Decimal(r.data["shipping_cost"]), 30000)
        self.assertEqual(Decimal(r.data["total"]), 130000)
        r = self.place(qty=3, guest_email="g@example.com")
        self.assertEqual(Decimal(r.data["shipping_cost"]), 0)

    def test_shipping_disabled(self):
        s = StoreSettings.load()
        s.shipping_flat_cost = Decimal("30000")
        s.shipping_enabled = False
        s.save()
        r = self.place(guest_email="g@example.com")
        self.assertEqual(Decimal(r.data["shipping_cost"]), 0)

    def test_client_cannot_set_shipping_or_paid(self):
        r = self.place(guest_email="g@example.com", shipping_cost=0, payment_status="paid", total=1)
        self.assertEqual(r.data["payment_status"], "unpaid")
        self.assertEqual(Decimal(r.data["total"]), 100000)

    def test_online_method_stored_but_not_paid(self):
        r = self.place(guest_email="g@example.com", payment_method="online")
        self.assertEqual(r.data["payment_method"], "online")
        self.assertEqual(r.data["payment_status"], "unpaid")
        self.assertIsNone(r.data["paid_at"])

    def test_invalid_payment_method(self):
        self.assertEqual(self.place(guest_email="g@example.com", payment_method="bitcoin").status_code, 400)

    def test_guest_checkout_disabled(self):
        s = StoreSettings.load()
        s.guest_checkout_enabled = False
        s.save()
        self.assertEqual(self.place(guest_email="g@example.com").status_code, 400)
        self.client.force_authenticate(self.user)
        self.assertEqual(self.place().status_code, 201)

    def test_staff_payment_action(self):
        order = services.create_order(user=self.user, line_requests=[{"product_id": self.product.id, "quantity": 1}])
        self.client.force_authenticate(self.user)
        r = self.client.patch(f"/api/v1/orders/{order.id}/payment/", {"payment_status": "paid"}, format="json")
        self.assertEqual(r.status_code, 403)
        self.client.force_authenticate(self.staff)
        r = self.client.patch(
            f"/api/v1/orders/{order.id}/payment/",
            {"payment_status": "paid", "payment_reference": "REF1"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["payment_status"], "paid")
        self.assertEqual(r.data["payment_reference"], "REF1")
        self.assertIsNotNone(r.data["paid_at"])


class InvoiceTests(ClosureBase):
    def test_invoice_number_and_snapshot(self):
        r = self.place(qty=2, guest_email="g@example.com")
        self.assertTrue(r.data["invoice_number"].startswith("NK-"))
        r2 = self.client.get(f"/api/v1/orders/by-number/{r.data['order_number']}/")
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.data["items"][0]["quantity"], 2)
        self.product.price = Decimal("1")
        self.product.save()
        r3 = self.client.get(f"/api/v1/orders/by-number/{r.data['order_number']}/")
        self.assertEqual(Decimal(r3.data["items"][0]["unit_price"]), 100000)

    def test_owned_order_isolation(self):
        order = services.create_order(user=self.user, line_requests=[{"product_id": self.product.id, "quantity": 1}])
        url = f"/api/v1/orders/by-number/{order.order_number}/"
        self.assertEqual(self.client.get(url).status_code, 403)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get(url).status_code, 403)
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get(url).status_code, 200)
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.get(url).status_code, 200)

    def test_unknown_order_404(self):
        self.assertEqual(
            self.client.get("/api/v1/orders/by-number/00000000-0000-0000-0000-000000000000/").status_code, 404)


class SettingsEndpointTests(ClosureBase):
    def test_public_read_staff_write(self):
        self.assertEqual(self.client.get("/api/v1/settings/").status_code, 200)
        self.assertIn(self.client.patch("/api/v1/settings/", {"low_stock_threshold": 9}, format="json").status_code, (401, 403))
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.patch("/api/v1/settings/", {"low_stock_threshold": 9}, format="json").status_code, 403)
        self.client.force_authenticate(self.staff)
        r = self.client.patch("/api/v1/settings/", {"low_stock_threshold": 9, "maintenance_mode": True}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["low_stock_threshold"], 9)
        self.assertTrue(StoreSettings.load().maintenance_mode)


class AnalyticsTests(ClosureBase):
    def test_staff_only(self):
        self.assertIn(self.client.get("/api/v1/admin/dashboard/").status_code, (401, 403))
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get("/api/v1/admin/reports/").status_code, 403)

    def test_dashboard_and_reports(self):
        o1 = services.create_order(user=self.user, line_requests=[{"product_id": self.product.id, "quantity": 2}])
        o2 = services.create_order(user=self.user, line_requests=[{"product_id": self.product.id, "quantity": 1}])
        services.transition_order_status(o2, "cancelled")
        self.client.force_authenticate(self.staff)
        d = self.client.get("/api/v1/admin/dashboard/").data
        self.assertEqual(d["totals"]["orders"], 2)
        self.assertEqual(d["totals"]["revenue"], 200000.0)  # cancelled excluded
        self.assertEqual(d["orders_by_status"]["cancelled"], 1)
        self.assertEqual(d["top_products"][0]["quantity"], 2)
        self.product.stock = 2
        self.product.save()
        d = self.client.get("/api/v1/admin/dashboard/").data
        self.assertEqual(len(d["low_stock_products"]), 1)
        r = self.client.get("/api/v1/admin/reports/").data
        self.assertEqual(r["order_count"], 2)
        self.assertEqual(r["total_revenue"], 200000.0)
        self.assertEqual(r["average_order_value"], 200000.0)
        self.assertEqual(r["cancelled_rate"], 0.5)
        self.assertEqual(len(r["sales_trend"]), 1)
        self.assertEqual(r["sales_by_product"][0]["revenue"], 200000.0)
        r = self.client.get("/api/v1/admin/reports/?from=2000-01-01&to=2000-01-02").data
        self.assertEqual(r["order_count"], 0)
        self.assertEqual(r["average_order_value"], 0)
