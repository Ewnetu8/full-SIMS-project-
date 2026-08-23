from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models
from common.models import BaseModel


class AssessmentTypeChoices(models.TextChoices):
    TEST = 'TEST', 'Test'
    ASSIGNMENT = 'ASSIGNMENT', 'Assignment'
    OTHER = 'OTHER', 'Other'


class Result(BaseModel):
    exam_attempt = models.OneToOneField(
        'exams.ExamAttempt',
        on_delete=models.CASCADE,
        related_name='result'
    )
    final_score = models.DecimalField(max_digits=5, decimal_places=2)
    grade_letter = models.CharField(max_length=5)  # Can support letter grades like A+, B-, etc.
    certified_by = models.ForeignKey(
        'accounts.Lecturer',
        on_delete=models.PROTECT,
        related_name='certified_results'
    )

    def __str__(self):
        return f"Result for Attempt {self.exam_attempt.id} - {self.grade_letter}"


class Transcript(BaseModel):
    student = models.ForeignKey(
        'accounts.Student',
        on_delete=models.PROTECT,
        related_name='transcripts'
    )
    semester = models.ForeignKey(
        'academics.Semester',
        on_delete=models.PROTECT,
        related_name='transcripts'
    )
    cryptographic_checksum = models.CharField(max_length=64)  # SHA-256 hash length

    class Meta:
        unique_together = ('student', 'semester')

    def __str__(self):
        return f"Transcript: {self.student.student_identifier} ({self.semester})"


class Assessment(BaseModel):
    """A gradable piece of continuous assessment (test, assignment, other).

    Marks entered against an assessment contribute to the student's total
    mark for the course offering according to the assessment `weight`
    (percentage points, e.g. 20 means 20% of the final total).
    """
    course_offering = models.ForeignKey(
        'academics.CourseOffering',
        on_delete=models.CASCADE,
        related_name='assessments'
    )
    created_by = models.ForeignKey(
        'accounts.Lecturer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_assessments'
    )
    title = models.CharField(max_length=255)
    assessment_type = models.CharField(
        max_length=20,
        choices=AssessmentTypeChoices.choices,
        default=AssessmentTypeChoices.TEST
    )
    max_marks = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal('100.00'),
        help_text="Maximum raw score a student can score on this assessment."
    )
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('10.00'),
        help_text="Contribution of this assessment to the course total (percent)."
    )
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    is_published = models.BooleanField(
        default=False,
        help_text="Marks are hidden from students until the assessment is published."
    )

    class Meta:
        unique_together = ('course_offering', 'title')
        ordering = ('course_offering', 'created_at')

    def clean(self):
        super().clean()
        if self.max_marks is not None and self.max_marks <= 0:
            raise ValidationError({'max_marks': 'max_marks must be greater than zero.'})
        if self.weight is not None and not (Decimal('0.01') <= self.weight <= Decimal('100')):
            raise ValidationError({'weight': 'weight must be between 0.01 and 100 percent.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.get_assessment_type_display()}) - {self.course_offering}"


class Mark(BaseModel):
    """The raw mark one enrolled student earned on one assessment."""
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name='marks'
    )
    enrollment = models.ForeignKey(
        'academics.Enrollment',
        on_delete=models.CASCADE,
        related_name='marks'
    )
    score = models.DecimalField(max_digits=6, decimal_places=2)
    remarks = models.CharField(max_length=255, blank=True)
    entered_by = models.ForeignKey(
        'accounts.Lecturer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='entered_marks'
    )

    class Meta:
        unique_together = ('assessment', 'enrollment')

    def clean(self):
        super().clean()
        if self.enrollment_id and self.enrollment.course_offering_id != self.assessment.course_offering_id:
            raise ValidationError(
                {'enrollment': 'The student is not enrolled in the offering this assessment belongs to.'}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.score}/{self.assessment.max_marks} - {self.enrollment}"
