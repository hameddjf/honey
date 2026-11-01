from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base adding created/updated timestamps to any model."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class StoredFile(models.Model):
    """A user-visible file (product photo, banner, blog cover…) kept in the database.

    Used by ``core.storage.DatabaseStorage`` so that, in production, uploaded
    media lives in PostgreSQL (Neon) instead of an ephemeral disk or an extra
    object-storage service. ``name`` is the storage path (e.g.
    ``products/3/photo.jpg``) and is unique.
    """

    name = models.CharField(max_length=500, unique=True)
    content = models.BinaryField()
    content_type = models.CharField(max_length=100, blank=True)
    size = models.PositiveIntegerField(default=0)
    etag = models.CharField(max_length=40, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
