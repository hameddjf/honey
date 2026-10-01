from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Address

User = get_user_model()


class AddressBookTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="addr1@example.com", password="pw12345")
        self.other_user = User.objects.create_user(email="addr2@example.com", password="pw12345")

    def test_anonymous_cannot_access_address_book(self):
        response = self.client.get(reverse("address-list"))
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_create_address_becomes_default_automatically(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse("address-list"),
            {"title": "منزل", "city": "تهران", "detail": "خیابان ولیعصر", "postal_code": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["is_default"])

    def test_second_address_is_not_default_by_default(self):
        self.client.force_authenticate(user=self.user)
        Address.objects.create(user=self.user, title="منزل", city="تهران", detail="آدرس یک")
        response = self.client.post(
            reverse("address-list"), {"title": "محل کار", "city": "تهران", "detail": "آدرس دو"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data["is_default"])

    def test_setting_default_unsets_previous_default(self):
        self.client.force_authenticate(user=self.user)
        a1 = Address.objects.create(user=self.user, title="منزل", city="تهران", detail="۱", is_default=True)
        a2 = Address.objects.create(user=self.user, title="محل کار", city="تهران", detail="۲", is_default=False)

        response = self.client.patch(
            reverse("address-detail", kwargs={"pk": a2.pk}), {"is_default": True}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        a1.refresh_from_db()
        a2.refresh_from_db()
        self.assertFalse(a1.is_default)
        self.assertTrue(a2.is_default)

    def test_deleting_default_promotes_another_address(self):
        self.client.force_authenticate(user=self.user)
        a1 = Address.objects.create(user=self.user, title="منزل", city="تهران", detail="۱", is_default=True)
        a2 = Address.objects.create(user=self.user, title="محل کار", city="تهران", detail="۲", is_default=False)

        response = self.client.delete(reverse("address-detail", kwargs={"pk": a1.pk}))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        a2.refresh_from_db()
        self.assertTrue(a2.is_default)

    def test_user_cannot_see_or_edit_another_users_address(self):
        other_addr = Address.objects.create(user=self.other_user, title="منزل", city="تهران", detail="آدرس")
        self.client.force_authenticate(user=self.user)

        list_response = self.client.get(reverse("address-list"))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        ids = [a["id"] for a in list_response.data["results"]] if "results" in list_response.data else [
            a["id"] for a in list_response.data
        ]
        self.assertNotIn(other_addr.id, ids)

        detail_response = self.client.get(reverse("address-detail", kwargs={"pk": other_addr.pk}))
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)
