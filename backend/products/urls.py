from django.urls import path
from rest_framework.routers import DefaultRouter

from .social import ProductCommentDetailView, ProductCommentsView, ProductReactionsView
from .views import CategoryViewSet, ProductViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("products", ProductViewSet, basename="product")

urlpatterns = [
    path("products/<str:slug>/reactions/", ProductReactionsView.as_view(), name="product-reactions"),
    path("products/<str:slug>/comments/", ProductCommentsView.as_view(), name="product-comments"),
    path("products/<str:slug>/comments/<int:comment_id>/", ProductCommentDetailView.as_view(), name="product-comment-detail"),
] + router.urls
