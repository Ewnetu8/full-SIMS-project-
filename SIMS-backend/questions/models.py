from django.db import models
from common.models import BaseModel

class QuestionTypeChoices(models.TextChoices):
    MCQ = 'MCQ', 'Multiple Choice'
    SHORT_ANSWER = 'SHORT_ANSWER', 'Short Answer'
    ESSAY = 'ESSAY', 'Essay'


class Tag(BaseModel):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Question(BaseModel):
    examination = models.ForeignKey(
        'exams.Examination',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='questions'
    )
    creator = models.ForeignKey(
        'accounts.Lecturer',
        on_delete=models.PROTECT,
        related_name='created_questions'
    )
    question_text = models.TextField()
    question_type = models.CharField(
        max_length=20,
        choices=QuestionTypeChoices.choices
    )
    total_points = models.DecimalField(max_digits=5, decimal_places=2)
    tags = models.ManyToManyField(Tag, related_name='questions', blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"[{self.question_type}] {self.question_text[:50]}"


class QuestionOption(BaseModel):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='options'
    )
    option_text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"Option: {self.option_text[:30]} ({'Correct' if self.is_correct else 'Incorrect'})"


class RubricCriterion(BaseModel):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='rubric_criteria'
    )
    criterion_text = models.TextField()
    point_weight = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        unique_together = ('question', 'criterion_text')

    def __str__(self):
        return f"Criterion: {self.criterion_text[:50]} ({self.point_weight} pts)"
