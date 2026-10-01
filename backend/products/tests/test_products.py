from decimal import Decimal
from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from products.models import Category, Product, ProductImage

User = get_user_model()


class ProductModelTests(APITestCase):
    def test_slug_is_generated_from_name(self):
        category = Category.objects.create(name="عسل‌ها")
        product = Product.objects.create(category=category, name="عسل کلزا", price=Decimal("100000"))
        self.assertTrue(product.slug)

    def test_is_in_stock_property(self):
        category = Category.objects.create(name="عسل‌ها")
        in_stock = Product.objects.create(
            category=category, name="A", price=Decimal("1"), stock=5
        )
        out_of_stock = Product.objects.create(
            category=category, name="B", price=Decimal("1"), stock=0
        )
        self.assertTrue(in_stock.is_in_stock)
        self.assertFalse(out_of_stock.is_in_stock)


class ProductAPITests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="عسل‌ها")
        self.product = Product.objects.create(
            category=self.category, name="عسل نمدار", price=Decimal("470000"), stock=10
        )
        self.inactive_product = Product.objects.create(
            category=self.category, name="Hidden", price=Decimal("1"), stock=1, is_active=False
        )
        self.staff = User.objects.create_user(email="staff@example.com", password="pw12345", is_staff=True)
        self.customer = User.objects.create_user(email="cust@example.com", password="pw12345")

    def test_anonymous_can_list_active_products_only(self):
        response = self.client.get(reverse("product-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [p["name"] for p in response.data["results"]]
        self.assertIn("عسل نمدار", names)
        self.assertNotIn("Hidden", names)

    def test_anonymous_cannot_create_product(self):
        response = self.client.post(
            reverse("product-list"),
            {"name": "New", "category": self.category.slug, "price": "1000", "stock": 1},
        )
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_customer_cannot_create_product(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(
            reverse("product-list"),
            {"name": "New", "category": self.category.slug, "price": "1000", "stock": 1},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_create_product(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(
            reverse("product-list"),
            {"name": "New Product", "category": self.category.slug, "price": "1000", "stock": 1},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_negative_price_is_rejected(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(
            reverse("product-list"),
            {"name": "Bad", "category": self.category.slug, "price": "-5", "stock": 1},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ProductFilterTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="عسل‌ها")
        self.cheap = Product.objects.create(
            category=self.category, name="ارزان", price=Decimal("100000"), stock=5
        )
        self.expensive = Product.objects.create(
            category=self.category, name="گران", price=Decimal("900000"), stock=0
        )

    def test_price_range_filter(self):
        response = self.client.get(reverse("product-list"), {"price_min": "50000", "price_max": "200000"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [p["name"] for p in response.data["results"]]
        self.assertIn("ارزان", names)
        self.assertNotIn("گران", names)

    def test_in_stock_filter(self):
        response = self.client.get(reverse("product-list"), {"in_stock": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [p["name"] for p in response.data["results"]]
        self.assertIn("ارزان", names)
        self.assertNotIn("گران", names)

    def test_ordering_by_price(self):
        response = self.client.get(reverse("product-list"), {"ordering": "price"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        prices = [Decimal(p["price"]) for p in response.data["results"]]
        self.assertEqual(prices, sorted(prices))


class CategoryProductCountTests(APITestCase):
    def test_category_reports_product_count(self):
        category = Category.objects.create(name="ژل رویال و ترکیبات ویژه")
        Product.objects.create(category=category, name="A", price=Decimal("1"), stock=1)
        Product.objects.create(category=category, name="B", price=Decimal("1"), stock=1)
        response = self.client.get(reverse("category-detail", kwargs={"slug": category.slug}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["product_count"], 2)


def make_test_image(name="test.png", size=(10, 10), color=(255, 165, 0)):
    """A tiny real (Pillow-encoded) PNG — needed because Product.image is an
    ImageField, which validates the upload is a genuine decodable image."""
    buf = BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type="image/png")


class ProductSizeUnitValidationTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="عسل‌ها")
        self.staff = User.objects.create_user(email="size-staff@example.com", password="pw12345", is_staff=True)
        self.client.force_authenticate(user=self.staff)

    def _payload(self, **overrides):
        payload = {"name": "محصول اندازه‌دار", "category": self.category.slug, "price": "1000", "stock": 1}
        payload.update(overrides)
        return payload

    def test_size_value_with_unit_is_accepted(self):
        response = self.client.post(
            reverse("product-list"), self._payload(size_value="500", size_unit="g")
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["size_value"], "500.00")
        self.assertEqual(response.data["size_unit"], "g")

    def test_size_value_without_unit_is_rejected(self):
        response = self.client.post(reverse("product-list"), self._payload(size_value="500"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("size_unit", response.data)

    def test_size_unit_without_value_is_rejected(self):
        response = self.client.post(reverse("product-list"), self._payload(size_unit="kg"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("size_value", response.data)

    def test_zero_or_negative_size_value_is_rejected(self):
        response = self.client.post(
            reverse("product-list"), self._payload(size_value="0", size_unit="g")
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_size_unit_is_rejected(self):
        response = self.client.post(
            reverse("product-list"), self._payload(size_value="500", size_unit="bananas")
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_product_with_neither_size_field_is_still_valid(self):
        response = self.client.post(reverse("product-list"), self._payload())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)


class ProductPreviousPriceValidationTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="عسل‌ها")
        self.staff = User.objects.create_user(email="pp-staff@example.com", password="pw12345", is_staff=True)
        self.client.force_authenticate(user=self.staff)

    def test_previous_price_above_price_is_accepted(self):
        response = self.client.post(
            reverse("product-list"),
            {
                "name": "تخفیف‌دار",
                "category": self.category.slug,
                "price": "400000",
                "previous_price": "450000",
                "stock": 1,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_previous_price_below_price_is_rejected(self):
        response = self.client.post(
            reverse("product-list"),
            {
                "name": "نامعتبر",
                "category": self.category.slug,
                "price": "400000",
                "previous_price": "350000",
                "stock": 1,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("previous_price", response.data)

    def test_negative_previous_price_is_rejected(self):
        response = self.client.post(
            reverse("product-list"),
            {
                "name": "منفی",
                "category": self.category.slug,
                "price": "400000",
                "previous_price": "-10",
                "stock": 1,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_partial_update_checks_previous_price_against_existing_price(self):
        """A PATCH that only sends previous_price must still be validated
        against the product's *existing* price (self._current in the
        serializer), not silently skipped because price wasn't resent."""
        product = Product.objects.create(
            category=self.category, name="موجود", price=Decimal("400000"), stock=1
        )
        response = self.client.patch(
            reverse("product-detail", kwargs={"slug": product.slug}), {"previous_price": "100000"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ProductImageTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="عسل‌ها")
        self.product = Product.objects.create(
            category=self.category, name="محصول تصویردار", price=Decimal("100000"), stock=5
        )
        self.staff = User.objects.create_user(email="img-staff@example.com", password="pw12345", is_staff=True)
        self.customer = User.objects.create_user(email="img-cust@example.com", password="pw12345")

    def _upload_url(self):
        return reverse("product-upload-image", kwargs={"slug": self.product.slug})

    def _image_url(self, image_id):
        return reverse("product-update-image", kwargs={"slug": self.product.slug, "image_id": image_id})

    def test_staff_can_upload_image(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(self._upload_url(), {"image": make_test_image()}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(ProductImage.objects.filter(product=self.product).count(), 1)

    def test_customer_cannot_upload_image(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(self._upload_url(), {"image": make_test_image()}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_upload_image(self):
        response = self.client.post(self._upload_url(), {"image": make_test_image()}, format="multipart")
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_first_uploaded_image_becomes_primary_automatically(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(self._upload_url(), {"image": make_test_image()}, format="multipart")
        self.assertTrue(response.data["is_primary"])

    def test_second_image_is_not_primary_by_default(self):
        self.client.force_authenticate(user=self.staff)
        self.client.post(self._upload_url(), {"image": make_test_image("a.png")}, format="multipart")
        second = self.client.post(self._upload_url(), {"image": make_test_image("b.png")}, format="multipart")
        self.assertFalse(second.data["is_primary"])
        self.assertEqual(ProductImage.objects.filter(product=self.product, is_primary=True).count(), 1)

    def test_only_one_primary_image_per_product_when_choosing_primary(self):
        self.client.force_authenticate(user=self.staff)
        first = self.client.post(self._upload_url(), {"image": make_test_image("a.png")}, format="multipart").data
        second = self.client.post(self._upload_url(), {"image": make_test_image("b.png")}, format="multipart").data

        response = self.client.patch(self._image_url(second["id"]), {"is_primary": True}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_primary"])

        self.assertEqual(ProductImage.objects.filter(product=self.product, is_primary=True).count(), 1)
        self.assertFalse(ProductImage.objects.get(pk=first["id"]).is_primary)
        self.assertTrue(ProductImage.objects.get(pk=second["id"]).is_primary)

    def test_deleting_primary_image_promotes_the_next_one(self):
        self.client.force_authenticate(user=self.staff)
        first = self.client.post(
            self._upload_url(), {"image": make_test_image("a.png"), "sort_order": 0}, format="multipart"
        ).data
        second = self.client.post(
            self._upload_url(), {"image": make_test_image("b.png"), "sort_order": 1}, format="multipart"
        ).data
        self.assertTrue(first["is_primary"])

        response = self.client.delete(self._image_url(first["id"]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(ProductImage.objects.filter(pk=first["id"]).exists())
        second_image = ProductImage.objects.get(pk=second["id"])
        self.assertTrue(second_image.is_primary)

    def test_customer_cannot_delete_image(self):
        self.client.force_authenticate(user=self.staff)
        image = self.client.post(self._upload_url(), {"image": make_test_image()}, format="multipart").data
        self.client.force_authenticate(user=self.customer)
        response = self.client.delete(self._image_url(image["id"]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(ProductImage.objects.filter(pk=image["id"]).exists())

    def test_public_product_response_includes_images(self):
        self.client.force_authenticate(user=self.staff)
        self.client.post(self._upload_url(), {"image": make_test_image()}, format="multipart")

        self.client.force_authenticate(user=None)
        response = self.client.get(reverse("product-detail", kwargs={"slug": self.product.slug}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["images"]), 1)
        image_data = response.data["images"][0]
        self.assertEqual(set(image_data.keys()), {"id", "url", "alt_text", "sort_order", "is_primary"})
        self.assertTrue(image_data["url"])

    def test_oversized_image_is_rejected(self):
        self.client.force_authenticate(user=self.staff)
        # Uncompressed PPM (no compression) of random noise so the actual
        # encoded byte size is genuinely over the 5 MB limit, not just an
        # attribute set after the fact.
        import os

        buf = BytesIO()
        Image.frombytes("RGB", (1600, 1600), os.urandom(1600 * 1600 * 3)).save(buf, format="PPM")
        buf.seek(0)
        big = SimpleUploadedFile("big.ppm", buf.read(), content_type="image/x-portable-pixmap")
        self.assertGreater(big.size, 5 * 1024 * 1024)
        response = self.client.post(self._upload_url(), {"image": big}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
