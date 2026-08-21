from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse, inline_serializer
from rest_framework import serializers as drf_serializers

from accounts.permissions import HasRole
from accounts.models import RoleChoices, Student, Lecturer
from management.serializers import (
    UserCompactSerializer,
    UserDetailSerializer,
    UserUpdateSerializer,
    StudentListSerializer,
    StudentDetailSerializer,
    StudentUpdateSerializer,
    LecturerListSerializer,
    LecturerDetailSerializer,
    LecturerUpdateSerializer,
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


# ==========================================
# STUDENT DIRECTORY VIEWS
# ==========================================

class StudentListView(APIView):
    """List/search/filter students."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Student Management'],
        summary='List and search students',
        description=(
            'Returns a list of all students. '
            'Supports `?search=` on student_identifier, user email, first/last name. '
            'Supports `?department=<uuid>` and `?class_standing=` filters.'
        ),
        responses={200: StudentListSerializer(many=True)},
    )
    def get(self, request):
        queryset = Student.objects.select_related(
            'user', 'department'
        ).order_by('-created_at')

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(student_identifier__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
            )

        department = request.query_params.get('department')
        if department:
            queryset = queryset.filter(department_id=department)

        class_standing = request.query_params.get('class_standing')
        if class_standing and class_standing in ClassStandingChoices.values:
            queryset = queryset.filter(class_standing=class_standing)

        serializer = StudentListSerializer(queryset, many=True)
        return Response(serializer.data)


class StudentDetailView(APIView):
    """Retrieve or update a specific student."""

    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Student.objects.select_related(
                'user', 'department'
            ).get(pk=pk)
        except Student.DoesNotExist:
            return None

    def _can_edit(self, request):
        return request.user.is_superuser or request.user.role == RoleChoices.ADMIN

    @extend_schema(
        tags=['Student Management'],
        summary='Get student profile',
        description='Returns full student details with nested user info and department.',
        responses={
            200: StudentDetailSerializer,
            404: OpenApiResponse(
                response=_DetailOut,
                description='Student not found.',
                examples=[OpenApiExample('Not found', value={'detail': 'Student not found.'}, response_only=True)],
            ),
        },
    )
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Students can only view their own profile
        if request.user.role == RoleChoices.STUDENT:
            if not hasattr(request.user, 'student_profile') or request.user.student_profile.pk != obj.pk:
                return Response({'detail': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(StudentDetailSerializer(obj).data)

    @extend_schema(
        tags=['Student Management'],
        summary='Update student information',
        description=(
            'Partially update a student. Allowed fields: `student_identifier`, '
            '`class_standing`, `department_id`. Admin only.'
        ),
        request=StudentUpdateSerializer,
        responses={
            200: StudentDetailSerializer,
            400: OpenApiResponse(description='Validation error.'),
            403: OpenApiResponse(description='Permission denied.'),
            404: OpenApiResponse(description='Student not found.'),
        },
    )
    def patch(self, request, pk):
        if not self._can_edit(request):
            return Response(
                {'detail': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = StudentUpdateSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(StudentDetailSerializer(obj).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# LECTURER DIRECTORY VIEWS

class LecturerListView(APIView):
    """List/search/filter lecturers."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Lecturer Management'],
        summary='List and search lecturers',
        description=(
            'Returns a list of all lecturers. '
            'Supports `?search=` on faculty_identifier, user email, first/last name. '
            'Supports `?department=<uuid>` filter.'
        ),
        responses={200: LecturerListSerializer(many=True)},
    )
    def get(self, request):
        queryset = Lecturer.objects.select_related(
            'user', 'department'
        ).order_by('-created_at')

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(faculty_identifier__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
            )

        department = request.query_params.get('department')
        if department:
            queryset = queryset.filter(department_id=department)

        serializer = LecturerListSerializer(queryset, many=True)
        return Response(serializer.data)


class LecturerDetailView(APIView):
    """Retrieve or update a specific lecturer."""

    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Lecturer.objects.select_related(
                'user', 'department'
            ).get(pk=pk)
        except Lecturer.DoesNotExist:
            return None

    def _can_edit(self, request):
        return request.user.is_superuser or request.user.role == RoleChoices.ADMIN

    @extend_schema(
        tags=['Lecturer Management'],
        summary='Get lecturer profile',
        description='Returns full lecturer details with nested user info and department.',
        responses={
            200: LecturerDetailSerializer,
            404: OpenApiResponse(
                response=_DetailOut,
                description='Lecturer not found.',
                examples=[OpenApiExample('Not found', value={'detail': 'Lecturer not found.'}, response_only=True)],
            ),
        },
    )
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Lecturer not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Lecturers can only view their own profile
        if request.user.role == RoleChoices.LECTURER:
            if not hasattr(request.user, 'lecturer_profile') or request.user.lecturer_profile.pk != obj.pk:
                return Response({'detail': 'Lecturer not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(LecturerDetailSerializer(obj).data)

    @extend_schema(
        tags=['Lecturer Management'],
        summary='Update lecturer information',
        description=(
            'Partially update a lecturer. Allowed fields: `faculty_identifier`, '
            '`department_id`. Admin only.'
        ),
        request=LecturerUpdateSerializer,
        responses={
            200: LecturerDetailSerializer,
            400: OpenApiResponse(description='Validation error.'),
            403: OpenApiResponse(description='Permission denied.'),
            404: OpenApiResponse(description='Lecturer not found.'),
        },
    )
    def patch(self, request, pk):
        if not self._can_edit(request):
            return Response(
                {'detail': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Lecturer not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = LecturerUpdateSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(LecturerDetailSerializer(obj).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
