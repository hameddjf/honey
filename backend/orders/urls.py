from django.urls import path
from rest_framework.routers import DefaultRouter

from .analytics import AdminDashboardView, AdminReportsView
from .views import OrderViewSet

router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")

urlpatterns = [
    path("admin/dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("admin/reports/", AdminReportsView.as_view(), name="admin-reports"),
] + router.urls
