from decimal import Decimal

from rest_framework import serializers

from academics.models import (
    CourseOffering,
    Enrollment,
    EnrollmentStatusChoices,
    TeachingAssignment,
)
from exams.serializers import CourseOfferingBriefSerializer

from results.models import Assessment, AssessmentTypeChoices, Mark, Result


class QuestionAnalyticsSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    question_text = serializers.CharField()
    question_type = serializers.CharField()
    total_points = serializers.DecimalField(max_digits=5, decimal_places=2)
    correct_count = serializers.IntegerField()
    attempts = serializers.IntegerField()
    correct_rate = serializers.FloatField(allow_null=True)
    average_points = serializers.FloatField(allow_null=True)
    unanswered_count = serializers.IntegerField()


class ScoreBandSerializer(serializers.Serializer):
    label = serializers.CharField()
    count = serializers.IntegerField()


class ScoreSummarySerializer(serializers.Serializer):
    mean = serializers.FloatField(allow_null=True)
    median = serializers.FloatField(allow_null=True)
    mode = serializers.FloatField(allow_null=True)
    stddev = serializers.FloatField(allow_null=True)
    min = serializers.FloatField(allow_null=True)
    max = serializers.FloatField(allow_null=True)


class ExamAnalyticsSerializer(serializers.Serializer):
    exam_id = serializers.UUIDField()
    title = serializers.CharField()
    status = serializers.CharField()
    attempt_count = serializers.IntegerField()
    graded_count = serializers.IntegerField()
    score = ScoreSummarySerializer()
    pass_rate = serializers.FloatField(allow_null=True)
    pass_threshold = serializers.FloatField()
    score_distribution = ScoreBandSerializer(many=True)
    per_question = QuestionAnalyticsSerializer(many=True)


class ResultSerializer(serializers.ModelSerializer):
    exam_attempt = serializers.UUIDField(source="exam_attempt.id", read_only=True)
    exam_id = serializers.UUIDField(
        source="exam_attempt.examination.id", read_only=True
    )
    exam_title = serializers.CharField(
        source="exam_attempt.examination.title", read_only=True
    )
    exam_status = serializers.CharField(
        source="exam_attempt.examination.status", read_only=True
    )
    course_code = serializers.CharField(
        source="exam_attempt.examination.course_offering.course.course_code",
        read_only=True,
    )
    course_title = serializers.CharField(
        source="exam_attempt.examination.course_offering.course.title",
        read_only=True,
    )
    grading_status = serializers.CharField(
        source="exam_attempt.grading_status", read_only=True
    )
    submission_time = serializers.DateTimeField(
        source="exam_attempt.submission_time", read_only=True
    )

    class Meta:
        model = Result
        fields = (
            "id",
            "exam_attempt",
            "exam_id",
            "exam_title",
            "exam_status",
            "course_code",
            "course_title",
            "final_score",
            "grade_letter",
            "certified_by",
            "grading_status",
            "submission_time",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class ExamResultRowSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    student_identifier = serializers.CharField()
    student_name = serializers.CharField(allow_null=True)
    attempt_id = serializers.UUIDField()
    final_score = serializers.DecimalField(
        max_digits=5, decimal_places=2, allow_null=True
    )
    grade_letter = serializers.CharField(allow_null=True)
    grading_status = serializers.CharField()
    submission_time = serializers.DateTimeField(allow_null=True)
    is_disrupted = serializers.BooleanField()


class ExamResultsSerializer(serializers.Serializer):
    exam_id = serializers.UUIDField()
    title = serializers.CharField()
    status = serializers.CharField()
    attempt_count = serializers.IntegerField()
    graded_count = serializers.IntegerField()
    students = ExamResultRowSerializer(many=True)


class AdvisingStudentSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    student_identifier = serializers.CharField()
    class_standing = serializers.CharField()
    enrolled_credit_hours = serializers.IntegerField()
    min_credit_hours = serializers.IntegerField()


class AdvisingReportSerializer(serializers.Serializer):
    semester_id = serializers.UUIDField()
    semester_label = serializers.CharField()
    students = AdvisingStudentSerializer(many=True)


class TeachingAssignmentSerializer(serializers.ModelSerializer):
    lecturer_detail = serializers.CharField(
        source="lecturer.faculty_identifier", read_only=True
    )
    course_offering_detail = CourseOfferingBriefSerializer(
        source="course_offering", read_only=True
    )
    enrolled_students = serializers.SerializerMethodField()

    class Meta:
        model = TeachingAssignment
        fields = (
            "id",
            "lecturer",
            "lecturer_detail",
            "course_offering",
            "course_offering_detail",
            "is_active",
            "enrolled_students",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_enrolled_students(self, obj) -> int:
        return Enrollment.objects.filter(
            course_offering=obj.course_offering,
            status=EnrollmentStatusChoices.ENROLLED,
        ).count()

    def validate(self, attrs):
        lecturer = attrs.get("lecturer")
        course_offering = attrs.get("course_offering")
        if (
            lecturer is not None
            and course_offering is not None
            and TeachingAssignment.objects.filter(
                lecturer=lecturer, course_offering=course_offering
            ).exclude(pk=self.instance.pk if self.instance else None).exists()
        ):
            raise serializers.ValidationError(
                "This lecturer is already assigned to this course offering."
            )
        return attrs


class AssessmentSerializer(serializers.ModelSerializer):
    assessment_type_display = serializers.CharField(
        source="get_assessment_type_display", read_only=True
    )
    marks_count = serializers.SerializerMethodField()
    total_weight_in_offering = serializers.SerializerMethodField()

    class Meta:
        model = Assessment
        fields = (
            "id",
            "course_offering",
            "created_by",
            "title",
            "assessment_type",
            "assessment_type_display",
            "max_marks",
            "weight",
            "description",
            "due_date",
            "is_published",
            "marks_count",
            "total_weight_in_offering",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_by", "marks_count", "total_weight_in_offering", "created_at", "updated_at")

    def get_marks_count(self, obj) -> int:
        return obj.marks.count() if obj.pk else 0

    def get_total_weight_in_offering(self, obj) -> str:
        if not obj.course_offering_id:
            return None
        from django.db.models import Sum

        qs = Assessment.objects.filter(course_offering=obj.course_offering)
        if obj.pk:
            qs = qs.exclude(pk=obj.pk)
        total = qs.aggregate(t=Sum("weight"))["t"] or Decimal("0")
        return str((total + (obj.weight or Decimal("0"))))

    def validate_max_marks(self, value):
        if value <= 0:
            raise serializers.ValidationError("max_marks must be greater than zero.")
        return value

    def validate_assessment_type(self, value):
        valid = {c.value for c in AssessmentTypeChoices}
        if value not in valid:
            raise serializers.ValidationError(
                f"assessment_type must be one of: {', '.join(sorted(valid))}."
            )
        return value

    def validate(self, attrs):
        weight = attrs.get("weight")
        if weight is not None and not (Decimal("0.01") <= weight <= Decimal("100")):
            raise serializers.ValidationError(
                {"weight": "weight must be between 0.01 and 100 percent."}
            )
        # Keep the sum of weights per offering at or below 100%.
        offering = attrs.get("course_offering") or (
            self.instance.course_offering if self.instance else None
        )
        if offering is not None:
            from django.db.models import Sum
            existing = Assessment.objects.filter(course_offering=offering)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            others_total = existing.aggregate(t=Sum("weight"))["t"] or Decimal("0")
            new_weight = weight if weight is not None else self.instance.weight
            if others_total + new_weight > Decimal("100"):
                raise serializers.ValidationError(
                    {
                        "weight": (
                            f"Total assessment weight would exceed 100%. "
                            f"Existing assessments already use {others_total}%."
                        )
                    }
                )
        return attrs


class StudentBriefSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    full_name = serializers.SerializerMethodField()
    student_identifier = serializers.CharField(read_only=True)

    def get_full_name(self, obj) -> str:
        if isinstance(obj, dict):
            return obj.get("full_name", "")
        return f"{obj.user.first_name} {obj.user.last_name}".strip()


class MarkSerializer(serializers.ModelSerializer):
    student_detail = StudentBriefSerializer(source="enrollment.student", read_only=True)
    enrollment = serializers.PrimaryKeyRelatedField(queryset=Enrollment.objects.all())
    remarks = serializers.CharField(required=False, allow_blank=True, max_length=255)

    class Meta:
        model = Mark
        fields = (
            "id",
            "assessment",
            "enrollment",
            "student_detail",
            "score",
            "remarks",
            "entered_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "entered_by", "created_at", "updated_at")


class MarkEntrySerializer(serializers.Serializer):
    """One row of a bulk mark submission."""
    enrollment = serializers.UUIDField()
    score = serializers.DecimalField(max_digits=6, decimal_places=2)
    remarks = serializers.CharField(required=False, allow_blank=True, max_length=255)


class BulkMarkSubmissionSerializer(serializers.Serializer):
    marks = MarkEntrySerializer(many=True)

    def validate_marks(self, value):
        if not value:
            raise serializers.ValidationError("At least one mark entry is required.")
        return value


class GradebookAssessmentColumnSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    title = serializers.CharField(read_only=True)
    assessment_type = serializers.CharField(read_only=True)
    max_marks = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)
    weight = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    is_published = serializers.BooleanField(read_only=True)


class GradebookRowSerializer(serializers.Serializer):
    enrollment_id = serializers.UUIDField(read_only=True)
    student = StudentBriefSerializer(read_only=True)
    marks = serializers.DictField(
        child=serializers.DecimalField(max_digits=6, decimal_places=2),
        required=False,
    )
    total_percent = serializers.DecimalField(
        max_digits=5, decimal_places=2, allow_null=True, read_only=True
    )
    letter_grade = serializers.CharField(allow_null=True, read_only=True)
