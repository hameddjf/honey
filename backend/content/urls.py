from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BlogPostViewSet, MediaAssetViewSet, SiteContentView, StoreSettingsView

router = DefaultRouter()
router.register("blog-posts", BlogPostViewSet, basename="blog-post")
router.register("media", MediaAssetViewSet, basename="media-asset")

urlpatterns = [
    path("content/", SiteContentView.as_view(), name="site-content"),
    path("settings/", StoreSettingsView.as_view(), name="store-settings"),
    path("", include(router.urls)),
]
