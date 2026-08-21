from django.urls import path
from management.views import UserListView, UserDetailView

urlpatterns = [
    path('users', UserListView.as_view(), name='user_list'),
    path('users/<uuid:pk>', UserDetailView.as_view(), name='user_detail'),
]
