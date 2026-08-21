from django.urls import path
from management.views import (
    UserListView,
    UserDetailView,
    StudentListView,
    StudentDetailView,
)

urlpatterns = [
    path('users', UserListView.as_view(), name='user_list'),
    path('users/<uuid:pk>', UserDetailView.as_view(), name='user_detail'),
    path('students', StudentListView.as_view(), name='student_list'),
    path('students/<uuid:pk>', StudentDetailView.as_view(), name='student_detail'),
]
