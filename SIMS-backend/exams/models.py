from django.db import models
from common.models import BaseModel

class ExamStatusChoices(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    SCHEDULED = 'SCHEDULED', 'Scheduled'
    ACTIVE = 'ACTIVE', 'Active'
    CLOSED = 'CLOSED', 'Closed'
    PUBLISHED = 'PUBLISHED', 'Published'


class Examination(BaseModel):
    course = models.ForeignKey(
        'academics.Course',
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
        default=ExamStatusChoices.DRAFT
    )
    start_window = models.DateTimeField()
    end_window = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.title} ({self.course.course_code})"


class ExamAttempt(BaseModel):
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

    class Meta:
        unique_together = ('examination', 'student')

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
