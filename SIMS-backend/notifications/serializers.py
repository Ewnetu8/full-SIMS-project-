from rest_framework import serializers
from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'recipient', 'message_body', 'is_read', 'created_at', 'updated_at')
        read_only_fields = ('id', 'recipient', 'created_at', 'updated_at')


class NotificationMarkReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'is_read')
        read_only_fields = ('id',)

    def validate_is_read(self, value):
        if not value:
            raise serializers.ValidationError("is_read must be true to mark as read.")
        return value
