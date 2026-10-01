import io

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from content.models import BlogPost, MediaAsset, SiteContent, StoreSettings
from django.contrib.auth import get_user_model

User = get_user_model()


def _tiny_jpeg():
    """A minimal valid-enough in-memory JPEG for upload tests (Pillow-free)."""
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (4, 4), color=(200, 150, 10)).save(buf, format="JPEG")
    buf.seek(0)
    return SimpleUploadedFile("test.jpg", buf.read(), content_type="image/jpeg")


class SiteContentTests(APITestCase):
    def test_public_can_read_content(self):
        response = self.client.get(reverse("site-content"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("hero_title", response.data)

    def test_content_is_a_singleton(self):
        SiteContent.load()
        SiteContent.load()
        self.assertEqual(SiteContent.objects.count(), 1)

    def test_anonymous_cannot_update_content(self):
        response = self.client.patch(reverse("site-content"), {"hero_title": "Hacked"}, format="json")
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_customer_cannot_update_content(self):
        customer = User.objects.create_user(email="contentcust@example.com", password="pw12345")
        self.client.force_authenticate(user=customer)
        response = self.client.patch(reverse("site-content"), {"hero_title": "Hacked"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_update_content(self):
        staff = User.objects.create_user(email="contentstaff@example.com", password="pw12345", is_staff=True)
        self.client.force_authenticate(user=staff)
        response = self.client.patch(
            reverse("site-content"), {"hero_title": "عسل تازه", "promo_is_active": True}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["hero_title"], "عسل تازه")
        self.assertTrue(response.data["promo_is_active"])

    def test_update_does_not_create_a_second_row(self):
        staff = User.objects.create_user(email="contentstaff2@example.com", password="pw12345", is_staff=True)
        self.client.force_authenticate(user=staff)
        self.client.patch(reverse("site-content"), {"hero_title": "A"}, format="json")
        self.client.patch(reverse("site-content"), {"hero_title": "B"}, format="json")
        self.assertEqual(SiteContent.objects.count(), 1)

    def test_video_fields_are_readable_and_writable(self):
        """The intro video used to be a frontend-only (localStorage) value;
        this locks in that it's now a real, persisted backend field."""
        response = self.client.get(reverse("site-content"))
        for field in ("video_label", "video_embed_url", "video_poster_image_url"):
            self.assertIn(field, response.data)

        staff = User.objects.create_user(email="contentstaff3@example.com", password="pw12345", is_staff=True)
        self.client.force_authenticate(user=staff)
        response = self.client.patch(
            reverse("site-content"),
            {"video_label": "پخش ویدئو", "video_embed_url": "https://www.youtube.com/embed/abc123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["video_embed_url"], "https://www.youtube.com/embed/abc123")


class BlogPostTests(APITestCase):
    def setUp(self):
        self.published = BlogPost.objects.create(
            title="پست منتشرشده",
            excerpt="خلاصه",
            body="## عنوان\n\nمتن.",
            tag="راهنما",
            author="تیم نیکا",
            is_published=True,
        )
        self.draft = BlogPost.objects.create(
            title="پیش‌نویس",
            body="متن پیش‌نویس",
            is_published=False,
        )

    def test_slug_is_auto_generated_from_title(self):
        self.assertTrue(self.published.slug)

    def test_public_list_only_shows_published_posts(self):
        response = self.client.get(reverse("blog-post-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [p["slug"] for p in response.data]
        self.assertIn(self.published.slug, slugs)
        self.assertNotIn(self.draft.slug, slugs)

    def test_staff_also_only_sees_published_posts(self):
        """No unpublished-post admin view exists yet (see BlogPost's
        docstring) — an authenticated staff request gets the same
        published-only list as everyone else."""
        staff = User.objects.create_user(email="blogstaff@example.com", password="pw12345", is_staff=True)
        self.client.force_authenticate(user=staff)
        response = self.client.get(reverse("blog-post-list"))
        slugs = [p["slug"] for p in response.data]
        self.assertNotIn(self.draft.slug, slugs)

    def test_retrieve_by_slug(self):
        response = self.client.get(reverse("blog-post-detail", kwargs={"slug": self.published.slug}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "پست منتشرشده")

    def test_draft_post_is_not_retrievable_by_slug(self):
        response = self.client.get(reverse("blog-post-detail", kwargs={"slug": self.draft.slug}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_write_methods_are_not_exposed(self):
        response = self.client.post(reverse("blog-post-list"), {"title": "X"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class MediaAssetTests(APITestCase):
    def setUp(self):
        self.asset = MediaAsset.objects.create(
            file=_tiny_jpeg(), label="نمونه", tag="بنر", alt_text="نمونه تصویر"
        )

    def test_anonymous_cannot_list(self):
        response = self.client.get(reverse("media-asset-list"))
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_customer_cannot_list(self):
        customer = User.objects.create_user(email="mediacust@example.com", password="pw12345")
        self.client.force_authenticate(user=customer)
        response = self.client.get(reverse("media-asset-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_list(self):
        staff = User.objects.create_user(email="mediastaff1@example.com", password="pw12345", is_staff=True)
        self.client.force_authenticate(user=staff)
        response = self.client.get(reverse("media-asset-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertIn("url", response.data[0])

    def test_staff_can_upload(self):
        staff = User.objects.create_user(email="mediastaff2@example.com", password="pw12345", is_staff=True)
        self.client.force_authenticate(user=staff)
        response = self.client.post(
            reverse("media-asset-list"),
            {"file": _tiny_jpeg(), "label": "تصویر جدید", "tag": "بنر", "alt_text": "توضیح"},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MediaAsset.objects.count(), 2)
        self.assertEqual(response.data["label"], "تصویر جدید")

    def test_staff_can_update_metadata(self):
        staff = User.objects.create_user(email="mediastaff3@example.com", password="pw12345", is_staff=True)
        self.client.force_authenticate(user=staff)
        response = self.client.patch(
            reverse("media-asset-detail", kwargs={"pk": self.asset.pk}),
            {"label": "برچسب جدید"},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.label, "برچسب جدید")

    def test_staff_can_delete(self):
        staff = User.objects.create_user(email="mediastaff4@example.com", password="pw12345", is_staff=True)
        self.client.force_authenticate(user=staff)
        response = self.client.delete(reverse("media-asset-detail", kwargs={"pk": self.asset.pk}))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(MediaAsset.objects.count(), 0)


class StoreSettingsAPITests(APITestCase):
    def test_get_is_public_and_has_defaults(self):
        response = self.client.get(reverse("store-settings"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("shipping_enabled", response.data)
        self.assertIn("guest_checkout_enabled", response.data)
        self.assertIn("low_stock_threshold", response.data)

    def test_anonymous_cannot_patch(self):
        response = self.client.patch(reverse("store-settings"), {"maintenance_mode": True}, format="json")
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_non_staff_cannot_patch(self):
        user = User.objects.create_user(email="settingsuser@example.com", password="pw12345")
        self.client.force_authenticate(user=user)
        response = self.client.patch(reverse("store-settings"), {"maintenance_mode": True}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_patch_and_it_persists(self):
        staff = User.objects.create_user(email="settingsstaff@example.com", password="pw12345", is_staff=True)
        self.client.force_authenticate(user=staff)
        response = self.client.patch(
            reverse("store-settings"),
            {"shipping_flat_cost": "75000.00", "free_shipping_threshold": "1000000.00", "low_stock_threshold": 3},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["shipping_flat_cost"], "75000.00")
        self.assertEqual(response.data["low_stock_threshold"], 3)

        # Singleton — always the same row, never a second one.
        self.assertEqual(StoreSettings.objects.count(), 1)
        StoreSettings.load().refresh_from_db()
        self.assertEqual(StoreSettings.load().low_stock_threshold, 3)
