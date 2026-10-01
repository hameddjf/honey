from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product", "product_name", "unit_price", "quantity"]
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["order_number", "user", "guest_email", "status", "payment_status", "total", "created_at"]
    list_filter = ["status", "payment_status"]
    search_fields = ["order_number", "user__email", "guest_email"]
    readonly_fields = ["order_number", "subtotal", "total", "created_at", "updated_at"]
    fields = [
        "order_number",
        "user",
        "guest_email",
        "shipping_address",
        "contact_phone",
        "status",
        "payment_status",
        "payment_method",
        "subtotal",
        "shipping_cost",
        "total",
        "created_at",
        "updated_at",
    ]
    inlines = [OrderItemInline]
