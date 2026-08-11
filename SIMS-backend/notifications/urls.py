from django.urls import path
from notifications.views import NotificationListView, NotificationMarkReadView

urlpatterns = [
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<uuid:pk>/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
]
