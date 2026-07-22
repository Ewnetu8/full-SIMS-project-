from django.db import models
from common.models import BaseModel

class AIEvaluation(BaseModel):
    student_answer = models.OneToOneField(
        'exams.StudentAnswer',
        on_delete=models.CASCADE,
        related_name='ai_evaluation'
    )
    computed_score = models.DecimalField(max_digits=5, decimal_places=2)
    confidence_score = models.DecimalField(max_digits=3, decimal_places=2)
    evaluation_rationale = models.TextField()
    requires_moderation = models.BooleanField(default=False)
    is_certified = models.BooleanField(default=False)

    def __str__(self):
        return f"AI Eval for Answer {self.student_answer.id} (Score: {self.computed_score})"


class AIFeedback(BaseModel):
    exam_attempt = models.ForeignKey(
        'exams.ExamAttempt',
        on_delete=models.CASCADE,
        related_name='ai_feedbacks'
    )
    feedback_content = models.TextField()
    generation_timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AI Feedback for Attempt {self.exam_attempt.id}"
