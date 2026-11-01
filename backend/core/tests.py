from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory, TestCase, override_settings

from core.media_views import serve_db_media
from core.models import StoredFile
from core.storage import DatabaseStorage

DB_STORAGES = {
    "default": {"BACKEND": "core.storage.DatabaseStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}


@override_settings(MEDIA_URL="media/")
class DatabaseStorageTests(TestCase):
    def setUp(self):
        self.storage = DatabaseStorage()

    def test_save_open_exists_size_delete(self):
        name = self.storage.save("products/1/a.jpg", ContentFile(b"hello"))
        self.assertEqual(name, "products/1/a.jpg")
        self.assertTrue(self.storage.exists(name))
        self.assertEqual(self.storage.size(name), 5)
        self.assertEqual(self.storage.open(name).read(), b"hello")
        row = StoredFile.objects.get(name=name)
        self.assertEqual(row.content_type, "image/jpeg")
        self.storage.delete(name)
        self.assertFalse(self.storage.exists(name))
        with self.assertRaises(FileNotFoundError):
            self.storage.open(name)

    def test_never_overwrites_existing_name(self):
        first = self.storage.save("x/photo.png", ContentFile(b"one"))
        second = self.storage.save("x/photo.png", ContentFile(b"two"))
        self.assertNotEqual(first, second)
        self.assertEqual(self.storage.open(first).read(), b"one")
        self.assertEqual(self.storage.open(second).read(), b"two")

    def test_url_and_listdir(self):
        self.storage.save("a/b/c.jpg", ContentFile(b"1"))
        self.storage.save("a/d.jpg", ContentFile(b"2"))
        self.assertEqual(self.storage.url("a/d.jpg"), "/media/a/d.jpg")
        self.assertEqual(self.storage.listdir("a"), (["b"], ["d.jpg"]))

    @override_settings(MEDIA_URL="https://cdn.example.com/m/")
    def test_absolute_media_url(self):
        self.assertEqual(self.storage.url("a.jpg"), "https://cdn.example.com/m/a.jpg")


@override_settings(STORAGES=DB_STORAGES, MEDIA_URL="media/")
class ServeDbMediaTests(TestCase):
    def setUp(self):
        self.rf = RequestFactory()
        DatabaseStorage().save("p/pic.jpg", SimpleUploadedFile("pic.jpg", b"\xff\xd8data", "image/jpeg"))

    def test_serves_with_cache_headers_and_etag(self):
        response = serve_db_media(self.rf.get("/media/p/pic.jpg"), "p/pic.jpg")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"\xff\xd8data")
        self.assertEqual(response["Content-Type"], "image/jpeg")
        self.assertIn("immutable", response["Cache-Control"])
        etag = response["ETag"]

        cached = serve_db_media(self.rf.get("/media/p/pic.jpg", HTTP_IF_NONE_MATCH=etag), "p/pic.jpg")
        self.assertEqual(cached.status_code, 304)

    def test_head_and_missing_and_post(self):
        head = serve_db_media(self.rf.head("/media/p/pic.jpg"), "p/pic.jpg")
        self.assertEqual(head.status_code, 200)
        self.assertEqual(head.content, b"")
        from django.http import Http404
        with self.assertRaises(Http404):
            serve_db_media(self.rf.get("/media/nope.jpg"), "nope.jpg")
        self.assertEqual(serve_db_media(self.rf.post("/media/p/pic.jpg"), "p/pic.jpg").status_code, 405)
