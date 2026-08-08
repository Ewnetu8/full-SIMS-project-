from django.utils import timezone

from academics.models import CourseOffering
from questions.models import Question, QuestionOption
from questions.serializers import QuestionSerializer
from rest_framework import serializers

from exams.models import (
    ExamAttempt,
    Examination,
    ExamStatusChoices,
    StudentAnswer,
)


class ExamScheduleSerializer(serializers.Serializer):
    start_window = serializers.DateTimeField()
    end_window = serializers.DateTimeField()
    duration_minutes = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        start_window = attrs["start_window"]
        end_window = attrs["end_window"]
        if start_window <= timezone.now():
            raise serializers.ValidationError(
                {"start_window": "The exam start time must be in the future."}
            )
        if end_window <= start_window:
            raise serializers.ValidationError(
                {"end_window": "The exam end time must be after the start time."}
            )
        return attrs


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


class ExamAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamAttempt
        fields = (
            "id",
            "examination",
            "student",
            "start_time",
            "submission_time",
            "is_disrupted",
            "grading_status",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class StudentQuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ("id", "option_text")


class StudentQuestionSerializer(serializers.ModelSerializer):
    options = StudentQuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ("id", "question_text", "question_type", "total_points", "options")


class StudentAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source="question.question_text", read_only=True)

    class Meta:
        model = StudentAnswer
        fields = (
            "id",
            "exam_attempt",
            "question",
            "question_text",
            "selected_option",
            "submitted_text",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "exam_attempt",
            "question",
            "question_text",
            "created_at",
            "updated_at",
        )
