from rest_framework import serializers
from accounts.models import User, Student, Lecturer, RoleChoices, ClassStandingChoices
from academics.models import Department
from academics.serializers import DepartmentSerializer


# User Management Serializers

class UserCompactSerializer(serializers.ModelSerializer):
    """Compact user representation for list views."""
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'university', 'created_at')
        read_only_fields = ('id', 'created_at')


class StudentNestedSerializer(serializers.ModelSerializer):
    """Read-only nested student profile."""
    department_detail = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = Student
        fields = ('id', 'student_identifier', 'class_standing', 'department', 'department_detail')
        read_only_fields = fields


class LecturerNestedSerializer(serializers.ModelSerializer):
    """Read-only nested lecturer profile."""
    department_detail = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = Lecturer
        fields = ('id', 'faculty_identifier', 'department', 'department_detail')
        read_only_fields = fields


class UserDetailSerializer(serializers.ModelSerializer):
    """Full user detail with nested student/lecturer profile."""
    student_profile = StudentNestedSerializer(read_only=True)
    lecturer_profile = LecturerNestedSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'national_id_fan',
            'role', 'is_active', 'is_staff', 'university', 'student_profile',
            'lecturer_profile', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for PATCH updates on user fields."""
    class Meta:
        model = User
        fields = (
            'first_name', 'last_name', 'national_id_fan',
            'role', 'is_active', 'university',
        )

    def validate_role(self, value):
        if value not in RoleChoices.values:
            raise serializers.ValidationError("Invalid role choice.")
        return value

    def validate(self, attrs):
        user = self.instance
        role = attrs.get('role', user.role)
        is_active = attrs.get('is_active', user.is_active)
        request_user = self.context['request'].user

        # Prevent admin from deactivating themselves
        if request_user.pk == user.pk:
            if 'is_active' in attrs and not is_active:
                raise serializers.ValidationError(
                    {"is_active": "You cannot deactivate your own account."}
                )
            if 'role' in attrs and role != user.role:
                raise serializers.ValidationError(
                    {"role": "You cannot change your own role."}
                )

        # Only System Admin can assign SYSTEM_ADMIN role
        if role == RoleChoices.SYSTEM_ADMIN and request_user.role != RoleChoices.SYSTEM_ADMIN:
            raise serializers.ValidationError(
                {"role": "Only System Admin can assign the System Admin role."}
            )

        # Only System Admin can change university assignment
        if 'university' in attrs and request_user.role != RoleChoices.SYSTEM_ADMIN:
            raise serializers.ValidationError(
                {"university": "Only System Admin can change university assignment."}
            )

        # Admin cannot assign SYSTEM_ADMIN role
        if role == RoleChoices.SYSTEM_ADMIN and request_user.role == RoleChoices.ADMIN:
            raise serializers.ValidationError(
                {"role": "Admin cannot assign the System Admin role."}
            )

        return attrs


# Student Directory Serializers

class StudentListSerializer(serializers.ModelSerializer):
    """Compact student representation for list views with nested user and department info."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.SerializerMethodField()
    user_is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    department_detail = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = Student
        fields = (
            'id', 'student_identifier', 'class_standing',
            'department', 'department_detail',
            'user', 'user_email', 'user_full_name', 'user_is_active',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def get_user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()


class StudentDetailSerializer(serializers.ModelSerializer):
    """Full student profile with nested user and department."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    department_detail = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = Student
        fields = (
            'id', 'student_identifier', 'class_standing',
            'department', 'department_detail',
            'user', 'user_email', 'user_first_name', 'user_last_name', 'user_is_active',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')


class StudentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for PATCH updates on student fields."""
    department_id = serializers.UUIDField(required=False, write_only=True, allow_null=True)

    class Meta:
        model = Student
        fields = ('student_identifier', 'class_standing', 'department_id')

    def validate_class_standing(self, value):
        if value not in ClassStandingChoices.values:
            raise serializers.ValidationError("Invalid class standing choice.")
        return value

    def validate_department_id(self, value):
        if value is not None:
            try:
                Department.objects.get(pk=value)
            except Department.DoesNotExist:
                raise serializers.ValidationError("Department not found.")
        return value

    def validate_student_identifier(self, value):
        student = self.instance
        if Student.objects.filter(student_identifier=value).exclude(pk=student.pk).exists():
            raise serializers.ValidationError("A student with this identifier already exists.")
        return value

    def validate(self, attrs):
        dept_id = attrs.pop('department_id', None)
        if dept_id is not None:
            attrs['department'] = Department.objects.get(pk=dept_id) if dept_id else None
        return attrs


# Lecturer Directory Serializers

class LecturerListSerializer(serializers.ModelSerializer):
    """Compact lecturer representation for list views with nested user and department info."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.SerializerMethodField()
    user_is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    department_detail = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = Lecturer
        fields = (
            'id', 'faculty_identifier',
            'department', 'department_detail',
            'user', 'user_email', 'user_full_name', 'user_is_active',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def get_user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()


class LecturerDetailSerializer(serializers.ModelSerializer):
    """Full lecturer profile with nested user and department."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    department_detail = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = Lecturer
        fields = (
            'id', 'faculty_identifier',
            'department', 'department_detail',
            'user', 'user_email', 'user_first_name', 'user_last_name', 'user_is_active',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')


class LecturerUpdateSerializer(serializers.ModelSerializer):
    """Serializer for PATCH updates on lecturer fields."""
    department_id = serializers.UUIDField(required=False, write_only=True, allow_null=True)

    class Meta:
        model = Lecturer
        fields = ('faculty_identifier', 'department_id')

    def validate_department_id(self, value):
        if value is not None:
            try:
                Department.objects.get(pk=value)
            except Department.DoesNotExist:
                raise serializers.ValidationError("Department not found.")
        return value

    def validate_faculty_identifier(self, value):
        lecturer = self.instance
        if Lecturer.objects.filter(faculty_identifier=value).exclude(pk=lecturer.pk).exists():
            raise serializers.ValidationError("A lecturer with this faculty identifier already exists.")
        return value

    def validate(self, attrs):
        dept_id = attrs.pop('department_id', None)
        if dept_id is not None:
            attrs['department'] = Department.objects.get(pk=dept_id) if dept_id else None
        return attrs
