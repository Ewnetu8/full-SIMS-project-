from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from notifications.models import Notification
from notifications.serializers import NotificationSerializer, NotificationMarkReadSerializer

User = get_user_model()


def notify_user(user, message_body):
    """Create a single notification for a user."""
    return Notification.objects.create(recipient=user, message_body=message_body)


def notify_course_students(course_offering, message_body):
    """Create a notification for every student enrolled in a course offering."""
    from academics.models import Enrollment
    enrollments = Enrollment.objects.filter(
        course_offering=course_offering,
        status='ENROLLED',
    ).select_related('student__user')
    notifications = []
    for enrollment in enrollments:
        notifications.append(
            Notification(recipient=enrollment.student.user, message_body=message_body)
        )
    return Notification.objects.bulk_create(notifications)


class NotificationListView(generics.ListAPIView):
    """List all notifications for the authenticated user."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by('-created_at')

    @extend_schema(
        tags=['Notifications'],
        summary='List my notifications',
        description=(
            'Returns all notifications belonging to the authenticated user, '
            'ordered by newest first. Supports ?is_read=true/false filtering.'
        ),
        parameters=[
            OpenApiParameter(
                name='is_read',
                type=bool,
                required=False,
                description='Filter by read status (true/false).',
            ),
        ],
        responses={
            200: OpenApiResponse(
                response=NotificationSerializer(many=True),
                description='List of notifications.',
            ),
            401: OpenApiResponse(description='Not authenticated.'),
        },
    )
    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class NotificationMarkReadView(generics.UpdateAPIView):
    """Mark a single notification as read."""
    serializer_class = NotificationMarkReadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @extend_schema(
        tags=['Notifications'],
        summary='Mark notification as read',
        description=(
            'Updates the `is_read` field of a notification owned by the '
            'authenticated user. Typically called with `{"is_read": true}`.'
        ),
        request=NotificationMarkReadSerializer,
        responses={
            200: OpenApiResponse(
                response=NotificationSerializer,
                description='Notification updated.',
            ),
            400: OpenApiResponse(description='Validation error.'),
            404: OpenApiResponse(description='Notification not found.'),
        },
    )
    def patch(self, request, *args, **kwargs):
        notification = self.get_object()
        serializer = self.get_serializer(notification, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(NotificationSerializer(notification).data)
