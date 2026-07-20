from django.db import models
from common.models import BaseModel

class Department(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=10, unique=True)

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.upper().strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Course(BaseModel):
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='courses'
    )
    title = models.CharField(max_length=255)
    course_code = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return f"{self.course_code} - {self.title}"


class AcademicYear(BaseModel):
    display_label = models.CharField(max_length=100)
    start_boundary = models.DateField()
    end_boundary = models.DateField()

    def __str__(self):
        return self.display_label


class TermChoices(models.TextChoices):
    FIRST = 'FIRST', 'First'
    SECOND = 'SECOND', 'Second'
    SUMMER = 'SUMMER', 'Summer'


class Semester(BaseModel):
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name='semesters'
    )
    term_index = models.CharField(
        max_length=10,
        choices=TermChoices.choices
    )

    def __str__(self):
        return f"{self.get_term_index_display()} ({self.academic_year.display_label})"


class Enrollment(BaseModel):
    student = models.ForeignKey(
        'accounts.Student',
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )

    class Meta:
        unique_together = ('student', 'course', 'semester')

    def __str__(self):
        return f"{self.student.student_identifier} - {self.course.course_code}"
