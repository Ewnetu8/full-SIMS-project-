import re
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email
from rest_framework import serializers
from accounts.models import User, RoleChoices, Student, Lecturer
from academics.models import Department

class UserResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'created_at')
        read_only_fields = fields


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    student_identifier = serializers.CharField(required=False, write_only=True)
    faculty_identifier = serializers.CharField(required=False, write_only=True)
    department_id = serializers.UUIDField(required=False, write_only=True, allow_null=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name', 'role', 
                  'student_identifier', 'faculty_identifier', 'department_id')

    def validate_email(self, value):
        # Validate format
        try:
            validate_email(value)
        except DjangoValidationError:
            raise serializers.ValidationError("Invalid email address format.")

        # Normalize and check duplicate
        email_normalized = value.lower().strip()
        if User.objects.filter(email__iexact=email_normalized).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        
        return email_normalized

    def validate_password(self, value):
        # Validate strength using Django validators
        try:
            # We pass a temporary user to run standard validation checks
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        role = attrs.get('role', RoleChoices.STUDENT)
        
        # Validate profile constraints
        if role == RoleChoices.STUDENT:
            if not attrs.get('student_identifier'):
                raise serializers.ValidationError(
                    {"student_identifier": "Student identifier is required for Student registration."}
                )
        elif role == RoleChoices.LECTURER:
            if not attrs.get('faculty_identifier'):
                raise serializers.ValidationError(
                    {"faculty_identifier": "Faculty identifier is required for Lecturer registration."}
                )
        
        # Verify department if provided
        dep_id = attrs.get('department_id')
        if dep_id:
            try:
                attrs['department'] = Department.objects.get(id=dep_id)
            except Department.DoesNotExist:
                raise serializers.ValidationError({"department_id": "Department not found."})
        else:
            attrs['department'] = None

        return attrs

    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        role = validated_data.pop('role', RoleChoices.STUDENT)
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        
        student_id = validated_data.pop('student_identifier', None)
        faculty_id = validated_data.pop('faculty_identifier', None)
        department = validated_data.pop('department', None)
        
        # Pop department_id if it's there
        validated_data.pop('department_id', None)

        # Create user
        user = User.objects.create_user(
            email=email,
            password=password,
            role=role,
            first_name=first_name,
            last_name=last_name,
            **validated_data
        )

        # Create corresponding profile
        if role == RoleChoices.STUDENT:
            Student.objects.create(
                user=user,
                student_identifier=student_id,
                department=department
            )
        elif role == RoleChoices.LECTURER:
            Lecturer.objects.create(
                user=user,
                faculty_identifier=faculty_id,
                department=department
            )

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
