from django.contrib.auth import get_user_model, password_validation
from rest_framework import serializers

from orders.serializers import OrderSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Read-only representation of the authenticated user."""

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone_number", "is_staff", "created_at"]
        read_only_fields = fields


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Lets an authenticated user edit their own contact details.

    Deliberately excludes email, is_staff, is_superuser, and any internal
    identifier — role/privilege fields are never editable through this
    endpoint, no matter what the request body contains, because this
    serializer simply doesn't declare those fields.
    """

    class Meta:
        model = User
        fields = ["full_name", "phone_number"]


class ChangePasswordSerializer(serializers.Serializer):
    """Requires the current password before setting a new one."""

    old_password = serializers.CharField(write_only=True, style={"input_type": "password"})
    new_password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        password_validation.validate_password(value, user=self.context["request"].user)
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class CustomerSerializer(serializers.ModelSerializer):
    """Staff-facing summary of a customer, with basic order stats."""

    order_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "phone_number",
            "is_active",
            "created_at",
            "order_count",
        ]
        read_only_fields = fields


class CustomerDetailSerializer(CustomerSerializer):
    """Adds recent order history for the staff customer-detail view."""

    recent_orders = OrderSerializer(source="orders", many=True, read_only=True)

    class Meta(CustomerSerializer.Meta):
        fields = CustomerSerializer.Meta.fields + ["recent_orders"]
        read_only_fields = fields


class AdminUserSerializer(serializers.ModelSerializer):
    """
    Staff-only directory row: the full user population (customers, staff,
    and superusers), for the admin "Users & Access" page.

    Read-only and deliberately narrow — no password, OTP, or reset-token
    fields exist on this serializer at all, so there is nothing sensitive
    to accidentally expose. ``role`` is a derived, human-readable summary
    of is_staff/is_superuser for the UI; the underlying flags are also
    included for callers that need them directly.
    """

    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "phone_number",
            "is_active",
            "is_staff",
            "is_superuser",
            "role",
            "created_at",
        ]
        read_only_fields = fields

    def get_role(self, obj):
        if obj.is_superuser:
            return "superuser"
        if obj.is_staff:
            return "staff"
        return "customer"


class AdminUserRoleUpdateSerializer(serializers.ModelSerializer):
    """
    Staff-only role change: accepts only ``role`` = "customer" or "staff".

    ``is_superuser`` is never declared here, so no request body — however
    crafted — can grant superuser access through this endpoint; promoting
    an account to superuser stays a backend-only operation (Django admin /
    ``createsuperuser``). View-level checks (see ``AdminUserViewSet``)
    additionally block role changes to the caller's own account or to any
    existing superuser account.
    """

    role = serializers.ChoiceField(choices=["customer", "staff"], write_only=True)

    class Meta:
        model = User
        fields = ["role"]

    def update(self, instance, validated_data):
        instance.is_staff = validated_data["role"] == "staff"
        instance.save(update_fields=["is_staff", "updated_at"])
        return instance

    def to_representation(self, instance):
        return AdminUserSerializer(instance).data


class RegisterSerializer(serializers.ModelSerializer):
    """Creates a new customer account with a validated, hashed password."""

    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone_number", "password"]

    def validate_email(self, value):
        value = User.objects.normalize_email(value)
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
