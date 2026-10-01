"""
OTP generation, hashing, and verification for password-reset (and, later,
any other OTP-gated flow).

The OTP itself is never persisted in plaintext and never logged — only a
keyed HMAC-SHA256 digest is stored (`otp_hash` / `reset_token_hash` on
PasswordResetRequest). `hmac.compare_digest` is used for verification to
avoid timing side-channels.
"""

import hashlib
import hmac
import secrets

from django.conf import settings


def generate_otp(length=None):
    """Cryptographically secure numeric OTP, e.g. '482913'."""
    length = length or settings.PASSWORD_RESET_OTP_LENGTH
    return "".join(secrets.choice("0123456789") for _ in range(length))


def generate_reset_token():
    """Cryptographically secure, URL-safe, single-use reset authorization token."""
    return secrets.token_urlsafe(32)


def _digest(value: str) -> str:
    # Keyed with SECRET_KEY so the hash isn't just a public checksum of a
    # 6-digit search space (which would be trivially brute-forceable
    # offline if the hash column ever leaked).
    return hmac.new(settings.SECRET_KEY.encode(), value.encode(), hashlib.sha256).hexdigest()


def hash_otp(code: str) -> str:
    return _digest(f"otp:{code}")


def verify_otp(code: str, otp_hash: str) -> bool:
    return hmac.compare_digest(_digest(f"otp:{code}"), otp_hash)


def hash_reset_token(token: str) -> str:
    return _digest(f"reset-token:{token}")


def verify_reset_token(token: str, token_hash: str) -> bool:
    return hmac.compare_digest(_digest(f"reset-token:{token}"), token_hash)
