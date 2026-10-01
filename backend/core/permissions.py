from rest_framework import permissions


class IsStaffOrReadOnly(permissions.BasePermission):
    """Anyone can read; only staff/admin users can write."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsStaffUser(permissions.BasePermission):
    """Every action requires an authenticated staff/admin user."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsOwnerOrStaff(permissions.BasePermission):
    """
    Generic object-level check: staff can access anything; everyone else
    only their own record. Expects the object to have a ``user`` attribute,
    or be the user itself (falls back to comparing the object to the
    requesting user).
    """

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        owner_id = getattr(obj, "user_id", None)
        if owner_id is not None:
            return owner_id == getattr(request.user, "id", None)
        return obj == request.user
