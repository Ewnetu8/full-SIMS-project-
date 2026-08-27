import re

from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email
from rest_framework import serializers
from accounts.models import User, RoleChoices, Student, Lecturer
from academics.models import Department

class UserResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'university', 'created_at')
        read_only_fields = fields


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    national_id_fan = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    student_identifier = serializers.CharField(required=False, write_only=True)
    faculty_identifier = serializers.CharField(required=False, write_only=True)
    department_id = serializers.UUIDField(required=False, write_only=True, allow_null=True)
    university_id = serializers.UUIDField(required=False, write_only=True, allow_null=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name', 'national_id_fan', 'role', 
                  'student_identifier', 'faculty_identifier', 'department_id', 'university_id')

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

        # Domain restriction for all roles
        domain = email_normalized.split('@')[-1]
        pattern = settings.ALLOWED_REGISTRATION_DOMAIN_REGEX
        if not re.match(pattern, domain):
            raise serializers.ValidationError(
                "Only emails from approved educational domains are allowed for registration."
            )

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
        elif role == RoleChoices.ADMIN:
            university_id = attrs.get('university_id')
            if not university_id:
                raise serializers.ValidationError(
                    {"university_id": "University is required for Admin registration."}
                )
            try:
                from academics.models import University
                attrs['university'] = University.objects.get(id=university_id)
            except University.DoesNotExist:
                raise serializers.ValidationError({"university_id": "University not found."})
        
        # System Admin should not have a university
        if role == RoleChoices.SYSTEM_ADMIN:
            attrs['university'] = None
            attrs.pop('university_id', None)

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
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        
        student_id = validated_data.pop('student_identifier', None)
        faculty_id = validated_data.pop('faculty_identifier', None)
        department = validated_data.pop('department', None)
        university = validated_data.pop('university', None)
        
        # Pop fields that are not direct User model fields
        validated_data.pop('department_id', None)
        validated_data.pop('university_id', None)

        # Create user
        user = User.objects.create_user(
            email=email,
            password=password,
            role=role,
            first_name=first_name,
            last_name=last_name,
            university=university,
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


class MFAVerifySerializer(serializers.Serializer):
    totp_code = serializers.CharField(min_length=6, max_length=8)

    def validate_totp_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("TOTP code must be digits only.")
        return value


class MFADisableSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
    totp_code = serializers.CharField(min_length=6, max_length=8)

    def validate_totp_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("TOTP code must be digits only.")
        return value


class MFALoginSerializer(serializers.Serializer):
    mfa_token = serializers.CharField()
    totp_code = serializers.CharField(min_length=6, max_length=8)

    def validate_totp_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("TOTP code must be digits only.")
        return value
