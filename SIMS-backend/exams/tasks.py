import logging

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from exams.models import ExamAttempt, ExamStatusChoices, Examination

logger = logging.getLogger(__name__)


def grade_question(question, answer):
    """Deterministically grade a single StudentAnswer (objective-grading mode).

    Returns the points awarded for the question (0..question.total_points).
    """
    from questions.models import QuestionTypeChoices

    if question.question_type == QuestionTypeChoices.MCQ:
        if answer.selected_option and answer.selected_option.is_correct:
            return float(question.total_points)
        return 0.0

    # ESSAY, SHORT_ANSWER and any other type are not auto-gradable in objective
    # mode; the scheduling gate prevents them from entering a live exam.
    return 0.0


def grade_letter_for(percentage):
    """Map a 0-100 score percentage to a letter grade."""
    if percentage >= 90:
        return "A"
    if percentage >= 80:
        return "B"
    if percentage >= 70:
        return "C"
    if percentage >= 60:
        return "D"
    return "F"


@shared_task(bind=True, ignore_result=True)
def grade_exam_attempt(self, attempt_id):
    """Grade all answers for a submitted ExamAttempt.

    Objective-grading mode: MCQ compares the selected option against the marked
    correct option. ESSAY and SHORT_ANSWER questions contribute 0 and are
    blocked from scheduled exams by the scheduling gate.

    Writes a `Result` (auto-certified by the exam's lecturer) and flips the
    attempt's `grading_status` to GRADING_COMPLETE. Any failure marks the
    attempt GRADING_FAILED so it is visible, never silently stuck.
    """
    from results.models import Result

    try:
        with transaction.atomic():
            attempt = ExamAttempt.objects.select_related(
                "examination__lecturer"
            ).get(pk=attempt_id)
            answers = attempt.answers.select_related(
                "question", "selected_option"
            ).all()

            max_total = 0.0
            awarded = 0.0
            for answer in answers:
                question = answer.question
                max_total += float(question.total_points)
                awarded += grade_question(question, answer)

            percentage = (awarded / max_total * 100.0) if max_total else 0.0

            Result.objects.update_or_create(
                exam_attempt=attempt,
                defaults={
                    "final_score": round(awarded, 2),
                    "grade_letter": grade_letter_for(percentage),
                    "certified_by": attempt.examination.lecturer,
                },
            )
            attempt.grading_status = (
                ExamAttempt.GradingStatusChoices.GRADING_COMPLETE
            )
            attempt.save(update_fields=["grading_status", "updated_at"])
    except ExamAttempt.DoesNotExist:
        logger.error("grade_exam_attempt: attempt %s does not exist", attempt_id)
        raise
    except Exception:
        logger.exception("grade_exam_attempt: failed for attempt %s", attempt_id)
        try:
            attempt = ExamAttempt.objects.get(pk=attempt_id)
            attempt.grading_status = ExamAttempt.GradingStatusChoices.GRADING_FAILED
            attempt.save(update_fields=["grading_status", "updated_at"])
        except ExamAttempt.DoesNotExist:
            pass
        raise


@shared_task(name='exams.tasks.close_expired_exams_and_grade')
def close_expired_exams_and_grade():
    """Periodic sweep (Celery beat) enforcing timer expiry.

    1. Closes any ACTIVE examination whose `end_window` has passed (→ CLOSED).
    2. Freezes and enqueues grading for any attempt that was never submitted
       but whose effective deadline — `min(end_window, start_time +
       duration_minutes)`, the same formula as SubmitExamView — has passed.
       The attempt is frozen at the deadline itself, so an abandoned attempt
       can never stay stuck in GRADING_PENDING.
    """
    now = timezone.now()

    expired_exams = Examination.objects.filter(
        status=ExamStatusChoices.ACTIVE,
        end_window__lte=now,
    )
    for exam in expired_exams:
        exam.status = ExamStatusChoices.CLOSED
        exam.save(update_fields=["status", "updated_at"])

    abandoned = ExamAttempt.objects.filter(
        submission_time__isnull=True,
        grading_status=ExamAttempt.GradingStatusChoices.GRADING_PENDING,
    ).select_related("examination")

    for attempt in abandoned:
        deadline = min(
            attempt.examination.end_window,
            attempt.start_time
            + timezone.timedelta(minutes=attempt.examination.duration_minutes),
        )
        if now < deadline:
            continue
        attempt.submission_time = deadline
        attempt.save(update_fields=["submission_time", "updated_at"])
        grade_exam_attempt.delay(str(attempt.pk))
