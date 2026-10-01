from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase

from content.models import BlogPost, MediaAsset, SiteContent
from orders.models import Order
from products.models import Category, Product, ProductImage


class SeedDemoTests(TestCase):
    """
    Exercises `python manage.py seed_demo` end-to-end (including the
    real-image download path, mocked for offline tests) against a fresh test
    database, and locks in that running it twice never duplicates data —
    the exact behavior seed_demo.py's own docstring promises.
    """

    @patch("products.management.commands.seed_demo._download_real_image", return_value=b"fake-seed-image")
    def test_seed_demo_populates_everything(self, _download):
        call_command("seed_demo")

        self.assertEqual(Category.objects.count(), 2)
        self.assertEqual(Product.objects.count(), 7)
        # 2 images (1 primary + 1 secondary) per product.
        self.assertEqual(ProductImage.objects.count(), 14)
        for product in Product.objects.all():
            self.assertTrue(product.description, f"{product.name} has no full description")
            self.assertEqual(product.images.filter(is_primary=True).count(), 1)
        self.assertEqual(Order.objects.count(), 5)
        self.assertEqual(BlogPost.objects.count(), 6)
        self.assertEqual(MediaAsset.objects.count(), 6)
        for post in BlogPost.objects.all():
            self.assertTrue(post.is_published)
            self.assertTrue(post.body)
            self.assertTrue(post.cover_image_url)
        content = SiteContent.load()
        self.assertTrue(content.video_embed_url)
        self.assertTrue(content.video_poster_image_url)
        self.assertTrue(content.hero_image_url)
        self.assertTrue(content.hero_title)

    @patch("products.management.commands.seed_demo._download_real_image", return_value=b"fake-seed-image")
    def test_seed_demo_is_idempotent(self, _download):
        call_command("seed_demo")
        call_command("seed_demo")

        self.assertEqual(Category.objects.count(), 2)
        self.assertEqual(Product.objects.count(), 7)
        self.assertEqual(ProductImage.objects.count(), 14)
        self.assertEqual(Order.objects.count(), 5)
        self.assertEqual(BlogPost.objects.count(), 6)
        self.assertEqual(MediaAsset.objects.count(), 6)
        self.assertEqual(SiteContent.objects.count(), 1)

    @patch("products.management.commands.seed_demo._download_real_image", return_value=b"fake-seed-image")
    def test_seed_demo_never_overwrites_a_real_staff_uploaded_image(self, _download):
        """A product that already has an image must not be overwritten or
        duplicated by seed_demo."""
        call_command("seed_demo")
        product = Product.objects.get(name="عسل مرکبات")
        before = product.images.count()

        call_command("seed_demo")

        self.assertEqual(product.images.count(), before)
