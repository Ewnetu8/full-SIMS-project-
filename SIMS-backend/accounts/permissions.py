from rest_framework.permissions import BasePermission
from accounts.models import RoleChoices


def HasRole(*allowed_roles):
    """Return a reusable DRF permission class that allows only users with the given roles."""
    allowed_values = {role.value if hasattr(role, 'value') else role for role in allowed_roles}

    class RolePermission(BasePermission):
        def has_permission(self, request, view):
            if not request.user or not request.user.is_authenticated:
                return False

            if request.user.is_superuser:
                return True

            user_role = getattr(request.user, 'role', None)
            if not user_role:
                return False

            return user_role in allowed_values

    return RolePermission


# Convenience aliases for direct role use
IsSystemAdmin = HasRole(RoleChoices.SYSTEM_ADMIN)
IsAdmin = HasRole(RoleChoices.ADMIN)
IsLecturer = HasRole(RoleChoices.LECTURER)
IsStudent = HasRole(RoleChoices.STUDENT)
