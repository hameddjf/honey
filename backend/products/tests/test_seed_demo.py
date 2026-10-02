import tempfile
from pathlib import Path
from unittest.mock import patch

from django.core.management import CommandError, call_command
from django.test import TestCase, override_settings

from content.models import BlogPost, MediaAsset, SiteContent
from orders.models import Order
from products.management.commands import seed_demo
from products.models import Category, Product, ProductImage

DOWNLOAD = "products.management.commands.seed_demo._download_real_image"


class SeedDemoTests(TestCase):
    """
    Exercises `python manage.py seed_demo` end-to-end (including the
    real-photo download path, mocked so tests run offline and never write
    into the real project folders) against a fresh test database, and locks
    in that running it twice never duplicates data.
    """

    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.cache_dir = Path(tmp.name) / "downloaded"
        self.public_dir = Path(tmp.name) / "public"
        self.public_dir.mkdir()
        media = override_settings(MEDIA_ROOT=str(Path(tmp.name) / "media"))
        media.enable()
        self.addCleanup(media.disable)
        for target, value in (
            ("ASSETS_CACHE_DIR", self.cache_dir),
            ("FRONTEND_PUBLIC_DIR", self.public_dir),
        ):
            patcher = patch.object(seed_demo, target, value)
            patcher.start()
            self.addCleanup(patcher.stop)

    @patch(DOWNLOAD, return_value=b"fake-seed-image")
    def test_seed_demo_populates_everything(self, _download):
        call_command("seed_demo")

        self.assertEqual(Category.objects.count(), 2)
        self.assertEqual(Product.objects.count(), 7)
        # 2 images (1 primary + 1 secondary) per product.
        self.assertEqual(ProductImage.objects.count(), 14)
        for product in Product.objects.all():
            self.assertTrue(product.description, f"{product.name} has no full description")
            self.assertEqual(product.images.filter(is_primary=True).count(), 1)
            for image in product.images.all():
                self.assertIn("seed-photo-", image.image.name)
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

    @patch(DOWNLOAD, return_value=b"fake-seed-image")
    def test_photos_are_saved_inside_the_project(self, _download):
        call_command("seed_demo")

        # download cache (backend) ...
        for slug in seed_demo.PRODUCT_PHOTO_SOURCES:
            self.assertTrue((self.cache_dir / f"product-{slug}-primary.jpg").is_file())
            self.assertTrue((self.cache_dir / f"product-{slug}-detail.jpg").is_file())
        # ... and the exact paths the storefront references (frontend/public)
        for slug in seed_demo.PRODUCT_PHOTO_SOURCES:
            self.assertTrue((self.public_dir / "images" / "products" / f"{slug}.jpg").is_file())
            self.assertTrue((self.public_dir / "images" / "products" / f"{slug}-detail.jpg").is_file())
        for key in seed_demo.POSTER_SOURCES:
            self.assertTrue((self.public_dir / "images" / "posters" / f"{key}.jpg").is_file())

    @patch(DOWNLOAD, return_value=b"fake-seed-image")
    def test_second_run_reuses_cache_and_does_not_download_again(self, download):
        call_command("seed_demo")
        first_run_calls = download.call_count
        self.assertGreater(first_run_calls, 0)

        call_command("seed_demo")
        self.assertEqual(download.call_count, first_run_calls)

        call_command("seed_demo", refresh=True)
        self.assertGreater(download.call_count, first_run_calls)

    @patch(DOWNLOAD, return_value=b"fake-seed-image")
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

    @patch(DOWNLOAD, return_value=b"fake-seed-image")
    def test_seed_demo_never_overwrites_a_real_staff_uploaded_image(self, _download):
        """A product that already has an image must not be overwritten or
        duplicated by seed_demo."""
        call_command("seed_demo")
        product = Product.objects.get(name="عسل مرکبات")
        before = product.images.count()

        call_command("seed_demo")

        self.assertEqual(product.images.count(), before)

    @patch(DOWNLOAD, side_effect=seed_demo.CommandError("network down"))
    def test_strict_mode_fails_when_downloads_fail(self, _download):
        with self.assertRaises(CommandError):
            call_command("seed_demo", strict=True)
        self.assertEqual(Product.objects.count(), 0)  # nothing half-seeded
