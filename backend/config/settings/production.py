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

if SECRET_KEY == "insecure-dev-key-change-me":  # noqa: F405
    raise RuntimeError(
        "DJANGO_SECRET_KEY must be set to a real secret in production."
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

SECURE_SSL_REDIRECT = os.environ.get("DJANGO_SECURE_SSL_REDIRECT", "true").lower() == "true"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = int(os.environ.get("DJANGO_SECURE_HSTS_SECONDS", "0"))
if SECURE_HSTS_SECONDS:
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
