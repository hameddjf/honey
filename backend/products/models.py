from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify

from core.models import TimeStampedModel


class Category(TimeStampedModel):
    """Product category (e.g. Honey, Royal jelly & special blends)."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class SizeUnit(models.TextChoices):
    """Normalized package/content-size units for Product.size_unit."""

    GRAM = "g", "گرم"
    KILOGRAM = "kg", "کیلوگرم"
    MILLILITER = "ml", "میلی‌لیتر"
    LITER = "L", "لیتر"
    PIECE = "piece", "عدد"
    PACK = "pack", "بسته"
    BOX = "box", "جعبه"
    JAR = "jar", "شیشه"


class Product(TimeStampedModel):
    """A single sellable product in the honey catalog."""

    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products"
    )

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)

    short_description = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)

    price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    previous_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)]
    )

    # Number of sellable units currently available — NOT the same thing as
    # size_value/size_unit below (the size/weight of one unit's package).
    # e.g. stock=50 size_value=500 size_unit="g" means "50 jars in stock,
    # each jar holding 500 grams" — two independent numbers, never merged.
    stock = models.PositiveIntegerField(default=0)

    # Package/content size of a single sellable unit. Both fields are
    # optional (existing/legacy products may have neither), but if either
    # is set the other is required too — enforced in ProductSerializer.
    size_value = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    size_unit = models.CharField(max_length=10, choices=SizeUnit.choices, blank=True)

    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

    @property
    def is_in_stock(self):
        return self.stock > 0


def product_image_upload_path(instance, filename):
    return f"products/{instance.product_id}/{filename}"


class ProductImage(TimeStampedModel):
    """
    One image belonging to a Product. A product can have many; at most one
    of them is ever the primary image (enforced at the DB level below, and
    kept consistent by ProductViewSet's image actions — see products/views.py).
    """

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to=product_image_upload_path)
    alt_text = models.CharField(max_length=200, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["sort_order", "created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["product"],
                condition=models.Q(is_primary=True),
                name="unique_primary_image_per_product",
            )
        ]

    def __str__(self):
        return f"{self.product.name} — image #{self.pk}"
