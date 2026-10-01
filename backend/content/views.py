from rest_framework import permissions, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsStaffUser

from .models import BlogPost, MediaAsset, SiteContent, StoreSettings
from .serializers import (
    BlogPostSerializer,
    MediaAssetSerializer,
    MediaAssetWriteSerializer,
    SiteContentSerializer,
    StoreSettingsSerializer,
)


class SiteContentView(APIView):
    """
    The single storefront-content record.

    GET is public (the frontend needs it with no auth). PATCH/PUT are
    staff-only. There is exactly one record; this view always loads/creates
    it rather than requiring a lookup id, which keeps the frontend contract
    to a single flat object at one URL.
    """

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get(self, request):
        content = SiteContent.load()
        return Response(SiteContentSerializer(content).data)

    def patch(self, request):
        content = SiteContent.load()
        serializer = SiteContentSerializer(content, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class StoreSettingsView(APIView):
    """
    The single store-configuration record (shipping rule + admin toggles).

    GET is public — checkout, the shop, and any storefront banner logic
    need to read shipping_enabled/shipping_flat_cost/free_shipping_threshold
    /guest_checkout_enabled/maintenance_mode with no auth. PATCH is
    staff-only, from /admin/settings.
    """

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get(self, request):
        s = StoreSettings.load()
        return Response(StoreSettingsSerializer(s).data)

    def patch(self, request):
        s = StoreSettings.load()
        serializer = StoreSettingsSerializer(s, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def put(self, request):
        content = SiteContent.load()
        serializer = SiteContentSerializer(content, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class BlogPostViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only blog API (list + retrieve by slug).

    Always scoped to published posts, for staff and public callers alike —
    there's no unpublished-post admin workflow yet (see BlogPost's
    docstring), so there's nothing an authenticated request should see
    that an anonymous one shouldn't.
    """

    queryset = BlogPost.objects.filter(is_published=True)
    serializer_class = BlogPostSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    pagination_class = None  # a handful of posts — no need to paginate


class MediaAssetViewSet(viewsets.ModelViewSet):
    """
    Staff-only media library CRUD (list / upload / update metadata /
    delete). Nothing here is public: this is an internal admin tool, not
    storefront content, so unlike BlogPostViewSet/SiteContentView there is
    no anonymous-read path.
    """

    queryset = MediaAsset.objects.all()
    permission_classes = [IsStaffUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = None  # a media library page is expected to fetch+filter client-side
    filterset_fields = ["tag", "is_active"]
    search_fields = ["label", "tag", "alt_text"]
    ordering_fields = ["created_at", "label"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return MediaAssetWriteSerializer
        return MediaAssetSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        asset = serializer.save()
        out = MediaAssetSerializer(asset, context=self.get_serializer_context())
        return Response(out.data, status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        asset = serializer.save()
        out = MediaAssetSerializer(asset, context=self.get_serializer_context())
        return Response(out.data)
