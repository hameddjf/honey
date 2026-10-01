from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from core.permissions import IsStaffUser

from .serializers import (
    AdminUserRoleUpdateSerializer,
    AdminUserSerializer,
    ChangePasswordSerializer,
    CustomerDetailSerializer,
    CustomerSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Public endpoint for creating a new customer account."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    """
    The authenticated user's own profile.

    GET returns it; PATCH updates the editable contact fields only
    (see ProfileUpdateSerializer — role/privilege fields are never
    accepted here).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    """Authenticated password change, requiring the current password."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password updated."})


class LogoutView(APIView):
    """
    Blacklists the given refresh token so it can no longer be used —
    the practical equivalent of "logout" for a stateless JWT API.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "A 'refresh' token is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({"detail": "Token is invalid or already blacklisted."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_205_RESET_CONTENT)


class CustomerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Staff-only: list/search/retrieve customers with basic order stats.

    Deliberately read-only and light — this is a management foundation,
    not a CRM (see project brief section 8). Customers manage their own
    data through /accounts/me/, never through this endpoint.
    """

    permission_classes = [IsStaffUser]
    search_fields = ["email", "full_name", "phone_number"]
    ordering_fields = ["created_at", "email", "order_count"]
    ordering = ["-created_at"]
    filterset_fields = ["is_active"]

    def get_queryset(self):
        # Staff accounts are backend operators, not "customers" — keep
        # them out of this list.
        return (
            User.objects.filter(is_staff=False)
            .annotate(order_count=Count("orders"))
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CustomerDetailSerializer
        return CustomerSerializer


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Staff-only: list every user (customer, staff, and superuser) and
    manage the two mutations the admin "Users & Access" page needs —
    role change and delete.

    Distinct from CustomerViewSet (customers only, read-only, used by the
    admin Customers page). This is not a general user-CRUD API: account
    creation stays on /accounts/register/, and only GET/PATCH/DELETE are
    enabled — full PUT is unsupported since the only writable field is
    ``role`` (see AdminUserRoleUpdateSerializer, which never accepts
    is_superuser).

    Two protected-account rules are enforced here, independent of what
    the request body contains:
      - a staff member can never change their own role or delete their
        own account through this endpoint;
      - superuser accounts can never be role-changed or deleted through
        this endpoint at all.
    """

    permission_classes = [IsStaffUser]
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = User.objects.all()
    search_fields = ["email", "full_name", "phone_number"]
    ordering_fields = ["created_at", "email"]
    ordering = ["-created_at"]
    filterset_fields = ["is_staff", "is_active"]

    def get_serializer_class(self):
        if self.action == "partial_update":
            return AdminUserRoleUpdateSerializer
        return AdminUserSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pk == request.user.pk:
            raise PermissionDenied("You cannot change your own role.")
        if instance.is_superuser:
            raise PermissionDenied("Superuser accounts cannot be modified here.")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pk == request.user.pk:
            raise PermissionDenied("You cannot delete your own account.")
        if instance.is_superuser:
            raise PermissionDenied("Superuser accounts cannot be deleted.")
        return super().destroy(request, *args, **kwargs)
