from django.db.models.signals import pre_delete, pre_save
from django.dispatch import receiver
from questions.models import Question
from rest_framework.exceptions import ValidationError


def _assert_questions_editable(examination):
    if examination is not None and not examination.questions_editable:
        raise ValidationError(
            "Questions may only be added, edited, or removed while the "
            "examination is DRAFT or SCHEDULED (§9.2)."
        )


@receiver(pre_save, sender=Question)
def lock_question_edits_outside_draft_scheduled(sender, instance, **kwargs):
    _assert_questions_editable(instance.examination)


@receiver(pre_delete, sender=Question)
def lock_question_removal_outside_draft_scheduled(sender, instance, **kwargs):
    _assert_questions_editable(instance.examination)
