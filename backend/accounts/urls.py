from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import ChangePasswordView, LogoutView, MeView, RegisterView
from .views_password_reset import (
    PasswordResetConfirmView,
    PasswordResetRequestView,
    PasswordResetVerifyView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="account-register"),
    path("login/", TokenObtainPairView.as_view(), name="account-login"),
    path("login/refresh/", TokenRefreshView.as_view(), name="account-login-refresh"),
    path("logout/", LogoutView.as_view(), name="account-logout"),
    path("me/", MeView.as_view(), name="account-me"),
    path("me/change-password/", ChangePasswordView.as_view(), name="account-change-password"),
    path("password-reset/request/", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path("password-reset/verify/", PasswordResetVerifyView.as_view(), name="password-reset-verify"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
]
