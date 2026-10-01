"""Development settings. Loose defaults suited to local work only."""

from .base import *  # noqa: F401,F403

DEBUG = True

# Convenient defaults for local work; still overridable via env vars.
if not ALLOWED_HOSTS:  # noqa: F405
    ALLOWED_HOSTS = ["localhost", "127.0.0.1"]
