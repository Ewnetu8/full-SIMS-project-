from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_login_failed, user_logged_out
from django.contrib.auth import get_user_model
from audit.models import AuditLog
from accounts.middleware import get_current_request, get_client_ip

User = get_user_model()

@receiver(user_logged_in)
def log_login_success(sender, request, user, **kwargs):
    ip = get_client_ip(request)
    AuditLog.objects.create(
        actor=user,
        action_type="LOGIN_SUCCESS",
        ip_address=ip,
        payload_snapshot={"email": user.email}
    )


@receiver(user_login_failed)
def log_login_failure(sender, credentials, request, **kwargs):
    ip = get_client_ip(request) if request else None
    attempted_email = credentials.get('username') or credentials.get('email') or 'Unknown'
    AuditLog.objects.create(
        actor=None,
        action_type="LOGIN_FAILURE",
        ip_address=ip,
        payload_snapshot={"attempted_email": attempted_email}
    )


@receiver(user_logged_out)
def log_logout(sender, request, user, **kwargs):
    ip = get_client_ip(request) if request else None
    if user:
        AuditLog.objects.create(
            actor=user,
            action_type="LOGOUT",
            ip_address=ip,
            payload_snapshot={"email": user.email}
        )


@receiver(pre_save, sender=User)
def log_role_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = User.objects.get(pk=instance.pk)
            if old_instance.role != instance.role:
                request = get_current_request()
                # Determine who performed the change (actor)
                # If there's an admin logged in and request exists, they are the actor.
                # Otherwise, default to the instance itself.
                actor = None
                if request and request.user and request.user.is_authenticated:
                    actor = request.user
                else:
                    actor = instance

                ip = get_client_ip(request) if request else None
                AuditLog.objects.create(
                    actor=actor,
                    action_type="ROLE_CHANGE",
                    ip_address=ip,
                    payload_snapshot={
                        "target_user_id": str(instance.id),
                        "target_email": instance.email,
                        "old_role": old_instance.role,
                        "new_role": instance.role
                    }
                )
        except User.DoesNotExist:
            pass
