from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from products.models import Category, Product, ProductComment, ProductReaction

User = get_user_model()


class ProductSocialTests(APITestCase):
    def setUp(self):
        cat = Category.objects.create(name="عسل‌ها")
        self.product = Product.objects.create(name="عسل مرکبات", slug="citrus", category=cat, price=800000, stock=5)
        self.user = User.objects.create_user("a@example.com", "pass12345", full_name="علی")
        self.other = User.objects.create_user("b@example.com", "pass12345")
        self.staff = User.objects.create_user("s@example.com", "pass12345", is_staff=True)
        self.react_url = "/api/v1/products/citrus/reactions/"
        self.comments_url = "/api/v1/products/citrus/comments/"

    def test_reactions_require_login_and_percent_is_likes_over_total(self):
        self.assertEqual(self.client.post(self.react_url, {"value": 1}).status_code, 401)
        empty = self.client.get(self.react_url).json()
        self.assertEqual((empty["likes"], empty["dislikes"], empty["percent"]), (0, 0, None))

        for i in range(10):
            ProductReaction.objects.create(product=self.product, user=User.objects.create_user(f"l{i}@example.com", "x12345678"), value=1)
        for i in range(2):
            ProductReaction.objects.create(product=self.product, user=User.objects.create_user(f"d{i}@example.com", "x12345678"), value=-1)
        data = self.client.get(self.react_url).json()
        self.assertEqual((data["likes"], data["dislikes"], data["percent"]), (10, 2, 83))

    def test_one_reaction_per_user_can_switch_and_remove(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.post(self.react_url, {"value": 1}).json()["percent"], 100)
        data = self.client.post(self.react_url, {"value": -1}).json()
        self.assertEqual((data["likes"], data["dislikes"], data["my_reaction"], data["percent"]), (0, 1, -1, 0))
        data = self.client.post(self.react_url, {"value": 0}).json()
        self.assertEqual((data["total"], data["percent"], data["my_reaction"]), (0, None, 0))
        self.assertEqual(self.client.post(self.react_url, {"value": 5}).status_code, 400)

    def test_comments_thread_counter_and_validation(self):
        self.assertEqual(self.client.post(self.comments_url, {"body": "x"}).status_code, 401)
        self.client.force_authenticate(self.user)
        top = self.client.post(self.comments_url, {"body": "  عسل عالی بود  "})
        self.assertEqual(top.status_code, 201)
        self.assertEqual(top.json()["body"], "عسل عالی بود")
        top_id = top.json()["id"]

        self.client.force_authenticate(self.staff)
        reply = self.client.post(self.comments_url, {"body": "ممنون!", "parent": top_id})
        self.assertEqual(reply.status_code, 201)
        # replies to a reply are refused (one level only), and so are blank bodies
        self.assertEqual(self.client.post(self.comments_url, {"body": "x", "parent": reply.json()["id"]}).status_code, 400)
        self.assertEqual(self.client.post(self.comments_url, {"body": "   "}).status_code, 400)
        self.assertEqual(self.client.post(self.comments_url, {"body": "a" * 1001}).status_code, 400)

        self.client.force_authenticate(None)
        data = self.client.get(self.comments_url).json()
        self.assertEqual(data["count"], 2)
        self.assertEqual(len(data["results"]), 1)
        self.assertEqual(data["results"][0]["author"], "علی")
        self.assertTrue(data["results"][0]["replies"][0]["is_staff"])
        self.assertNotIn("email", data["results"][0])
        self.assertEqual(self.client.get(self.react_url).json()["comment_count"], 2)

    def test_hidden_comments_and_delete_permissions(self):
        mine = ProductComment.objects.create(product=self.product, user=self.user, body="سلام")
        hidden = ProductComment.objects.create(product=self.product, user=self.user, body="مخفی", is_visible=False)
        self.assertEqual(self.client.get(self.comments_url).json()["count"], 1)

        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.delete(f"{self.comments_url}{mine.id}/").status_code, 403)
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.delete(f"{self.comments_url}{mine.id}/").status_code, 204)
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.delete(f"{self.comments_url}{hidden.id}/").status_code, 204)

    def test_unknown_product_is_404(self):
        self.assertEqual(self.client.get("/api/v1/products/nope/reactions/").status_code, 404)
        self.assertEqual(self.client.get("/api/v1/products/nope/comments/").status_code, 404)
