from rest_framework import serializers

from academics.models import University


class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = ("id", "name", "code", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")
