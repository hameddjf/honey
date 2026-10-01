from rest_framework.routers import DefaultRouter

from .addresses import AddressViewSet
from .views import CustomerViewSet

router = DefaultRouter()
router.register("customers", CustomerViewSet, basename="customer")
router.register("addresses", AddressViewSet, basename="address")

urlpatterns = router.urls
