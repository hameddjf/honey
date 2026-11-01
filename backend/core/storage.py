"""Database-backed file storage (files live in the ``core_storedfile`` table).

Enable with::

    STORAGES["default"] = {"BACKEND": "core.storage.DatabaseStorage"}

Files are served by ``core.media_views.serve_db_media`` at ``MEDIA_URL``.
Names never get overwritten (Django picks a fresh name on collision), so the
served files are immutable and can be cached for a long time.
"""

import hashlib
import mimetypes

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible


@deconstructible
class DatabaseStorage(Storage):
    @staticmethod
    def _model():
        from .models import StoredFile

        return StoredFile

    @staticmethod
    def _clean(name):
        return str(name).replace("\\", "/").lstrip("/")

    def _open(self, name, mode="rb"):
        try:
            row = self._model().objects.only("content").get(name=self._clean(name))
        except self._model().DoesNotExist as exc:
            raise FileNotFoundError(name) from exc
        return ContentFile(bytes(row.content), name=self._clean(name))

    def _save(self, name, content):
        name = self._clean(name)
        data = content.read()
        if hasattr(content, "seek"):
            content.seek(0)
        content_type = mimetypes.guess_type(name)[0] or "application/octet-stream"
        self._model().objects.update_or_create(
            name=name,
            defaults={
                "content": data,
                "content_type": content_type,
                "size": len(data),
                "etag": hashlib.sha1(data).hexdigest(),
            },
        )
        return name

    def exists(self, name):
        return self._model().objects.filter(name=self._clean(name)).exists()

    def delete(self, name):
        self._model().objects.filter(name=self._clean(name)).delete()

    def size(self, name):
        try:
            return self._model().objects.values_list("size", flat=True).get(name=self._clean(name))
        except self._model().DoesNotExist as exc:
            raise FileNotFoundError(name) from exc

    def url(self, name):
        base = settings.MEDIA_URL or "/media/"
        if not base.startswith(("/", "http://", "https://")):
            base = "/" + base
        if not base.endswith("/"):
            base += "/"
        return base + self._clean(name)

    def listdir(self, path):
        prefix = self._clean(path)
        prefix = prefix + "/" if prefix and not prefix.endswith("/") else prefix
        dirs, files = set(), []
        for name in self._model().objects.filter(name__startswith=prefix).values_list("name", flat=True):
            rest = name[len(prefix):]
            if "/" in rest:
                dirs.add(rest.split("/", 1)[0])
            else:
                files.append(rest)
        return sorted(dirs), sorted(files)

    def get_available_name(self, name, max_length=None):
        # Never overwrite: the parent implementation appends a random suffix
        # when `exists()` is true.
        return super().get_available_name(self._clean(name), max_length=max_length)
