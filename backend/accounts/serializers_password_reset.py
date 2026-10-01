"""
Serializers for the three-step OTP password-reset flow.

Kept in a separate module from serializers.py (rather than appended) since
this is a distinct, security-sensitive flow with its own validation shape —
mirrors the accounts/services/ and accounts/views_password_reset.py split.
"""

from django.conf import settings
from django.contrib.auth import get_user_model, password_validation
from django.utils import timezone
from rest_framework import serializers

from .services.otp import verify_otp, verify_reset_token

User = get_user_model()


class PasswordResetRequestSerializer(serializers.Serializer):
    """Step 1: just an email. Deliberately never reveals whether it exists."""

    email = serializers.EmailField()

    def validate_email(self, value):
        return User.objects.normalize_email(value)


class PasswordResetVerifySerializer(serializers.Serializer):
    """Step 2: email + the OTP the user received."""

    email = serializers.EmailField()
    code = serializers.RegexField(
        regex=r"^\d{4,8}$", error_messages={"invalid": "کد تأیید نامعتبر است."}
    )

    def validate(self, attrs):
        from .models import PasswordResetRequest  # local import to avoid cycles

        email = User.objects.normalize_email(attrs["email"])
        code = attrs["code"]

        generic_error = "کد وارد شده نامعتبر یا منقضی‌شده است."

        reset_request = (
            PasswordResetRequest.objects.filter(
                email__iexact=email, consumed_at__isnull=True, verified_at__isnull=True
            )
            .order_by("-created_at")
            .first()
        )
        if reset_request is None:
            raise serializers.ValidationError(generic_error)

        if reset_request.expires_at <= timezone.now():
            raise serializers.ValidationError(generic_error)

        if reset_request.attempts >= settings.PASSWORD_RESET_OTP_MAX_ATTEMPTS:
            raise serializers.ValidationError(
                "تعداد تلاش‌های مجاز برای این کد به پایان رسیده است. یک کد جدید درخواست کنید."
            )

        if not verify_otp(code, reset_request.otp_hash):
            # Count the failed attempt against this request before rejecting.
            reset_request.attempts += 1
            reset_request.save(update_fields=["attempts"])
            raise serializers.ValidationError(generic_error)

        attrs["reset_request"] = reset_request
        return attrs


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Step 3: the reset authorization token from step 2 + the new password."""

    reset_token = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        from .models import PasswordResetRequest  # local import to avoid cycles

        generic_error = "درخواست بازیابی نامعتبر یا منقضی‌شده است. فرآیند را از ابتدا شروع کنید."

        token = attrs["reset_token"]
        candidates = PasswordResetRequest.objects.filter(
            consumed_at__isnull=True,
            verified_at__isnull=False,
            reset_token_expires_at__gt=timezone.now(),
        ).exclude(reset_token_hash="")

        reset_request = next(
            (r for r in candidates if verify_reset_token(token, r.reset_token_hash)), None
        )
        if reset_request is None:
            raise serializers.ValidationError(generic_error)

        password_validation.validate_password(attrs["new_password"], user=reset_request.user)

        attrs["reset_request"] = reset_request
        return attrs

    def save(self, **kwargs):
        reset_request = self.validated_data["reset_request"]
        user = reset_request.user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])

        reset_request.consumed_at = timezone.now()
        reset_request.save(update_fields=["consumed_at"])
        return user
