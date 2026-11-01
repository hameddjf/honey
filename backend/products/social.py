"""Likes/dislikes and comments for products (public read, authenticated write)."""

from django.db import transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import Product, ProductComment, ProductReaction

MAX_COMMENT_LENGTH = 1000


def reaction_summary(product, user=None):
    counts = product.reactions.aggregate(
        likes=Count("id", filter=Q(value=ProductReaction.LIKE)),
        dislikes=Count("id", filter=Q(value=ProductReaction.DISLIKE)),
    )
    likes, dislikes = counts["likes"], counts["dislikes"]
    total = likes + dislikes
    mine = 0
    if user is not None and user.is_authenticated:
        mine = product.reactions.filter(user=user).values_list("value", flat=True).first() or 0
    return {
        "likes": likes,
        "dislikes": dislikes,
        "total": total,
        # share of likes among all reactions; None until someone has reacted
        "percent": round(likes * 100 / total) if total else None,
        "my_reaction": mine,
        "comment_count": product.comments.filter(is_visible=True).count(),
    }


def author_name(user):
    return (user.full_name or "").strip() or "کاربر نیکا"


def serialize_comment(comment, request_user):
    can_delete = bool(
        request_user.is_authenticated and (request_user.is_staff or comment.user_id == request_user.id)
    )
    return {
        "id": comment.id,
        "author": author_name(comment.user),
        "is_staff": comment.user.is_staff,
        "body": comment.body,
        "created_at": comment.created_at,
        "can_delete": can_delete,
    }


class ReactionInputSerializer(serializers.Serializer):
    # 1 = like, -1 = dislike, 0 = remove my reaction
    value = serializers.ChoiceField(choices=[1, -1, 0])


class CommentInputSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=MAX_COMMENT_LENGTH, trim_whitespace=True)
    parent = serializers.IntegerField(required=False, allow_null=True)


class ProductReactionsView(APIView):
    permission_classes = [AllowAny]

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == "POST" else [AllowAny()]

    def get(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        return Response(reaction_summary(product, request.user))

    def post(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        serializer = ReactionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        value = serializer.validated_data["value"]
        if value == 0:
            ProductReaction.objects.filter(product=product, user=request.user).delete()
        else:
            ProductReaction.objects.update_or_create(
                product=product, user=request.user, defaults={"value": value}
            )
        return Response(reaction_summary(product, request.user))


class ProductCommentsView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "product_comment"

    def get_throttles(self):
        # Reading is never throttled; only posting is.
        return super().get_throttles() if self.request.method == "POST" else []

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == "POST" else [AllowAny()]

    def get(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        visible = (
            product.comments.filter(is_visible=True).select_related("user").order_by("created_at")
        )
        replies = {}
        top = []
        for comment in visible:
            if comment.parent_id:
                replies.setdefault(comment.parent_id, []).append(comment)
            else:
                top.append(comment)
        data = []
        for comment in reversed(top):  # newest first
            item = serialize_comment(comment, request.user)
            item["replies"] = [serialize_comment(r, request.user) for r in replies.get(comment.id, [])]
            data.append(item)
        return Response({"count": visible.count(), "results": data})

    @transaction.atomic
    def post(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        serializer = CommentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        parent = None
        parent_id = serializer.validated_data.get("parent")
        if parent_id:
            parent = ProductComment.objects.filter(
                id=parent_id, product=product, is_visible=True, parent__isnull=True
            ).first()
            if parent is None:
                return Response({"detail": "نظر مورد نظر برای پاسخ‌دادن پیدا نشد."}, status=status.HTTP_400_BAD_REQUEST)
        body = serializer.validated_data["body"]
        if not body:
            return Response({"detail": "متن نظر خالی است."}, status=status.HTTP_400_BAD_REQUEST)
        comment = ProductComment.objects.create(product=product, user=request.user, parent=parent, body=body)
        item = serialize_comment(comment, request.user)
        item["parent"] = parent.id if parent else None
        item["replies"] = []
        return Response(item, status=status.HTTP_201_CREATED)


class ProductCommentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, slug, comment_id):
        comment = get_object_or_404(ProductComment, id=comment_id, product__slug=slug)
        if not (request.user.is_staff or comment.user_id == request.user.id):
            return Response({"detail": "اجازه‌ی حذف این نظر را ندارید."}, status=status.HTTP_403_FORBIDDEN)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
