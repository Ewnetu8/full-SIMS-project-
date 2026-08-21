from rest_framework import serializers
from accounts.models import User, Student, Lecturer, RoleChoices, ClassStandingChoices
from academics.serializers import DepartmentSerializer


# User Management Serializers

class UserCompactSerializer(serializers.ModelSerializer):
    """Compact user representation for list views."""
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at')
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
            'role', 'is_active', 'is_staff', 'student_profile',
            'lecturer_profile', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for PATCH updates on user fields."""
    class Meta:
        model = User
        fields = (
            'first_name', 'last_name', 'national_id_fan',
            'role', 'is_active', 'is_staff',
        )

    def validate_role(self, value):
        if value not in RoleChoices.values:
            raise serializers.ValidationError("Invalid role choice.")
        return value

    def validate(self, attrs):
        user = self.instance
        role = attrs.get('role', user.role)
        is_active = attrs.get('is_active', user.is_active)

        # Prevent admin from deactivating themselves
        if self.context['request'].user.pk == user.pk:
            if 'is_active' in attrs and not is_active:
                raise serializers.ValidationError(
                    {"is_active": "You cannot deactivate your own account."}
                )
            if 'role' in attrs and role != user.role:
                raise serializers.ValidationError(
                    {"role": "You cannot change your own role."}
                )

        # If role changes away from ADMIN, ensure is_staff follows
        if role == RoleChoices.ADMIN:
            attrs['is_staff'] = True

        return attrs
