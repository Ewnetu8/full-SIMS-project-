from django.db import models
from django.core.exceptions import ValidationError
from common.models import BaseModel
from accounts.models import ClassStandingChoices
from academics.services import check_prerequisite_cycle


class University(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=10, unique=True)

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.upper().strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.code})"


class College(BaseModel):
    university = models.ForeignKey(
        University,
        on_delete=models.PROTECT,
        related_name='colleges'
    )
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=10, unique=True)

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.upper().strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Department(BaseModel):
    college = models.ForeignKey(
        College,
        on_delete=models.PROTECT,
        related_name='departments',
        null=True,
        blank=True
    )
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=10, unique=True)

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.upper().strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.code})"


class DegreeLevelChoices(models.TextChoices):
    BACHELOR = 'BACHELOR', 'Bachelor'
    MASTER = 'MASTER', 'Master'
    DOCTORATE = 'DOCTORATE', 'Doctorate'
    DIPLOMA = 'DIPLOMA', 'Diploma'
    CERTIFICATE = 'CERTIFICATE', 'Certificate'


class Program(BaseModel):
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='programs'
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20, unique=True)
    degree_level = models.CharField(
        max_length=20,
        choices=DegreeLevelChoices.choices,
        default=DegreeLevelChoices.BACHELOR
    )
    total_credit_hours_required = models.PositiveIntegerField(default=120)

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.upper().strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} [{self.degree_level}] ({self.code})"


class AcademicYear(BaseModel):
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name='academic_years',
        null=True,
        blank=True
    )
    display_label = models.CharField(max_length=100)
    start_boundary = models.DateField()
    end_boundary = models.DateField()

    def __str__(self):
        return self.display_label


class SemesterChoices(models.TextChoices):
    FIRST = 'FIRST', 'First'
    SECOND = 'SECOND', 'Second'
    SUMMER = 'SUMMER', 'Summer'


class Semester(BaseModel):
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name='semesters'
    )
    semester_index = models.CharField(
        max_length=10,
        choices=SemesterChoices.choices
    )

    class Meta:
        unique_together = ('academic_year', 'semester_index')

    def __str__(self):
        return f"{self.get_semester_index_display()} ({self.academic_year.display_label})"


class Course(BaseModel):
    program = models.ForeignKey(
        Program,
        on_delete=models.PROTECT,
        related_name='courses',
        null=True,
        blank=True
    )
    title = models.CharField(max_length=255)
    course_code = models.CharField(max_length=20, unique=True)
    credit_hours = models.PositiveIntegerField(default=3)
    intended_class_standing = models.CharField(
        max_length=20,
        choices=ClassStandingChoices.choices,
        default=ClassStandingChoices.FRESHMAN
    )

    def save(self, *args, **kwargs):
        if self.course_code:
            self.course_code = self.course_code.upper().strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.course_code} - {self.title}"


class CoursePrerequisite(BaseModel):
    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name='prerequisites'
    )
    prerequisite_course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name='prerequisite_for'
    )

    class Meta:
        unique_together = ('course', 'prerequisite_course')
        indexes = [
            models.Index(fields=['course'], name='idx_courseprereq_course'),
        ]

    def clean(self):
        super().clean()
        if self.course_id and self.prerequisite_course_id:
            check_prerequisite_cycle(self.course, self.prerequisite_course)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.course.course_code} requires {self.prerequisite_course.course_code}"


class CourseOffering(BaseModel):
    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name='offerings'
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name='offerings'
    )
    section = models.CharField(max_length=10, default="A")
    capacity = models.PositiveIntegerField(default=50)

    class Meta:
        unique_together = ('course', 'semester', 'section')
        indexes = [
            models.Index(fields=['course', 'semester'], name='idx_offering_course_sem'),
        ]

    def __str__(self):
        return f"{self.course.course_code} ({self.semester}) - Sec {self.section}"


class CreditHourPolicy(BaseModel):
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name='credit_hour_policies',
        null=True,
        blank=True
    )
    class_standing = models.CharField(
        max_length=20,
        choices=ClassStandingChoices.choices
    )
    min_credit_hours = models.PositiveIntegerField(default=12)
    max_credit_hours = models.PositiveIntegerField(default=18)

    class Meta:
        unique_together = ('university', 'class_standing')

    def __str__(self):
        return f"{self.class_standing}: {self.min_credit_hours}-{self.max_credit_hours} hrs"


class OverrideTypeChoices(models.TextChoices):
    PREREQUISITE = 'PREREQUISITE', 'Prerequisite'
    STANDING = 'STANDING', 'Standing'
    CREDIT_LIMIT = 'CREDIT_LIMIT', 'Credit Limit'
    DUPLICATE = 'DUPLICATE', 'Duplicate'
    ALL = 'ALL', 'All'


class EnrollmentOverride(BaseModel):
    student = models.ForeignKey(
        'accounts.Student',
        on_delete=models.CASCADE,
        related_name='enrollment_overrides'
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name='enrollment_overrides'
    )
    override_type = models.CharField(
        max_length=20,
        choices=OverrideTypeChoices.choices,
        default=OverrideTypeChoices.ALL
    )
    approved_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_overrides'
    )
    reason = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Override [{self.override_type}] for {self.student.student_identifier} ({self.semester})"


class TeachingAssignment(BaseModel):
    lecturer = models.ForeignKey(
        'accounts.Lecturer',
        on_delete=models.CASCADE,
        related_name='teaching_assignments'
    )
    course_offering = models.ForeignKey(
        CourseOffering,
        on_delete=models.CASCADE,
        related_name='teaching_assignments'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('lecturer', 'course_offering')

    def __str__(self):
        return f"{self.lecturer.faculty_identifier} → {self.course_offering}"


class EnrollmentStatusChoices(models.TextChoices):
    ENROLLED = 'ENROLLED', 'Enrolled'
    PASSED = 'PASSED', 'Passed'
    FAILED = 'FAILED', 'Failed'
    DROPPED = 'DROPPED', 'Dropped'


class Enrollment(BaseModel):
    student = models.ForeignKey(
        'accounts.Student',
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    course_offering = models.ForeignKey(
        CourseOffering,
        on_delete=models.CASCADE,
        related_name='enrollments',
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=EnrollmentStatusChoices.choices,
        default=EnrollmentStatusChoices.ENROLLED
    )
    is_retake = models.BooleanField(default=False)
    grade = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        unique_together = ('student', 'course_offering')
        indexes = [
            models.Index(fields=['student', 'course_offering'], name='idx_enroll_student_offer'),
        ]

    def __str__(self):
        offering_str = str(self.course_offering) if self.course_offering else "No Offering"
        return f"{self.student.student_identifier} - {offering_str} ({self.status})"
