import hashlib
import json
import tempfile
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import SimpleTestCase, TestCase, override_settings

from content.models import BlogPost, MediaAsset, SiteContent
from orders.models import Order
from products.management.commands.seed_demo import _media_url
from products.models import Category, Product, ProductImage


class _FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def read(self, *_args):
        return self._payload


def _fake_urlopen(request, timeout=None):
    """Stand-in for the Wikimedia Commons search API (no network in tests)."""
    key = hashlib.md5(request.full_url.encode()).hexdigest()[:10]
    pages = {
        str(i): {
            "title": f"File:Test-{key}-{i}.jpg",
            "imageinfo": [{
                "thumburl": f"https://upload.wikimedia.org/test/{key}-{i}.jpg",
                "extmetadata": {"LicenseShortName": {"value": "CC BY-SA 4.0"}, "Artist": {"value": "Test"}},
            }],
        }
        for i in range(12)
    }
    return _FakeResponse(json.dumps({"query": {"pages": pages}}).encode("utf-8"))


PATCH_DOWNLOAD = patch(
    "products.management.commands.seed_demo._download_real_image", return_value=b"fake-seed-image"
)
PATCH_SEARCH = patch("products.management.commands.seed_demo.urlopen", side_effect=_fake_urlopen)

EXPECTED_SLUGS = {
    "citrus", "dark", "forest", "sunflower", "blossom", "sunflower-honey", "royal-jelly",
}


@override_settings(MEDIA_ROOT=tempfile.mkdtemp(prefix="nika-seed-test-"))
class SeedDemoTests(TestCase):
    """`manage.py seed_demo` end-to-end with the network mocked."""

    def setUp(self):
        for p in (PATCH_DOWNLOAD, PATCH_SEARCH):
            p.start()
            self.addCleanup(p.stop)

    def test_seed_demo_populates_catalog_content_and_blog(self):
        call_command("seed_demo")

        self.assertEqual(Category.objects.count(), 2)
        self.assertEqual(Product.objects.count(), 7)
        self.assertEqual(set(Product.objects.values_list("slug", flat=True)), EXPECTED_SLUGS)

        jelly = Product.objects.get(name="ژل رویال")
        self.assertEqual(str(jelly.price), "600000.00")
        self.assertEqual((jelly.size_value, jelly.size_unit), (10, "g"))
        self.assertTrue(jelly.is_featured)
        self.assertTrue(jelly.is_active)
        self.assertIn("۵۰ گرمی: ۳٬۰۰۰٬۰۰۰ تومان", jelly.description)

        for product in Product.objects.filter(category__name="عسل‌ها"):
            self.assertEqual(str(product.price), "800000.00", product.name)
            self.assertEqual((product.size_value, product.size_unit), (500, "g"), product.name)
            self.assertFalse(product.is_featured, product.name)
            self.assertIn("۳٬۲۰۰٬۰۰۰ تومان", product.description, product.name)

        for product in Product.objects.all():
            self.assertTrue(product.description, f"{product.name} has no full description")
            self.assertGreaterEqual(product.images.count(), 3, product.name)
            self.assertEqual(product.images.filter(is_primary=True).count(), 1, product.name)

        # No demo accounts / orders are ever created.
        self.assertEqual(get_user_model().objects.count(), 0)
        self.assertEqual(Order.objects.count(), 0)

        self.assertEqual(BlogPost.objects.count(), 8)
        self.assertEqual(MediaAsset.objects.count(), 6)
        for post in BlogPost.objects.all():
            self.assertTrue(post.is_published)
            self.assertTrue(post.body)
            self.assertTrue(post.cover_image_url)
        self.assertTrue(BlogPost.objects.filter(slug="honey-and-infants").exists())
        self.assertTrue(BlogPost.objects.filter(slug="royal-jelly-guide").exists())

        content = SiteContent.load()
        self.assertTrue(content.video_embed_url)
        self.assertTrue(content.video_poster_image_url)
        self.assertTrue(content.hero_image_url)
        self.assertIn("۱٫۵ میلیون", content.topbar_message)
        self.assertEqual(content.contact_phone, "09365522762")
        self.assertEqual(content.contact_address, "استان گلستان، شهرستان کلاله، روستای یاساقلق")
        self.assertEqual(content.social_instagram, "https://www.instagram.com/Nika_honey1/")
        self.assertEqual(content.social_telegram, "https://t.me/Nika_honey1")
        self.assertEqual(content.social_whatsapp, "https://wa.me/989365522762")
        self.assertEqual(content.social_rubika, "https://rubika.ir/Nika_honey1")

    def test_seed_demo_is_idempotent(self):
        call_command("seed_demo")
        images = ProductImage.objects.count()
        call_command("seed_demo")

        self.assertEqual(Category.objects.count(), 2)
        self.assertEqual(Product.objects.count(), 7)
        self.assertEqual(ProductImage.objects.count(), images)
        self.assertEqual(BlogPost.objects.count(), 8)
        self.assertEqual(MediaAsset.objects.count(), 6)
        self.assertEqual(SiteContent.objects.count(), 1)
        self.assertEqual(get_user_model().objects.count(), 0)

    def test_seed_demo_frees_a_legacy_slug_held_by_another_product(self):
        category = Category.objects.create(name="عسل‌ها")
        legacy = Product.objects.create(name="عسل ترنجبین", slug="blossom", category=category, price=1, stock=1)
        call_command("seed_demo")

        legacy.refresh_from_db()
        self.assertEqual(legacy.slug, "blossom-legacy")
        self.assertEqual(Product.objects.get(name="عسلک ترنجبین").slug, "blossom")

    def test_seed_demo_never_overwrites_staff_uploaded_images(self):
        call_command("seed_demo")
        product = Product.objects.get(name="عسل مرکبات")
        before = product.images.count()

        call_command("seed_demo")

        self.assertEqual(product.images.count(), before)

    def test_seed_demo_updates_existing_contact_details(self):
        call_command("seed_demo")
        content = SiteContent.load()
        content.contact_phone = "021-00000000"
        content.contact_address = "تهران، ایران"
        content.social_instagram = "https://instagram.com/old"
        content.social_telegram = "https://t.me/old"
        content.social_whatsapp = "https://wa.me/989120000000"
        content.social_rubika = "https://rubika.ir/old"
        content.save()

        call_command("seed_demo")
        content.refresh_from_db()
        self.assertEqual(content.contact_phone, "09365522762")
        self.assertEqual(content.social_rubika, "https://rubika.ir/Nika_honey1")


@override_settings(MEDIA_ROOT=tempfile.mkdtemp(prefix="nika-seed-test-"))
class SeedDemoOfflineSearchTests(TestCase):
    """If Wikimedia is unreachable the catalog must still be created (no photos)."""

    @patch("products.management.commands.seed_demo._download_real_image", return_value=b"fake-seed-image")
    @patch("products.management.commands.seed_demo.urlopen", side_effect=OSError("blocked"))
    def test_products_created_when_image_search_fails(self, _urlopen, _download):
        call_command("seed_demo")
        self.assertEqual(Product.objects.count(), 7)
        self.assertEqual(ProductImage.objects.count(), 0)
        self.assertEqual(BlogPost.objects.count(), 8)

    @patch("products.management.commands.seed_demo._download_real_image", return_value=b"fake-seed-image")
    @patch("products.management.commands.seed_demo.urlopen", side_effect=OSError("blocked"))
    def test_require_images_flag_is_strict(self, _urlopen, _download):
        from django.core.management.base import CommandError
        with self.assertRaises(CommandError):
            call_command("seed_demo", require_images=True)


class MediaUrlHelperTests(SimpleTestCase):
    def test_relative_and_absolute_urls(self):
        class F:
            def __init__(self, url):
                self.url = url

            def __bool__(self):
                return True

        self.assertEqual(_media_url(F("/media/a.jpg")), "/media/a.jpg")
        self.assertEqual(_media_url(F("media/a.jpg")), "/media/a.jpg")
        self.assertEqual(_media_url(F("https://media.nikahoney.ir/a.jpg")), "https://media.nikahoney.ir/a.jpg")
        self.assertEqual(_media_url(None), "")
