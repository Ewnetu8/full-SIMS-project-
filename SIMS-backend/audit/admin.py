from django.contrib import admin
from audit.models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action_type', 'actor', 'ip_address', 'logged_at')
    list_filter = ('action_type', 'logged_at')
    search_fields = ('action_type', 'actor__email', 'ip_address')
    readonly_fields = ('actor', 'action_type', 'ip_address', 'payload_snapshot', 'logged_at', 'created_at', 'updated_at')

    # Remove permission to add, modify or delete audit logs from admin dashboard
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
