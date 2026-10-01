"""
Root URL configuration.

Everything API-facing is namespaced under /api/v1/ so the API can be
versioned later without disrupting existing clients. Django Admin lives
at /admin/ for internal backend management only — it is not the
customer- or frontend-admin-facing surface.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

api_v1_patterns = [
    path("", include("core.urls")),
    path("accounts/", include("accounts.urls")),
    path("", include("accounts.customer_urls")),
    path("", include("accounts.admin_urls")),
    path("", include("products.urls")),
    path("", include("orders.urls")),
    path("", include("content.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1_patterns)),
]

# Local/dev-only media serving. In production, MEDIA_URL is expected to be
# served by the platform/object storage, not by Django itself — see
# ADMIN_PRODUCTS_MEDIA_REPORT.md "remaining limitation" for details.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
