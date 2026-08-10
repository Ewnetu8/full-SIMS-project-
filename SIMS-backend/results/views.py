import statistics
from collections import defaultdict

from academics.models import (
    CreditHourPolicy,
    Enrollment,
    EnrollmentStatusChoices,
    Semester,
)
from accounts.permissions import HasRole
from django.core.exceptions import ValidationError
from django.db.models import Sum
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from results.serializers import AdvisingReportSerializer, ExamAnalyticsSerializer


def get_examination(pk):
    from exams.models import Examination

    try:
        return Examination.objects.select_related(
            "course_offering__course", "lecturer"
        ).get(pk=pk)
    except Examination.DoesNotExist:
        return None


class ExamAnalyticsView(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), HasRole("LECTURER")()]

    @extend_schema(
        tags=["Analytics"],
        summary="Exam analytics dashboard",
        description=(
            "**Role: LECTURER / ADMIN**\n\n"
            "Returns mean, median and standard deviation of `final_score` "
            "across all graded results, plus per-question difficulty "
            "(correct-rate) (FR-015).\n\n"
            "Empty-data state (§9.9): when no attempt has a `Result` yet, "
            "the score summary is `null` and every question reports "
            "`correct_rate = null` with 200 — never an error."
        ),
        responses={
            200: ExamAnalyticsSerializer,
            404: OpenApiResponse(description="Examination not found."),
        },
    )
    def get(self, request, pk):
        from exams.models import ExamAttempt, StudentAnswer
        from exams.tasks import grade_question

        exam = get_examination(pk)
        if exam is None:
            return Response(
                {"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND
            )

        attempts = exam.attempts.all()
        attempt_count = attempts.count()
        graded = attempts.filter(result__isnull=False)
        graded_count = graded.count()

        scores = [float(a.result.final_score) for a in graded.select_related("result")]

        if scores:
            score_summary = {
                "mean": statistics.mean(scores),
                "median": statistics.median(scores),
                "stddev": statistics.pstdev(scores),
                "min": min(scores),
                "max": max(scores),
            }
        else:
            score_summary = {
                "mean": None,
                "median": None,
                "stddev": None,
                "min": None,
                "max": None,
            }

        graded_attempt_ids = list(graded.values_list("id", flat=True))
        question_ids = list(exam.questions.values_list("id", flat=True))

        correct_by_question = defaultdict(int)
        if graded_attempt_ids and question_ids:
            answers = StudentAnswer.objects.filter(
                exam_attempt_id__in=graded_attempt_ids,
                question_id__in=question_ids,
            ).select_related("question", "selected_option")
            for answer in answers:
                if grade_question(answer.question, answer) > 0:
                    correct_by_question[answer.question_id] += 1

        per_question = [
            {
                "question_id": question.pk,
                "question_text": question.question_text,
                "question_type": question.question_type,
                "total_points": float(question.total_points),
                "correct_count": correct_by_question.get(question.pk, 0),
                "attempts": graded_count,
                "correct_rate": (
                    correct_by_question.get(question.pk, 0) / graded_count
                    if graded_count
                    else None
                ),
            }
            for question in exam.questions.all()
        ]

        return Response(
            {
                "exam_id": exam.pk,
                "title": exam.title,
                "status": exam.status,
                "attempt_count": attempt_count,
                "graded_count": graded_count,
                "score": score_summary,
                "per_question": per_question,
            }
        )


class AdvisingReportView(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), HasRole("LECTURER")()]

    @extend_schema(
        tags=["Analytics"],
        summary="Advising report: students under the credit-hour minimum",
        description=(
            "**Role: LECTURER / ADMIN**\n\n"
            "Lists students whose total enrolled credit hours for the given "
            "semester are below their class standing's "
            "`CreditHourPolicy.min_credit_hours` (advisory — no enrollment "
            "block). Pass the semester via `?semester=<id>`."
        ),
        parameters=[
            OpenApiParameter(
                name="semester",
                type=OpenApiTypes.UUID,
                location="query",
                required=True,
                description="Semester UUID.",
            ),
        ],
        responses={
            200: AdvisingReportSerializer,
            400: OpenApiResponse(description="Missing semester parameter."),
            404: OpenApiResponse(description="Semester not found."),
        },
    )
    def get(self, request):
        semester_id = request.query_params.get("semester")
        if not semester_id:
            return Response(
                {"detail": "The 'semester' query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            semester = Semester.objects.get(pk=semester_id)
        except (Semester.DoesNotExist, ValidationError):
            return Response(
                {"detail": "Semester not found."}, status=status.HTTP_404_NOT_FOUND
            )

        policies = {
            policy.class_standing: policy for policy in CreditHourPolicy.objects.all()
        }

        rows = (
            Enrollment.objects.filter(
                course_offering__semester=semester,
                status=EnrollmentStatusChoices.ENROLLED,
            )
            .values(
                "student_id",
                "student__student_identifier",
                "student__class_standing",
            )
            .annotate(
                enrolled_credit_hours=Sum("course_offering__course__credit_hours")
            )
            .order_by("student__student_identifier")
        )

        students = []
        for row in rows:
            policy = policies.get(row["student__class_standing"])
            if policy is None:
                continue
            if row["enrolled_credit_hours"] < policy.min_credit_hours:
                students.append(
                    {
                        "student_id": row["student_id"],
                        "student_identifier": row["student__student_identifier"],
                        "class_standing": row["student__class_standing"],
                        "enrolled_credit_hours": row["enrolled_credit_hours"],
                        "min_credit_hours": policy.min_credit_hours,
                    }
                )

        return Response(
            {
                "semester_id": semester.pk,
                "semester_label": str(semester),
                "students": students,
            }
        )
