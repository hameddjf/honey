from django.contrib import admin

from .models import Category, Product, ProductImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_active", "created_at"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name"]


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0
    fields = ["image", "alt_text", "sort_order", "is_primary"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "price", "stock", "size_value", "size_unit", "is_active", "is_featured", "created_at"]
    list_filter = ["category", "is_active", "is_featured", "size_unit"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name", "short_description"]
    inlines = [ProductImageInline]
