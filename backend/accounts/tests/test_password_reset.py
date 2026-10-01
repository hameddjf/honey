import re
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import PasswordResetRequest
from accounts.services.otp import generate_reset_token, hash_reset_token

User = get_user_model()


def _extract_code(email_body):
    match = re.search(r"کد تأیید شما: (\d{4,8})", email_body)
    assert match, f"could not find an OTP in the email body: {email_body!r}"
    return match.group(1)


class PasswordResetRequestTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(email="reset-target@example.com", password="OldPass123!")
        self.url = reverse("password-reset-request")

    def test_known_email_sends_one_otp_email(self):
        response = self.client.post(self.url, {"email": self.user.email})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.user.email, mail.outbox[0].to)
        self.assertEqual(PasswordResetRequest.objects.filter(user=self.user).count(), 1)

    def test_unknown_email_returns_identical_generic_response_and_sends_nothing(self):
        known = self.client.post(self.url, {"email": self.user.email})
        unknown = self.client.post(self.url, {"email": "nobody-here@example.com"})

        self.assertEqual(known.status_code, unknown.status_code)
        self.assertEqual(known.data, unknown.data)
        # Only the known-email request should have produced an email/row.
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(PasswordResetRequest.objects.count(), 1)

    def test_resend_within_cooldown_does_not_send_a_second_email(self):
        self.client.post(self.url, {"email": self.user.email})
        response = self.client.post(self.url, {"email": self.user.email})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Still just the one email — the second call was a no-op due to cooldown.
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(PasswordResetRequest.objects.filter(user=self.user).count(), 1)

    @override_settings(PASSWORD_RESET_RESEND_COOLDOWN_SECONDS=0)
    def test_resend_after_cooldown_sends_a_new_email_and_invalidates_the_old_one(self):
        self.client.post(self.url, {"email": self.user.email})
        first = PasswordResetRequest.objects.get(user=self.user)

        self.client.post(self.url, {"email": self.user.email})
        self.assertEqual(len(mail.outbox), 2)

        first.refresh_from_db()
        self.assertIsNotNone(first.consumed_at)  # invalidated by the newer request

    def test_invalid_email_format_returns_400(self):
        response = self.client.post(self.url, {"email": "not-an-email"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_request_rate_limit_returns_429(self):
        # DEFAULT_THROTTLE_RATES["password_reset_request"] = "5/hour" (per client IP).
        for _ in range(5):
            response = self.client.post(self.url, {"email": "someone@example.com"})
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.post(self.url, {"email": "someone@example.com"})
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class PasswordResetVerifyTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(email="verify-target@example.com", password="OldPass123!")
        self.request_url = reverse("password-reset-request")
        self.verify_url = reverse("password-reset-verify")
        self.client.post(self.request_url, {"email": self.user.email})
        self.code = _extract_code(mail.outbox[0].body)

    def test_correct_otp_returns_reset_token(self):
        response = self.client.post(self.verify_url, {"email": self.user.email, "code": self.code})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("reset_token", response.data)
        self.assertNotIn("code", response.data)
        self.assertNotIn("otp", str(response.data).lower())

    def test_wrong_otp_is_rejected_and_counts_as_an_attempt(self):
        response = self.client.post(self.verify_url, {"email": self.user.email, "code": "000000"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        reset_request = PasswordResetRequest.objects.get(user=self.user)
        self.assertEqual(reset_request.attempts, 1)

    def test_expired_otp_is_rejected(self):
        reset_request = PasswordResetRequest.objects.get(user=self.user)
        reset_request.expires_at = timezone.now() - timedelta(seconds=1)
        reset_request.save(update_fields=["expires_at"])

        response = self.client.post(self.verify_url, {"email": self.user.email, "code": self.code})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(PASSWORD_RESET_OTP_MAX_ATTEMPTS=2)
    def test_max_attempts_locks_out_further_tries_even_with_the_correct_code(self):
        for _ in range(2):
            self.client.post(self.verify_url, {"email": self.user.email, "code": "000000"})

        response = self.client.post(self.verify_url, {"email": self.user.email, "code": self.code})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("تلاش", str(response.data))

    def test_otp_is_one_time_use(self):
        first = self.client.post(self.verify_url, {"email": self.user.email, "code": self.code})
        self.assertEqual(first.status_code, status.HTTP_200_OK)

        second = self.client.post(self.verify_url, {"email": self.user.email, "code": self.code})
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_rate_limit_returns_429(self):
        for _ in range(20):
            self.client.post(self.verify_url, {"email": self.user.email, "code": "000000"})
        response = self.client.post(self.verify_url, {"email": self.user.email, "code": "000000"})
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class PasswordResetConfirmTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(email="confirm-target@example.com", password="OldPass123!")
        self.request_url = reverse("password-reset-request")
        self.verify_url = reverse("password-reset-verify")
        self.confirm_url = reverse("password-reset-confirm")
        self.login_url = reverse("account-login")

        self.client.post(self.request_url, {"email": self.user.email})
        code = _extract_code(mail.outbox[0].body)
        verify_response = self.client.post(self.verify_url, {"email": self.user.email, "code": code})
        self.reset_token = verify_response.data["reset_token"]

    def test_confirm_changes_password_and_new_password_logs_in(self):
        response = self.client.post(
            self.confirm_url, {"reset_token": self.reset_token, "new_password": "BrandNewPass456!"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        old_login = self.client.post(self.login_url, {"email": self.user.email, "password": "OldPass123!"})
        self.assertEqual(old_login.status_code, status.HTTP_401_UNAUTHORIZED)

        new_login = self.client.post(self.login_url, {"email": self.user.email, "password": "BrandNewPass456!"})
        self.assertEqual(new_login.status_code, status.HTTP_200_OK)
        self.assertIn("access", new_login.data)

    def test_reset_token_is_one_time_use(self):
        first = self.client.post(
            self.confirm_url, {"reset_token": self.reset_token, "new_password": "BrandNewPass456!"}
        )
        self.assertEqual(first.status_code, status.HTTP_200_OK)

        second = self.client.post(
            self.confirm_url, {"reset_token": self.reset_token, "new_password": "AnotherPass789!"}
        )
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_reset_token_is_rejected(self):
        response = self.client.post(
            self.confirm_url, {"reset_token": "not-a-real-token", "new_password": "BrandNewPass456!"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_expired_reset_token_is_rejected(self):
        reset_request = PasswordResetRequest.objects.get(user=self.user)
        reset_request.reset_token_expires_at = timezone.now() - timedelta(seconds=1)
        reset_request.save(update_fields=["reset_token_expires_at"])

        response = self.client.post(
            self.confirm_url, {"reset_token": self.reset_token, "new_password": "BrandNewPass456!"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unverified_request_cannot_be_used_to_forge_a_token(self):
        # A hand-crafted token for a request that was never verified must not work.
        forged_request = PasswordResetRequest.objects.create(
            user=self.user,
            email=self.user.email,
            otp_hash="irrelevant",
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        token = generate_reset_token()
        forged_request.reset_token_hash = hash_reset_token(token)
        forged_request.reset_token_expires_at = timezone.now() + timedelta(minutes=10)
        forged_request.save()

        response = self.client.post(
            self.confirm_url, {"reset_token": token, "new_password": "BrandNewPass456!"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_weak_new_password_is_rejected(self):
        response = self.client.post(
            self.confirm_url, {"reset_token": self.reset_token, "new_password": "123"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ExistingAuthRegressionTests(APITestCase):
    """Sanity-check that the OTP flow didn't disturb the existing auth endpoints."""

    def test_register_login_me_change_password_logout_still_work(self):
        register = self.client.post(
            reverse("account-register"),
            {"email": "regression@example.com", "password": "RegressionPass123!", "full_name": "Reg"},
        )
        self.assertEqual(register.status_code, status.HTTP_201_CREATED)

        login = self.client.post(
            reverse("account-login"),
            {"email": "regression@example.com", "password": "RegressionPass123!"},
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        access = login.data["access"]
        refresh = login.data["refresh"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        me = self.client.get(reverse("account-me"))
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data["email"], "regression@example.com")

        change_pw = self.client.post(
            reverse("account-change-password"),
            {"old_password": "RegressionPass123!", "new_password": "NewRegressionPass456!"},
        )
        self.assertEqual(change_pw.status_code, status.HTTP_200_OK)

        refresh_response = self.client.post(reverse("account-login-refresh"), {"refresh": refresh})
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)

        logout = self.client.post(reverse("account-logout"), {"refresh": refresh})
        self.assertIn(logout.status_code, (status.HTTP_205_RESET_CONTENT, status.HTTP_400_BAD_REQUEST))
