import django_filters

from .models import Order


class OrderFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Order.Status.choices)
    payment_status = django_filters.ChoiceFilter(choices=Order.PaymentStatus.choices)
    created_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Order
        fields = ["status", "payment_status", "created_after", "created_before"]
