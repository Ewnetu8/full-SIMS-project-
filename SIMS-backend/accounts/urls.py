from django.urls import path
from accounts.views import (
    RegisterView,
    LoginView,
    CookieTokenRefreshView,
    LogoutView,
    LecturerProtectedView,
)

urlpatterns = [
    path('register', RegisterView.as_view(), name='auth_register'),
    path('login', LoginView.as_view(), name='auth_login'),
    path('refresh', CookieTokenRefreshView.as_view(), name='auth_refresh'),
    path('logout', LogoutView.as_view(), name='auth_logout'),
    path('protected/lecturer-only', LecturerProtectedView.as_view(), name='lecturer_protected'),
]
