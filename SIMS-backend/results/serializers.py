from rest_framework import serializers


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
