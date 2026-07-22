from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from common.models import BaseModel

class RoleChoices(models.TextChoices):
    ADMIN = 'ADMIN', 'Admin'
    LECTURER = 'LECTURER', 'Lecturer'
    STUDENT = 'STUDENT', 'Student'

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, role=RoleChoices.STUDENT, **extra_fields):
        if not email:
            raise ValueError("Users must provide an email address.")
        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        
        # Set is_staff to True if the role is Admin to allow admin login
        if role == RoleChoices.ADMIN:
            user.is_staff = True
            
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, role=RoleChoices.ADMIN, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(
        max_length=10,
        choices=RoleChoices.choices,
        default=RoleChoices.STUDENT
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.email} ({self.role})"

    def save(self, *args, **kwargs):
        # Enforce that is_staff is True for ADMIN roles so they can access the admin dashboard
        if self.role == RoleChoices.ADMIN:
            self.is_staff = True
        super().save(*args, **kwargs)


class Student(BaseModel):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    student_identifier = models.CharField(max_length=50, unique=True)
    department = models.ForeignKey(
        'academics.Department',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='students'
    )

    def __str__(self):
        return f"Student: {self.student_identifier} - {self.user.email}"


class Lecturer(BaseModel):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='lecturer_profile'
    )
    faculty_identifier = models.CharField(max_length=50, unique=True)
    department = models.ForeignKey(
        'academics.Department',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='lecturers'
    )

    def __str__(self):
        return f"Lecturer: {self.faculty_identifier} - {self.user.email}"
