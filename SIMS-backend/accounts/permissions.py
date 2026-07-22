from rest_framework.permissions import BasePermission
from accounts.models import RoleChoices

class IsRole(BasePermission):
    """
    Base permission class to check if a user belongs to specific roles.
    """
    allowed_roles = []

    def has_permission(self, request, view):
        # Allow administrators full access regardless of role specifications
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusers are granted access automatically
        if request.user.is_superuser or request.user.role == RoleChoices.ADMIN:
            return True
            
        return request.user.role in self.allowed_roles


class IsAdmin(IsRole):
    """
    Allows access only to Admin users.
    """
    allowed_roles = [RoleChoices.ADMIN]


class IsLecturer(IsRole):
    """
    Allows access only to Lecturers.
    """
    allowed_roles = [RoleChoices.LECTURER]


class IsStudent(IsRole):
    """
    Allows access only to Students.
    """
    allowed_roles = [RoleChoices.STUDENT]
