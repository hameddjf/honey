from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class UserModelTests(APITestCase):
    def test_create_user_hashes_password(self):
        user = User.objects.create_user(email="alice@example.com", password="strong-pass-123")
        self.assertNotEqual(user.password, "strong-pass-123")
        self.assertTrue(user.check_password("strong-pass-123"))
        self.assertFalse(user.is_staff)
        self.assertTrue(user.is_active)

    def test_create_superuser_sets_staff_and_superuser(self):
        admin = User.objects.create_superuser(email="admin@example.com", password="strong-pass-123")
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_email_is_the_username_field(self):
        self.assertEqual(User.USERNAME_FIELD, "email")


class RegistrationAndAuthTests(APITestCase):
    def test_register_creates_user(self):
        url = reverse("account-register")
        response = self.client.post(
            url,
            {"email": "bob@example.com", "password": "strong-pass-123", "full_name": "Bob"},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="bob@example.com").exists())
        # Password must never be echoed back.
        self.assertNotIn("password", response.data)

    def test_register_rejects_duplicate_email(self):
        User.objects.create_user(email="dup@example.com", password="strong-pass-123")
        url = reverse("account-register")
        response = self.client.post(url, {"email": "dup@example.com", "password": "strong-pass-123"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_jwt_tokens(self):
        User.objects.create_user(email="carol@example.com", password="strong-pass-123")
        url = reverse("account-login")
        response = self.client.post(url, {"email": "carol@example.com", "password": "strong-pass-123"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_me_endpoint_requires_authentication(self):
        url = reverse("account-me")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_endpoint_returns_authenticated_user(self):
        user = User.objects.create_user(email="dave@example.com", password="strong-pass-123")
        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("account-me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "dave@example.com")


class ProfileUpdateTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="profile@example.com", password="strong-pass-123", full_name="Old Name"
        )

    def test_user_can_update_own_profile_fields(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            reverse("account-me"), {"full_name": "New Name", "phone_number": "0912"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.full_name, "New Name")
        self.assertEqual(self.user.phone_number, "0912")

    def test_user_cannot_change_email_or_staff_flag_via_profile_update(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            reverse("account-me"),
            {"email": "hacker@example.com", "is_staff": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "profile@example.com")
        self.assertFalse(self.user.is_staff)

    def test_anonymous_cannot_update_profile(self):
        response = self.client.patch(reverse("account-me"), {"full_name": "X"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ChangePasswordTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="pwchange@example.com", password="old-pass-123")

    def test_change_password_with_correct_old_password(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse("account-change-password"),
            {"old_password": "old-pass-123", "new_password": "brand-new-pass-456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("brand-new-pass-456"))

    def test_change_password_rejects_wrong_old_password(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse("account-change-password"),
            {"old_password": "totally-wrong", "new_password": "brand-new-pass-456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("old-pass-123"))

    def test_change_password_enforces_validators(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse("account-change-password"),
            {"old_password": "old-pass-123", "new_password": "123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LogoutTests(APITestCase):
    def test_logout_blacklists_refresh_token(self):
        user = User.objects.create_user(email="logout@example.com", password="strong-pass-123")
        login = self.client.post(
            reverse("account-login"), {"email": "logout@example.com", "password": "strong-pass-123"}
        )
        refresh = login.data["refresh"]

        self.client.force_authenticate(user=user)
        response = self.client.post(reverse("account-logout"), {"refresh": refresh}, format="json")
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)

        refresh_response = self.client.post(reverse("account-login-refresh"), {"refresh": refresh})
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)


class CustomerManagementTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(email="cmstaff@example.com", password="pw12345", is_staff=True)
        self.customer_a = User.objects.create_user(
            email="cma@example.com", password="pw12345", full_name="Customer A"
        )
        self.customer_b = User.objects.create_user(
            email="cmb@example.com", password="pw12345", full_name="Customer B"
        )

    def test_staff_can_list_customers(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get(reverse("customer-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [c["email"] for c in response.data["results"]]
        self.assertIn("cma@example.com", emails)
        self.assertIn("cmb@example.com", emails)

    def test_staff_list_excludes_staff_accounts(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get(reverse("customer-list"))
        emails = [c["email"] for c in response.data["results"]]
        self.assertNotIn("cmstaff@example.com", emails)

    def test_staff_can_search_customers(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get(reverse("customer-list"), {"search": "cma@example.com"})
        emails = [c["email"] for c in response.data["results"]]
        self.assertEqual(emails, ["cma@example.com"])

    def test_customer_cannot_list_customers(self):
        self.client.force_authenticate(user=self.customer_a)
        response = self.client.get(reverse("customer-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_list_customers(self):
        response = self.client.get(reverse("customer-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_can_retrieve_single_customer_with_order_stats(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get(reverse("customer-detail", kwargs={"pk": self.customer_a.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["order_count"], 0)
        self.assertIn("recent_orders", response.data)


class AdminUserManagementTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(email="austaff@example.com", password="pw12345", is_staff=True)
        self.other_staff = User.objects.create_user(
            email="auother@example.com", password="pw12345", is_staff=True
        )
        self.superuser = User.objects.create_superuser(email="ausuper@example.com", password="pw12345")
        self.customer = User.objects.create_user(
            email="aucust@example.com", password="pw12345", full_name="Au Customer"
        )

    def test_staff_can_list_all_users(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get(reverse("admin-user-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [u["email"] for u in response.data["results"]]
        self.assertIn(self.customer.email, emails)
        self.assertIn(self.other_staff.email, emails)
        self.assertIn(self.superuser.email, emails)

    def test_list_never_exposes_password_field(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get(reverse("admin-user-list"))
        for row in response.data["results"]:
            self.assertNotIn("password", row)

    def test_customer_cannot_list_users(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(reverse("admin-user-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_list_users(self):
        response = self.client.get(reverse("admin-user-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_can_promote_customer_to_staff(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(
            reverse("admin-user-detail", kwargs={"pk": self.customer.pk}), {"role": "staff"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertTrue(self.customer.is_staff)
        self.assertEqual(response.data["role"], "staff")

    def test_staff_can_demote_staff_to_customer(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(
            reverse("admin-user-detail", kwargs={"pk": self.other_staff.pk}), {"role": "customer"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.other_staff.refresh_from_db()
        self.assertFalse(self.other_staff.is_staff)

    def test_role_update_rejects_invalid_role_value(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(
            reverse("admin-user-detail", kwargs={"pk": self.customer.pk}), {"role": "superuser"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_role_update_cannot_grant_superuser_via_is_superuser_field(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(
            reverse("admin-user-detail", kwargs={"pk": self.customer.pk}),
            {"role": "staff", "is_superuser": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_superuser)

    def test_staff_cannot_change_own_role(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(
            reverse("admin-user-detail", kwargs={"pk": self.staff.pk}), {"role": "customer"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.staff.refresh_from_db()
        self.assertTrue(self.staff.is_staff)

    def test_staff_cannot_change_superuser_role(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(
            reverse("admin-user-detail", kwargs={"pk": self.superuser.pk}), {"role": "customer"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.superuser.refresh_from_db()
        self.assertTrue(self.superuser.is_superuser)

    def test_staff_can_delete_customer(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.delete(reverse("admin-user-detail", kwargs={"pk": self.customer.pk}))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.customer.pk).exists())

    def test_staff_cannot_delete_own_account(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.delete(reverse("admin-user-detail", kwargs={"pk": self.staff.pk}))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(User.objects.filter(pk=self.staff.pk).exists())

    def test_staff_cannot_delete_superuser_account(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.delete(reverse("admin-user-detail", kwargs={"pk": self.superuser.pk}))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(User.objects.filter(pk=self.superuser.pk).exists())

    def test_customer_cannot_delete_or_modify_users(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.delete(reverse("admin-user-detail", kwargs={"pk": self.other_staff.pk}))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_via_admin_user_endpoint_is_not_allowed(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(
            reverse("admin-user-list"), {"email": "new@example.com", "password": "pw12345"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
