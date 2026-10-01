from django.db import models
from django.utils.text import slugify

from core.models import TimeStampedModel


class SiteContent(TimeStampedModel):
    """
    Lightweight, singleton storefront-content record.

    This is deliberately a single flexible row rather than a full CMS —
    just enough editable fields for the storefront chrome (hero, topbar,
    contact info, socials, footer, promo banner) that the future Next.js
    frontend will read. There is only ever one row (pk=1); use
    ``SiteContent.load()`` to fetch-or-create it instead of querying the
    manager directly.
    """

    # Homepage hero
    hero_title = models.CharField(max_length=200, blank=True)
    hero_subtitle = models.CharField(max_length=300, blank=True)
    # CharField, not URLField: this commonly holds a relative path to a
    # static frontend asset (e.g. "/images/products/jar-closeup.jpg"), not
    # always an absolute URL — URLField's validator rejects relative paths
    # outright, which would break every PATCH /content/ that left this at
    # its (relative-path) default. Same reasoning for the two video fields
    # and BlogPost.cover_image_url below.
    hero_image_url = models.CharField(max_length=500, blank=True)

    # Topbar announcement strip
    topbar_message = models.CharField(max_length=200, blank=True)
    topbar_is_active = models.BooleanField(default=False)

    # Contact information
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    contact_address = models.CharField(max_length=300, blank=True)

    # Social links
    social_instagram = models.URLField(blank=True)
    social_telegram = models.URLField(blank=True)
    social_whatsapp = models.URLField(blank=True)

    # Footer
    footer_text = models.CharField(max_length=300, blank=True)

    # Promotional banner
    promo_message = models.CharField(max_length=200, blank=True)
    promo_is_active = models.BooleanField(default=False)

    # Intro/about video — previously a frontend-only (localStorage) field;
    # now backend-tracked like the rest of the storefront chrome above, so
    # seed_demo and staff edits (PATCH /content/) actually persist it.
    video_label = models.CharField(max_length=100, blank=True)
    video_embed_url = models.URLField(blank=True)
    video_poster_image_url = models.CharField(max_length=500, blank=True)

    class Meta:
        verbose_name = "site content"
        verbose_name_plural = "site content"

    def __str__(self):
        return "Site content"

    def save(self, *args, **kwargs):
        # Enforce the singleton: there is only ever one row, with pk=1.
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # The singleton row is reset, never deleted, so the API always has
        # something to serve.
        pass

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class BlogPost(TimeStampedModel):
    """
    A single blog article.

    Deliberately minimal: ``body`` is one plain-text/lightweight-markdown
    field (blank lines between paragraphs, "## heading" for a subheading)
    rather than a separate block/richtext model — there's no admin UI yet
    that needs structured blocks, and the public site currently reads its
    own local copy of this same content (frontend/lib/blog.js) rather than
    this API; this model exists so the backend has a real, seedable source
    of truth for the same posts, ready for the frontend to switch to later.
    ``cover_image_url`` is a URL (matching ``SiteContent.hero_image_url``'s
    pattern) rather than an uploaded file, since it points at the existing
    static images already shipped under frontend/public/images/blog/.
    """

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    excerpt = models.CharField(max_length=300, blank=True)
    body = models.TextField(blank=True)
    cover_image_url = models.CharField(max_length=500, blank=True)
    tag = models.CharField(max_length=50, blank=True)
    author = models.CharField(max_length=100, blank=True)
    is_published = models.BooleanField(default=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)


def media_asset_upload_path(instance, filename):
    return f"media-library/{filename}"


class MediaAsset(TimeStampedModel):
    """
    General-purpose media library item (staff-managed).

    Distinct from ``products.ProductImage``: ProductImage is always tied to
    one Product (product photography only); MediaAsset is a standalone
    library of uploaded files — usable for blog covers, content/banner
    images, or anything else an admin wants to upload once and reuse,
    without it being attached to a specific product. Nothing else in the
    codebase reads from MediaAsset automatically; it exists purely so
    /admin/media has real, persisted, staff-managed uploads instead of a
    localStorage-only demo list.
    """

    file = models.FileField(upload_to=media_asset_upload_path)
    label = models.CharField(max_length=200, blank=True)
    tag = models.CharField(max_length=50, blank=True)
    alt_text = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.label or self.file.name


class StoreSettings(TimeStampedModel):
    """
    Singleton store-configuration record (shipping rules + a handful of
    admin toggles) — the backend-owned counterpart of what the Admin
    Settings screen used to keep only in localStorage/adminStore.

    Same singleton pattern as SiteContent above (always pk=1, load() to
    fetch-or-create). GET is public — checkout and other public pages need
    to read the shipping rule and guest_checkout_enabled/maintenance_mode
    flags with no auth — PATCH is staff-only (see StoreSettingsView).
    """

    # --- Shipping (project brief section 3) ---
    shipping_enabled = models.BooleanField(
        default=True, help_text="If off, shipping_cost is always 0 regardless of the flat rate below."
    )
    shipping_flat_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    free_shipping_threshold = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Order subtotal at/above which shipping is free. Blank/null disables the threshold (flat cost always applies).",
    )

    # --- Checkout / storefront behavior ---
    guest_checkout_enabled = models.BooleanField(default=True)
    maintenance_mode = models.BooleanField(
        default=False, help_text="When on, the public storefront should show a maintenance notice (frontend-enforced)."
    )

    # --- Inventory ---
    low_stock_threshold = models.PositiveIntegerField(default=5)

    # --- Notifications (toggles only — no delivery channel wired up yet) ---
    notify_new_order = models.BooleanField(default=True)
    notify_low_stock = models.BooleanField(default=True)

    class Meta:
        verbose_name = "store settings"
        verbose_name_plural = "store settings"

    def __str__(self):
        return "Store settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def compute_shipping_cost(self, subtotal):
        """
        The one place that turns settings + a subtotal into a shipping
        cost. Used by orders.services.create_order (authoritative, at
        order-creation time) and by the public settings/estimate response
        the checkout page reads for its up-front display estimate — so the
        two can never disagree.
        """
        if not self.shipping_enabled:
            return 0
        if self.free_shipping_threshold is not None and subtotal >= self.free_shipping_threshold:
            return 0
        return self.shipping_flat_cost
