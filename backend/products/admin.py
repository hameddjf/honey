from django.contrib import admin

from .models import ProductComment, ProductReaction, Category, Product, ProductImage


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


@admin.register(ProductComment)
class ProductCommentAdmin(admin.ModelAdmin):
    list_display = ["product", "user", "short_body", "parent", "is_visible", "created_at"]
    list_filter = ["is_visible", "product"]
    search_fields = ["body", "user__email", "user__full_name"]
    actions = ["hide_selected", "show_selected"]

    @admin.display(description="comment")
    def short_body(self, obj):
        return obj.body[:60]

    @admin.action(description="Hide selected comments")
    def hide_selected(self, request, queryset):
        queryset.update(is_visible=False)

    @admin.action(description="Show selected comments")
    def show_selected(self, request, queryset):
        queryset.update(is_visible=True)


@admin.register(ProductReaction)
class ProductReactionAdmin(admin.ModelAdmin):
    list_display = ["product", "user", "value", "updated_at"]
    list_filter = ["value", "product"]
