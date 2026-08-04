from celery import shared_task
from django.utils import timezone


@shared_task(bind=True, ignore_result=True)
def grade_exam_attempt(self, attempt_id):
    """
    Grade all answers for a submitted ExamAttempt.

    This is the handoff point from the submit endpoint. It runs
    asynchronously via Celery and handles:
    - MCQ auto-grading (compare selected_option against is_correct)
    - Essay flagging for manual / AI grading (§9.5 / Phase 4)
    """
    from exams.models import ExamAttempt, StudentAnswer
    from questions.models import QuestionTypeChoices
    from results.models import Result

    attempt = ExamAttempt.objects.select_related("examination").get(pk=attempt_id)
    answers = StudentAnswer.objects.filter(
        exam_attempt=attempt
    ).select_related("question", "selected_option")

    total_score = 0
    for answer in answers:
        question = answer.question
        if question.question_type == QuestionTypeChoices.MCQ:
            if answer.selected_option and answer.selected_option.is_correct:
                total_score += float(question.total_points)
        # Essay questions are flagged for AI / manual grading in Phase 4;
        # they contribute 0 until graded.

    Result.objects.update_or_create(
        exam_attempt=attempt,
        defaults={
            "final_score": total_score,
        },
    )
