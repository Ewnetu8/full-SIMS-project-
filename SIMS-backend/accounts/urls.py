from django.urls import path
from accounts.views import (
    RegisterView,
    LoginView,
    CookieTokenRefreshView,
    LogoutView,
    LecturerProtectedView,
    MFASetupView,
    MFAVerifyView,
    MFADisableView,
    MFALoginView,
)

urlpatterns = [
    path('register', RegisterView.as_view(), name='auth_register'),
    path('login', LoginView.as_view(), name='auth_login'),
    path('refresh', CookieTokenRefreshView.as_view(), name='auth_refresh'),
    path('logout', LogoutView.as_view(), name='auth_logout'),
    path('protected/lecturer-only', LecturerProtectedView.as_view(), name='lecturer_protected'),
    path('mfa/setup', MFASetupView.as_view(), name='mfa_setup'),
    path('mfa/verify', MFAVerifyView.as_view(), name='mfa_verify'),
    path('mfa/disable', MFADisableView.as_view(), name='mfa_disable'),
    path('mfa/login', MFALoginView.as_view(), name='mfa_login'),
]
