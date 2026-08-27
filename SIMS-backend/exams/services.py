def gradeability_errors(examination):
    """Return a list of problems preventing deterministic auto-grading.

    Objective-grading mode: an exam may only contain questions whose answers
    can be scored by comparing the student's response against a stored correct
    answer, with no LLM and no manual rubric grading:
      - ESSAY and SHORT_ANSWER questions are not allowed (both require AI
        grading and are only available while the AI feature is enabled).
      - MCQ questions must have exactly one correct option.

    An empty list means the exam can be scheduled and fully auto-graded.
    """
    from questions.models import QuestionTypeChoices

    errors = []
    for question in examination.questions.all():
        if question.question_type in (
            QuestionTypeChoices.ESSAY,
            QuestionTypeChoices.SHORT_ANSWER,
        ):
            errors.append(
                f"Question '{question.question_text[:60]}' is a "
                f"{question.question_type} question and cannot be auto-graded "
                "while AI grading is disabled."
            )
        elif question.question_type == QuestionTypeChoices.MCQ:
            correct_count = question.options.filter(is_correct=True).count()
            if correct_count != 1:
                errors.append(
                    f"MCQ '{question.question_text[:60]}' must have exactly one correct "
                    f"option (found {correct_count})."
                )
    return errors


def sync_examination_lifecycle(now=None):
    """Synchronize examination statuses based on server time and lifecycle rules.

    Transitions:
    1. SCHEDULED -> ACTIVE (when start_window <= now < end_window)
    2. ACTIVE -> CLOSED (when end_window <= now)
    """
    from django.utils import timezone
    from exams.models import ExamStatusChoices, Examination

    if now is None:
        now = timezone.now()

    # 1. SCHEDULED -> ACTIVE: start window reached and end window has not passed
    Examination.objects.filter(
        status=ExamStatusChoices.SCHEDULED,
        start_window__lte=now,
        end_window__gt=now,
    ).update(
        status=ExamStatusChoices.ACTIVE,
        updated_at=now,
    )

    # 2. ACTIVE -> CLOSED: active examinations whose end window has passed
    Examination.objects.filter(
        status=ExamStatusChoices.ACTIVE,
        end_window__lte=now,
    ).update(
        status=ExamStatusChoices.CLOSED,
        updated_at=now,
    )


def sync_single_exam_status(exam, now=None):
    """Synchronize a single examination's status based on current time if SCHEDULED or ACTIVE."""
    from django.utils import timezone
    from exams.models import ExamStatusChoices

    if not exam or not exam.start_window or not exam.end_window:
        return exam

    if now is None:
        now = timezone.now()

    if exam.status == ExamStatusChoices.SCHEDULED:
        if exam.start_window <= now < exam.end_window:
            exam.status = ExamStatusChoices.ACTIVE
            exam.save(update_fields=["status", "updated_at"])
    elif exam.status == ExamStatusChoices.ACTIVE:
        if exam.end_window <= now:
            exam.status = ExamStatusChoices.CLOSED
            exam.save(update_fields=["status", "updated_at"])

    return exam


