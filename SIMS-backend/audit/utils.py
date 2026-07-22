from typing import Any, Dict, Optional

from audit.models import AuditLog
from accounts.middleware import get_client_ip


def log_action(actor: Optional[Any], action_type: str, request: Optional[Any] = None, payload: Optional[Dict[str, Any]] = None) -> AuditLog:
    """Create an append-only audit log entry for a request-driven action."""
    payload_snapshot = payload or {}
    ip_address = get_client_ip(request)

    if actor is None and request is not None and hasattr(request, 'user') and request.user.is_authenticated:
        actor = request.user

    return AuditLog.objects.create(
        actor=actor,
        action_type=action_type,
        ip_address=ip_address,
        payload_snapshot=payload_snapshot,
    )
