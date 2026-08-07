from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(name='notifications.tasks.archive_old_records')
def archive_old_records():
    """
    Stub: In production this would archive records older than 5 years.
    Currently log-only — no data is actually moved or deleted.
    """
    from django.utils import timezone
    from datetime import timedelta

    cutoff = timezone.now() - timedelta(days=5 * 365)
    logger.info(
        '[DataRetention] Archive check executed at %s. Cutoff date: %s. '
        'Records older than this would be archived in production.',
        timezone.now().isoformat(),
        cutoff.date().isoformat(),
    )
