from academics.models import CourseOffering
from questions.serializers import QuestionSerializer
from rest_framework import serializers

from exams.models import Examination, ExamStatusChoices


class CourseOfferingBriefSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source="course.course_code", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)
    semester = serializers.CharField(
        source="semester.academic_year.display_label", read_only=True
    )
    semester_index = serializers.CharField(
        source="semester.semester_index", read_only=True
    )

    class Meta:
        model = CourseOffering
        fields = (
            "id",
            "course_code",
            "course_title",
            "semester",
            "semester_index",
            "section",
        )


class ExaminationSerializer(serializers.ModelSerializer):
    course_offering_detail = CourseOfferingBriefSerializer(
        source="course_offering", read_only=True
    )
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Examination
        fields = (
            "id",
            "course_offering",
            "course_offering_detail",
            "lecturer",
            "title",
            "status",
            "start_window",
            "end_window",
            "duration_minutes",
            "questions",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "lecturer",
            "course_offering_detail",
            "questions",
            "created_at",
            "updated_at",
        )

    def validate_status(self, value):
        if self.instance is None:
            if value != ExamStatusChoices.DRAFT:
                raise serializers.ValidationError(
                    "An examination must be created in DRAFT status; "
                    "it is created through the lifecycle "
                    "DRAFT → SCHEDULED → ACTIVE → CLOSED → PUBLISHED."
                )
            return value

        if not self.instance.can_transition_to(value):
            raise serializers.ValidationError(
                f"Illegal status transition from {self.instance.status} to {value}. "
                "The only allowed transitions are "
                "DRAFT → SCHEDULED → ACTIVE → CLOSED → PUBLISHED "
                "(no skipping, no rollback)."
            )
        return value
