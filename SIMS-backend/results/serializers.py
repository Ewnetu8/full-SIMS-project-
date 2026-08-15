from rest_framework import serializers

from results.models import Result


class QuestionAnalyticsSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    question_text = serializers.CharField()
    question_type = serializers.CharField()
    total_points = serializers.DecimalField(max_digits=5, decimal_places=2)
    correct_count = serializers.IntegerField()
    attempts = serializers.IntegerField()
    correct_rate = serializers.FloatField(allow_null=True)


class ScoreSummarySerializer(serializers.Serializer):
    mean = serializers.FloatField(allow_null=True)
    median = serializers.FloatField(allow_null=True)
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
