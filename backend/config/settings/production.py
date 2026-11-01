"""
Production settings.

Kept intentionally close to base.py at this MVP stage — the goal here is
just to fail loudly if critical env vars are missing, and to turn on a
couple of standard hardening flags. A full production security pass
belongs to Phase 2 / Phase 3, not this foundation.
"""

import os

from .base import *  # noqa: F401,F403

DEBUG = False

if (
    SECRET_KEY.startswith(("insecure", "change-me"))  # noqa: F405
    or len(SECRET_KEY) < 40  # noqa: F405
):
    raise RuntimeError(
        "DJANGO_SECRET_KEY must be set to a real, random secret (>= 40 chars) in "
        "production. Generate one with: "
        "python -c \"import secrets; print(secrets.token_urlsafe(64))\""
    )

if not ALLOWED_HOSTS:  # noqa: F405
    raise RuntimeError("DJANGO_ALLOWED_HOSTS must be set in production.")

# A production instance must never silently fall back to SQLite. base.py
# only uses SQLite when DATABASE_URL (and POSTGRES_*) are both absent —
# require DATABASE_URL explicitly here so a misconfigured Render deploy
# fails at startup instead of quietly running (and losing data) on a
# local, ephemeral SQLite file.
if not DATABASE_URL:  # noqa: F405
    raise RuntimeError(
        "DATABASE_URL must be set in production — a deployed instance must "
        "never fall back to SQLite. Point it at the Neon PostgreSQL "
        "connection string."
    )

if DATABASES["default"]["ENGINE"] != "django.db.backends.postgresql":  # noqa: F405
    raise RuntimeError(
        "Production must use PostgreSQL. Check DATABASE_URL — it did not "
        "resolve to a postgresql:// / postgres:// connection string."
    )

# Render (and Cloudflare) terminate TLS and forward plain HTTP to Django with an
# X-Forwarded-Proto header. Without this, Django believes every request is
# insecure: SECURE_SSL_REDIRECT loops and absolute URLs (e.g. product image URLs
# in the API) are built as http:// which browsers block as mixed content.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = False
SECURE_SSL_REDIRECT = os.environ.get("DJANGO_SECURE_SSL_REDIRECT", "true").lower() == "true"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = int(os.environ.get("DJANGO_SECURE_HSTS_SECONDS", "0"))
if SECURE_HSTS_SECONDS:
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True


# ---------------------------------------------------------------------------
# Media files (product photos, banners, blog covers).
#
# Render's disk is ephemeral and Django does not serve /media/ from disk when
# DEBUG=False. Two supported options:
#   1) DEFAULT — store files in the PostgreSQL database (Neon) via
#      core.storage.DatabaseStorage; Django serves them at /media/<name>.
#      Everything lives in one place (one backup, nothing extra to set up).
#   2) Optional — Cloudflare R2 / any S3-compatible bucket, enabled by setting
#      R2_BUCKET_NAME and the other R2_* variables (see .env.example).
# Set MEDIA_STORAGE=filesystem only for a throw-away smoke test.
# ---------------------------------------------------------------------------
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "")
if R2_BUCKET_NAME:
    _r2_public_domain = os.environ["R2_PUBLIC_DOMAIN"].strip().rstrip("/")  # e.g. media.nikahoney.ir
    STORAGES["default"] = {  # noqa: F405
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "bucket_name": R2_BUCKET_NAME,
            "endpoint_url": os.environ["R2_ENDPOINT_URL"],  # https://<account-id>.r2.cloudflarestorage.com
            "access_key": os.environ["R2_ACCESS_KEY_ID"],
            "secret_key": os.environ["R2_SECRET_ACCESS_KEY"],
            "region_name": "auto",
            "custom_domain": _r2_public_domain,
            "url_protocol": "https:",
            "querystring_auth": False,
            "file_overwrite": False,
        },
    }
    MEDIA_URL = f"https://{_r2_public_domain}/"
elif os.environ.get("MEDIA_STORAGE", "database").lower() != "filesystem":
    STORAGES["default"] = {"BACKEND": "core.storage.DatabaseStorage"}  # noqa: F405
    MEDIA_URL = "media/"
