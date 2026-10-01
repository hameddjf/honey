import threading
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import connection
from django.test import TransactionTestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from orders import services
from orders.models import Order, OrderItem
from products.models import Category, Product

User = get_user_model()


class OrderPricingServiceTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="عسل‌ها")
        self.product = Product.objects.create(
            category=self.category, name="عسل مرکبات", price=Decimal("450000.00"), stock=10
        )
        self.user = User.objects.create_user(email="pricing@example.com", password="pw12345")

    def test_order_total_is_computed_server_side(self):
        order = services.create_order(
            user=self.user,
            guest_email="",
            line_requests=[{"product_id": self.product.id, "quantity": 3}],
        )
        self.assertEqual(order.subtotal, Decimal("1350000.00"))
        self.assertEqual(order.total, order.subtotal + order.shipping_cost)

    def test_order_item_snapshots_price_and_name(self):
        order = services.create_order(
            user=self.user, guest_email="", line_requests=[{"product_id": self.product.id, "quantity": 1}]
        )
        item = order.items.first()
        self.assertEqual(item.unit_price, self.product.price)
        self.assertEqual(item.product_name, self.product.name)

        # Changing the product afterwards must not change the historical order.
        self.product.price = Decimal("999999.00")
        self.product.name = "Renamed"
        self.product.save()
        item.refresh_from_db()
        self.assertEqual(item.unit_price, Decimal("450000.00"))
        self.assertEqual(item.product_name, "عسل مرکبات")

    def test_order_reduces_product_stock(self):
        services.create_order(
            user=self.user, guest_email="", line_requests=[{"product_id": self.product.id, "quantity": 4}]
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 6)

    def test_insufficient_stock_is_rejected(self):
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            services.create_order(
                user=self.user,
                guest_email="",
                line_requests=[{"product_id": self.product.id, "quantity": 999}],
            )

    def test_invalid_product_is_rejected(self):
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            services.create_order(
                user=self.user, guest_email="", line_requests=[{"product_id": 999999, "quantity": 1}]
            )

    def test_order_requires_user_or_guest_email(self):
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            services.create_order(
                user=None, guest_email="", line_requests=[{"product_id": self.product.id, "quantity": 1}]
            )


class OrderInventoryLockingTests(TransactionTestCase):
    """
    Exercises the select_for_update() fix in services.create_order: two
    orders racing for the same last unit(s) of stock must never both
    succeed. Uses TransactionTestCase (real commits, not the outer
    rollback TestCase normally wraps tests in) so the two threads below
    actually see each other's in-flight transaction the way they would
    in production.
    """

    def setUp(self):
        self.category = Category.objects.create(name="عسل‌ها")
        self.product = Product.objects.create(
            category=self.category, name="عسل محدود", price=Decimal("100000.00"), stock=1
        )
        self.user_a = User.objects.create_user(email="race-a@example.com", password="pw12345")
        self.user_b = User.objects.create_user(email="race-b@example.com", password="pw12345")

    def test_two_concurrent_orders_cannot_both_claim_the_last_unit(self):
        results = {}

        def place_order(key, user):
            try:
                services.create_order(
                    user=user,
                    guest_email="",
                    line_requests=[{"product_id": self.product.id, "quantity": 1}],
                )
                results[key] = "ok"
            except Exception:  # noqa: BLE001 - ValidationError or a DB-level failure both count as "rejected"
                results[key] = "rejected"
            finally:
                connection.close()  # each thread needs its own DB connection

        t1 = threading.Thread(target=place_order, args=("a", self.user_a))
        t2 = threading.Thread(target=place_order, args=("b", self.user_b))
        t1.start()
        t2.start()
        t1.join(timeout=10)
        t2.join(timeout=10)

        outcomes = list(results.values())
        self.assertEqual(outcomes.count("ok"), 1, f"expected exactly one order to succeed, got {results}")
        self.assertEqual(outcomes.count("rejected"), 1, f"expected exactly one order to be rejected, got {results}")

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 0)
        self.assertEqual(
            OrderItem.objects.filter(product=self.product).count(),
            1,
            "the last unit of stock must never be sold twice",
        )


class OrderAPITests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="عسل‌ها")
        self.product = Product.objects.create(
            category=self.category, name="عسل کلزا", price=Decimal("380000.00"), stock=10
        )
        self.user = User.objects.create_user(email="buyer@example.com", password="pw12345")
        self.other_user = User.objects.create_user(email="other@example.com", password="pw12345")

    def test_client_supplied_price_is_ignored(self):
        """Server must never trust a price/total sent by the client."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse("order-list"),
            {
                "items": [{"product_id": self.product.id, "quantity": 2, "price": "1", "total": "1"}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data["subtotal"]), Decimal("760000.00"))

    def test_guest_checkout_is_allowed(self):
        response = self.client.post(
            reverse("order-list"),
            {
                "guest_email": "guest@example.com",
                "items": [{"product_id": self.product.id, "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_invalid_quantity_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse("order-list"),
            {"items": [{"product_id": self.product.id, "quantity": 0}]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_cannot_see_other_users_orders(self):
        services.create_order(
            user=self.other_user, guest_email="", line_requests=[{"product_id": self.product.id, "quantity": 1}]
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse("order-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    def test_unauthenticated_user_cannot_list_orders(self):
        response = self.client.get(reverse("order-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class OrderStatusTransitionTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="عسل‌ها")
        self.product = Product.objects.create(
            category=self.category, name="عسل ترنجبین", price=Decimal("490000.00"), stock=10
        )
        self.staff = User.objects.create_user(email="statusstaff@example.com", password="pw12345", is_staff=True)
        self.customer = User.objects.create_user(email="statuscust@example.com", password="pw12345")
        self.order = services.create_order(
            user=self.customer, guest_email="", line_requests=[{"product_id": self.product.id, "quantity": 1}]
        )

    def _status_url(self, order):
        return reverse("order-status", kwargs={"pk": order.pk})

    def test_staff_can_advance_status_through_valid_sequence(self):
        self.client.force_authenticate(user=self.staff)
        for next_status in ["confirmed", "preparing", "shipped", "delivered"]:
            response = self.client.patch(self._status_url(self.order), {"status": next_status}, format="json")
            self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
            self.assertEqual(response.data["status"], next_status)

    def test_cannot_skip_stages(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(self._status_url(self.order), {"status": "delivered"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_leave_terminal_status(self):
        self.client.force_authenticate(user=self.staff)
        services.transition_order_status(self.order, Order.Status.CANCELLED)
        response = self.client.patch(self._status_url(self.order), {"status": "confirmed"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_customer_cannot_update_status(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.patch(self._status_url(self.order), {"status": "confirmed"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_update_status(self):
        response = self.client.patch(self._status_url(self.order), {"status": "confirmed"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cancellation_allowed_from_pending(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(self._status_url(self.order), {"status": "cancelled"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cancellation_not_allowed_after_shipped(self):
        services.transition_order_status(self.order, Order.Status.CONFIRMED)
        services.transition_order_status(self.order, Order.Status.PREPARING)
        services.transition_order_status(self.order, Order.Status.SHIPPED)
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(self._status_url(self.order), {"status": "cancelled"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class OrderStaffListingTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="عسل‌ها")
        self.product = Product.objects.create(
            category=self.category, name="عسل خارشتر", price=Decimal("410000.00"), stock=20
        )
        self.staff = User.objects.create_user(email="liststaff@example.com", password="pw12345", is_staff=True)
        self.customer_a = User.objects.create_user(email="lista@example.com", password="pw12345")
        self.customer_b = User.objects.create_user(email="listb@example.com", password="pw12345")
        self.order_a = services.create_order(
            user=self.customer_a, guest_email="", line_requests=[{"product_id": self.product.id, "quantity": 1}]
        )
        self.order_b = services.create_order(
            user=self.customer_b, guest_email="", line_requests=[{"product_id": self.product.id, "quantity": 1}]
        )
        services.transition_order_status(self.order_b, Order.Status.CONFIRMED)

    def test_staff_sees_every_order(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get(reverse("order-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 2)

    def test_staff_can_filter_by_status(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get(reverse("order-list"), {"status": "confirmed"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [o["id"] for o in response.data["results"]]
        self.assertIn(self.order_b.id, ids)
        self.assertNotIn(self.order_a.id, ids)

    def test_staff_can_search_by_customer_email(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get(reverse("order-list"), {"search": "lista@example.com"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [o["id"] for o in response.data["results"]]
        self.assertIn(self.order_a.id, ids)
        self.assertNotIn(self.order_b.id, ids)


class ShippingAndPaymentMethodTests(APITestCase):
    """Project brief (closure pass 2), sections 2 and 3."""

    def setUp(self):
        self.category = Category.objects.create(name="عسل‌ها")
        self.product = Product.objects.create(
            category=self.category, name="عسل مرکبات", price=Decimal("100000.00"), stock=50
        )
        self.user = User.objects.create_user(email="ship@example.com", password="pw12345")

    def test_flat_shipping_applies_below_threshold(self):
        from content.models import StoreSettings

        settings_obj = StoreSettings.load()
        settings_obj.shipping_enabled = True
        settings_obj.shipping_flat_cost = Decimal("50000.00")
        settings_obj.free_shipping_threshold = Decimal("500000.00")
        settings_obj.save()

        order = services.create_order(
            user=self.user, guest_email="", line_requests=[{"product_id": self.product.id, "quantity": 1}]
        )
        self.assertEqual(order.shipping_cost, Decimal("50000.00"))
        self.assertEqual(order.total, order.subtotal + Decimal("50000.00"))

    def test_free_shipping_above_threshold(self):
        from content.models import StoreSettings

        settings_obj = StoreSettings.load()
        settings_obj.shipping_enabled = True
        settings_obj.shipping_flat_cost = Decimal("50000.00")
        settings_obj.free_shipping_threshold = Decimal("500000.00")
        settings_obj.save()

        order = services.create_order(
            user=self.user, guest_email="", line_requests=[{"product_id": self.product.id, "quantity": 6}]
        )
        self.assertEqual(order.subtotal, Decimal("600000.00"))
        self.assertEqual(order.shipping_cost, Decimal("0"))

    def test_shipping_disabled_is_always_zero(self):
        from content.models import StoreSettings

        settings_obj = StoreSettings.load()
        settings_obj.shipping_enabled = False
        settings_obj.shipping_flat_cost = Decimal("99999.00")
        settings_obj.save()

        order = services.create_order(
            user=self.user, guest_email="", line_requests=[{"product_id": self.product.id, "quantity": 1}]
        )
        self.assertEqual(order.shipping_cost, Decimal("0"))

    def test_guest_checkout_can_be_disabled(self):
        from content.models import StoreSettings

        settings_obj = StoreSettings.load()
        settings_obj.guest_checkout_enabled = False
        settings_obj.save()

        with self.assertRaises(Exception):
            services.create_order(
                guest_email="guest@example.com",
                line_requests=[{"product_id": self.product.id, "quantity": 1}],
            )

    def test_payment_method_is_stored_but_never_marks_paid(self):
        order = services.create_order(
            user=self.user,
            guest_email="",
            payment_method="online",
            line_requests=[{"product_id": self.product.id, "quantity": 1}],
        )
        self.assertEqual(order.payment_method, "online")
        self.assertEqual(order.payment_status, Order.PaymentStatus.UNPAID)
        self.assertIsNone(order.paid_at)

    def test_checkout_can_send_payment_method_via_api(self):
        response = self.client.post(
            reverse("order-list"),
            {
                "guest_email": "checkout@example.com",
                "items": [{"product_id": self.product.id, "quantity": 1}],
                "payment_method": "cod",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["payment_method"], "cod")
        self.assertEqual(response.data["payment_status"], "unpaid")


class OrderPaymentActionTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="عسل‌ها")
        self.product = Product.objects.create(
            category=self.category, name="عسل مرکبات", price=Decimal("100000.00"), stock=10
        )
        self.staff = User.objects.create_user(email="staffpay@example.com", password="pw12345", is_staff=True)
        self.customer = User.objects.create_user(email="custpay@example.com", password="pw12345")
        self.order = services.create_order(
            user=self.customer,
            guest_email="",
            payment_method="online",
            line_requests=[{"product_id": self.product.id, "quantity": 1}],
        )

    def test_staff_can_mark_order_paid(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(
            reverse("order-payment", kwargs={"pk": self.order.pk}),
            {"payment_status": "paid", "payment_reference": "TX-123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["payment_status"], "paid")
        self.assertEqual(response.data["payment_reference"], "TX-123")
        self.assertIsNotNone(response.data["paid_at"])

    def test_customer_cannot_mark_own_order_paid(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.patch(
            reverse("order-payment", kwargs={"pk": self.order.pk}),
            {"payment_status": "paid"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_mark_paid(self):
        response = self.client.patch(
            reverse("order-payment", kwargs={"pk": self.order.pk}),
            {"payment_status": "paid"},
            format="json",
        )
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))


class OrderByNumberInvoiceLookupTests(APITestCase):
    """Project brief (closure pass 2) section 1: owner-scoped invoice access."""

    def setUp(self):
        self.category = Category.objects.create(name="عسل‌ها")
        self.product = Product.objects.create(
            category=self.category, name="عسل مرکبات", price=Decimal("100000.00"), stock=10
        )
        self.owner = User.objects.create_user(email="invowner@example.com", password="pw12345")
        self.other_user = User.objects.create_user(email="invother@example.com", password="pw12345")
        self.staff = User.objects.create_user(email="invstaff@example.com", password="pw12345", is_staff=True)

        self.owned_order = services.create_order(
            user=self.owner, guest_email="", line_requests=[{"product_id": self.product.id, "quantity": 1}]
        )
        self.guest_order = services.create_order(
            guest_email="guestinv@example.com",
            line_requests=[{"product_id": self.product.id, "quantity": 1}],
        )

    def _url(self, order):
        return reverse("order-by-number", kwargs={"order_number": str(order.order_number)})

    def test_owner_can_view_their_own_invoice(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(self._url(self.owned_order))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["order_number"], str(self.owned_order.order_number))
        self.assertTrue(response.data["invoice_number"].startswith("NK-"))

    def test_other_authenticated_user_cannot_view_someone_elses_invoice(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(self._url(self.owned_order))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_view_an_owned_order_invoice(self):
        response = self.client.get(self._url(self.owned_order))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_view_any_invoice(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get(self._url(self.owned_order))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_anonymous_can_view_guest_order_invoice_by_uuid(self):
        response = self.client.get(self._url(self.guest_order))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["guest_email"], "guestinv@example.com")

    def test_unknown_order_number_is_404(self):
        response = self.client.get(reverse("order-by-number", kwargs={"order_number": "00000000-0000-0000-0000-000000000000"}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
