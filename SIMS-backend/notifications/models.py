from django.db import models
from django.conf import settings
from common.models import BaseModel

class Notification(BaseModel):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    message_body = models.TextField()
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification to {self.recipient.email} - {'Read' if self.is_read else 'Unread'}"
