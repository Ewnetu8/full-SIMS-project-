from django.db import models
from common.models import BaseModel

class ExamStatusChoices(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    SCHEDULED = 'SCHEDULED', 'Scheduled'
    ACTIVE = 'ACTIVE', 'Active'
    CLOSED = 'CLOSED', 'Closed'
    PUBLISHED = 'PUBLISHED', 'Published'

# a rule table so exams can only move forward
EXAM_STATUS_TRANSITIONS = {
    ExamStatusChoices.DRAFT: {ExamStatusChoices.SCHEDULED},
    ExamStatusChoices.SCHEDULED: {ExamStatusChoices.ACTIVE},
    ExamStatusChoices.ACTIVE: {ExamStatusChoices.CLOSED},
    ExamStatusChoices.CLOSED: {ExamStatusChoices.PUBLISHED},
}


class Examination(BaseModel):
    course_offering = models.ForeignKey(
        'academics.CourseOffering',
        on_delete=models.PROTECT,
        related_name='examinations'
    )
    lecturer = models.ForeignKey(
        'accounts.Lecturer',
        on_delete=models.PROTECT,
        related_name='examinations'
    )
    title = models.CharField(max_length=255)
    status = models.CharField(
        max_length=15,
        choices=ExamStatusChoices.choices,
        default=ExamStatusChoices.DRAFT,
        db_index=True,
    )
    start_window = models.DateTimeField()
    end_window = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField()
    allow_retake = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} ({self.course_offering.course.course_code})"

    def can_transition_to(self, new_status):
        if new_status == self.status:
            return True
        return new_status in EXAM_STATUS_TRANSITIONS.get(self.status, set())

    @property
    def questions_editable(self):
        return self.status in (
            ExamStatusChoices.DRAFT,
            ExamStatusChoices.SCHEDULED,
        )


class ExamAttempt(BaseModel):
    class GradingStatusChoices(models.TextChoices):
        GRADING_PENDING = 'GRADING_PENDING', 'Grading Pending'
        GRADING_COMPLETE = 'GRADING_COMPLETE', 'Grading Complete'
        GRADING_FAILED = 'GRADING_FAILED', 'Grading Failed'

    examination = models.ForeignKey(
        Examination,
        on_delete=models.PROTECT,
        related_name='attempts'
    )
    student = models.ForeignKey(
        'accounts.Student',
        on_delete=models.PROTECT,
        related_name='attempts'
    )
    start_time = models.DateTimeField()
    submission_time = models.DateTimeField(null=True, blank=True)
    is_disrupted = models.BooleanField(default=False)
    grading_status = models.CharField(
        max_length=20,
        choices=GradingStatusChoices.choices,
        default=GradingStatusChoices.GRADING_PENDING,
    )

    def __str__(self):
        return f"Attempt: {self.student.student_identifier} - {self.examination.title}"


class StudentAnswer(BaseModel):
    exam_attempt = models.ForeignKey(
        ExamAttempt,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    question = models.ForeignKey(
        'questions.Question',
        on_delete=models.PROTECT,
        related_name='student_answers'
    )
    selected_option = models.ForeignKey(
        'questions.QuestionOption',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='student_answers'
    )
    submitted_text = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ('exam_attempt', 'question')

    def __str__(self):
        return f"Answer to {self.question.id} for Attempt {self.exam_attempt.id}"
