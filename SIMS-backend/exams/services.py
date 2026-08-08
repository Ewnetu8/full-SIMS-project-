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
