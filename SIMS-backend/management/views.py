from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse, inline_serializer
from rest_framework import serializers as drf_serializers

from accounts.permissions import HasRole
from accounts.models import RoleChoices
from management.serializers import (
    UserCompactSerializer,
    UserDetailSerializer,
    UserUpdateSerializer,
)

User = get_user_model()


_DetailOut = inline_serializer(
    name='MgmtDetailOut',
    fields={'detail': drf_serializers.CharField()},
)


class UserListView(APIView):
    """List all users with optional search and role filter."""

    permission_classes = [IsAuthenticated, HasRole(RoleChoices.ADMIN)]

    @extend_schema(
        tags=['User Management'],
        summary='List all users',
        description=(
            'Returns a paginated list of all users. '
            'Supports `?search=` on email, first_name, last_name and '
            '`?role=` filtering (ADMIN, LECTURER, STUDENT).'
        ),
        responses={200: UserCompactSerializer(many=True)},
    )
    def get(self, request):
        queryset = User.objects.all().order_by('-created_at')

        # Search filter
        search = request.query_params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )

        # Role filter
        role = request.query_params.get('role')
        if role and role in RoleChoices.values:
            queryset = queryset.filter(role=role)

        serializer = UserCompactSerializer(queryset, many=True)
        return Response(serializer.data)


class UserDetailView(APIView):
    """Retrieve, update, or deactivate a specific user."""

    permission_classes = [IsAuthenticated, HasRole(RoleChoices.ADMIN)]

    def get_object(self, pk):
        try:
            return User.objects.select_related(
                'student_profile', 'lecturer_profile'
            ).prefetch_related(
                'student_profile__department',
                'lecturer_profile__department',
            ).get(pk=pk)
        except User.DoesNotExist:
            return None

    @extend_schema(
        tags=['User Management'],
        summary='Get a specific user',
        description='Returns full user details including nested student or lecturer profile.',
        responses={
            200: UserDetailSerializer,
            404: OpenApiResponse(
                response=_DetailOut,
                description='User not found.',
                examples=[OpenApiExample('Not found', value={'detail': 'User not found.'}, response_only=True)],
            ),
        },
    )
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserDetailSerializer(obj).data)

    @extend_schema(
        tags=['User Management'],
        summary='Update user information or status',
        description=(
            'Partially update a user. Allowed fields: `first_name`, `last_name`, '
            '`national_id_fan`, `role`, `is_active`, `is_staff`. '
            'An admin cannot deactivate their own account or change their own role.'
        ),
        request=UserUpdateSerializer,
        responses={
            200: UserDetailSerializer,
            400: OpenApiResponse(description='Validation error.'),
            404: OpenApiResponse(description='User not found.'),
        },
    )
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserUpdateSerializer(obj, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(UserDetailSerializer(obj).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=['User Management'],
        summary='Deactivate a user (soft delete)',
        description='Sets `is_active=False` on the user. Does not hard-delete the record.',
        responses={
            200: _DetailOut,
            400: _DetailOut,
            404: _DetailOut,
        },
    )
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.pk == obj.pk:
            return Response(
                {'detail': 'You cannot deactivate your own account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        obj.is_active = False
        obj.save(update_fields=['is_active', 'updated_at'])
        return Response({'detail': 'User deactivated successfully.'}, status=status.HTTP_200_OK)
