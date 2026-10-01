from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    """Manager for the custom email-based User model."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("An email address is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("A superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("A superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model, identified by email rather than username.

    Kept intentionally minimal for the MVP foundation: identity,
    authentication, contact info, and active/staff state. A full
    role/permission matrix is deferred to a later phase — Django's
    built-in is_staff / is_superuser / groups cover what's needed for now.
    """

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.email


class PasswordResetRequest(models.Model):
    """
    One OTP-based password-reset attempt.

    Deliberately channel-agnostic (`channel`) so a future SMS delivery
    path can reuse this exact model/flow — only the sending step differs
    (see accounts/services/notifications.py) — without a schema change.

    Security notes:
    - The OTP is never stored in plaintext, only a keyed hash (`otp_hash`).
    - After successful OTP verification, a separate, longer, single-use
      `reset_token` (also stored only as a hash) authorizes the final
      "set new password" step — the OTP itself can't be replayed there.
    """

    CHANNEL_EMAIL = "email"
    CHANNEL_CHOICES = [(CHANNEL_EMAIL, "Email")]

    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="password_reset_requests"
    )
    email = models.EmailField(help_text="Destination at request time, kept even if the user later changes it.")
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES, default=CHANNEL_EMAIL)

    otp_hash = models.CharField(max_length=64)
    attempts = models.PositiveSmallIntegerField(default=0)

    verified_at = models.DateTimeField(null=True, blank=True)
    reset_token_hash = models.CharField(max_length=64, blank=True)
    reset_token_expires_at = models.DateTimeField(null=True, blank=True)

    consumed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "consumed_at", "created_at"])]

    def __str__(self):
        return f"PasswordResetRequest(user={self.user_id}, created_at={self.created_at})"


class Address(models.Model):
    """
    A customer's saved shipping address (project brief section 7).

    Owner-scoped only — there is no staff/admin surface for these; strict
    isolation is enforced entirely by AddressViewSet.get_queryset()
    filtering on request.user. Guests never get one (no user to own it),
    matching the brief ("Guests do not need an address book").
    """

    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="addresses"
    )
    title = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    detail = models.CharField(max_length=300)
    postal_code = models.CharField(max_length=20, blank=True)
    is_default = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.user_id})"
