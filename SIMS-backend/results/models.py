from django.db import models
from common.models import BaseModel

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
