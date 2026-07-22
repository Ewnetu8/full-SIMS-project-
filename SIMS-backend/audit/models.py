from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from common.models import BaseModel

class AuditLog(BaseModel):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action_type = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    payload_snapshot = models.JSONField(default=dict, blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-logged_at']

    def save(self, *args, **kwargs):
        # Prevent any updates to existing audit logs
        # self._state.adding checks if it's a new database record (or self.pk is None/not in DB)
        # Note: If self.pk is not None and we aren't adding, we block it.
        if self.pk is not None and not self._state.adding:
            raise ValidationError("Audit logs are append-only and cannot be modified.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Prevent deletion of audit logs
        raise ValidationError("Audit logs are append-only and cannot be deleted.")

    def __str__(self):
        actor_email = self.actor.email if self.actor else "Anonymous"
        return f"{self.action_type} - {actor_email} - {self.logged_at}"
