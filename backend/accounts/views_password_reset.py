"""
Views for the three-step OTP password-reset flow:

    POST /accounts/password-reset/request/  — email in, generic ack out
    POST /accounts/password-reset/verify/   — email + OTP in, short-lived reset_token out
    POST /accounts/password-reset/confirm/  — reset_token + new_password in, password changed

Kept in its own module (mirroring services/ and serializers_password_reset.py)
since this is a distinct, security-sensitive flow.

Account-enumeration protection: the request endpoint ALWAYS returns the same
200 + generic Persian message, whether or not the email exists, and even if
sending the email fails for an operational reason (bad SMTP config, network
down, etc.) — an attacker must not be able to tell "unknown email" apart
from "known email, but our mail server happened to be broken" by response
shape alone. Any real send failure is logged server-side, never surfaced to
the client, and never blocks the response.
"""

import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import PasswordResetRequest
from .serializers_password_reset import (
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PasswordResetVerifySerializer,
)
from .services.notifications import send_password_reset_otp
from .services.otp import generate_otp, generate_reset_token, hash_otp, hash_reset_token

logger = logging.getLogger(__name__)
User = get_user_model()

GENERIC_REQUEST_MESSAGE = "اگر این ایمیل در سیستم ثبت شده باشد، کد تأیید ارسال خواهد شد."


class PasswordResetRequestView(APIView):
    """Step 1 — request an OTP. Never reveals whether the email exists."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset_request"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            self._maybe_send(email)
        except Exception:  # noqa: BLE001 — must never leak to the response
            logger.exception("Password-reset request handling failed for a submitted email.")

        return Response({"detail": GENERIC_REQUEST_MESSAGE})

    def _maybe_send(self, email):
        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user is None:
            return  # silently no-op — see module docstring

        cooldown = settings.PASSWORD_RESET_RESEND_COOLDOWN_SECONDS
        last = (
            PasswordResetRequest.objects.filter(user=user)
            .order_by("-created_at")
            .first()
        )
        if last is not None and (timezone.now() - last.created_at).total_seconds() < cooldown:
            return  # within cooldown — no-op, still return the generic response

        # A fresh OTP invalidates any still-open previous attempt for this user,
        # so only the most recently sent code (and its reset flow) is ever valid.
        PasswordResetRequest.objects.filter(user=user, consumed_at__isnull=True).update(
            consumed_at=timezone.now()
        )

        code = generate_otp()
        ttl_minutes = settings.PASSWORD_RESET_OTP_TTL_MINUTES
        PasswordResetRequest.objects.create(
            user=user,
            email=email,
            otp_hash=hash_otp(code),
            expires_at=timezone.now() + timezone.timedelta(minutes=ttl_minutes),
        )
        send_password_reset_otp(user, code, channel=PasswordResetRequest.CHANNEL_EMAIL, ttl_minutes=ttl_minutes)


class PasswordResetVerifyView(APIView):
    """Step 2 — verify email + OTP, issue a short-lived reset authorization token."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset_verify"

    def post(self, request):
        serializer = PasswordResetVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reset_request = serializer.validated_data["reset_request"]

        token = generate_reset_token()
        reset_request.verified_at = timezone.now()
        reset_request.reset_token_hash = hash_reset_token(token)
        reset_request.reset_token_expires_at = timezone.now() + timezone.timedelta(
            minutes=settings.PASSWORD_RESET_TOKEN_TTL_MINUTES
        )
        reset_request.save(
            update_fields=["verified_at", "reset_token_hash", "reset_token_expires_at"]
        )

        return Response(
            {
                "detail": "کد تأیید شد.",
                "reset_token": token,
                "expires_in_minutes": settings.PASSWORD_RESET_TOKEN_TTL_MINUTES,
            }
        )


class PasswordResetConfirmView(APIView):
    """Step 3 — spend the reset authorization token to set a new password."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset_confirm"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "رمز عبور با موفقیت تغییر کرد."}, status=status.HTTP_200_OK)
