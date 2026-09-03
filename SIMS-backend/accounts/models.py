from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from common.models import BaseModel

class RoleChoices(models.TextChoices):
    SYSTEM_ADMIN = 'SYSTEM_ADMIN', 'System Admin'
    ADMIN = 'ADMIN', 'Admin'
    LECTURER = 'LECTURER', 'Lecturer'
    STUDENT = 'STUDENT', 'Student'

class ClassStandingChoices(models.TextChoices):
    FRESHMAN = 'FRESHMAN', 'Freshman'
    SOPHOMORE = 'SOPHOMORE', 'Sophomore'
    JUNIOR = 'JUNIOR', 'Junior'
    SENIOR = 'SENIOR', 'Senior'
    GRADUATE = 'GRADUATE', 'Graduate'

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
        
        if role == RoleChoices.SYSTEM_ADMIN:
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
    national_id_fan = models.CharField(max_length=50, unique=True, null=True, blank=True)
    role = models.CharField(
        max_length=13,
        choices=RoleChoices.choices,
        default=RoleChoices.STUDENT
    )
    university = models.ForeignKey(
        'academics.University',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admins'
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=255, blank=True, default='')

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.email} ({self.role})"

    def save(self, *args, **kwargs):
        if self.role == RoleChoices.SYSTEM_ADMIN:
            self.is_staff = True
        else:
            self.is_staff = False
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
    class_standing = models.CharField(
        max_length=20,
        choices=ClassStandingChoices.choices,
        default=ClassStandingChoices.FRESHMAN
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


class MFABackupCode(BaseModel):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='backup_codes'
    )
    code_hash = models.CharField(max_length=128)
    used = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'MFA backup codes'

    def __str__(self):
        return f"Backup code for {self.user.email} (used={self.used})"
