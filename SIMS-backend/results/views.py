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

from results.serializers import (
    AdvisingReportSerializer,
    ExamAnalyticsSerializer,
    ExamResultsSerializer,
    ResultSerializer,
)

# Percentage score bands used for the distribution, plus the pass mark.
# Aligned with `grade_letter_for` in exams/tasks.py (D = 60%+).
SCORE_BANDS = [
    ("0-39", 0.0, 39.999),
    ("40-49", 40.0, 49.999),
    ("50-59", 50.0, 59.999),
    ("60-69", 60.0, 69.999),
    ("70-79", 70.0, 79.999),
    ("80-89", 80.0, 89.999),
    ("90-100", 90.0, 100.0),
]
PASS_THRESHOLD = 60.0


def score_band_for(percentage):
    for label, low, high in SCORE_BANDS:
        if low <= percentage <= high:
            return label
    return SCORE_BANDS[0][0]


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
            "**Role: LECTURER / ADMIN (owner-scoped)**\n\n"
            "Returns summary statistics (mean, median, mode, stddev, min, "
            "max) of `final_score`, a percentage score distribution, pass "
            "rate (pass = score ≥ 60% of exam total), and per-question "
            "difficulty (correct-rate, average points, unanswered count) "
            "(FR-015).\n\n"
            "Empty-data state (§9.9): when no attempt has a `Result` yet, "
            "the score summary is `null`, `pass_rate` is `null`, and every "
            "question reports `correct_rate = null` with 200 — never an "
            "error."
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

        user_role = getattr(request.user, "role", None)
        is_admin = getattr(request.user, "is_superuser", False) or user_role == "ADMIN"
        if not is_admin:
            lecturer = getattr(request.user, "lecturer_profile", None)
            if lecturer is None or exam.lecturer_id != lecturer.pk:
                return Response(
                    {"detail": "Examination not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        attempts = exam.attempts.all()
        attempt_count = attempts.count()
        graded = attempts.filter(result__isnull=False)
        graded_count = graded.count()

        scores = [float(a.result.final_score) for a in graded.select_related("result")]

        exam_total = float(
            sum(question.total_points for question in exam.questions.all())
        )
        percentages = [
            (score / exam_total * 100.0) if exam_total else 0.0 for score in scores
        ]

        if scores:
            modes = statistics.multimode(scores)
            score_summary = {
                "mean": statistics.mean(scores),
                "median": statistics.median(scores),
                "mode": modes[0] if len(modes) != len(scores) else None,
                "stddev": statistics.pstdev(scores),
                "min": min(scores),
                "max": max(scores),
            }
        else:
            score_summary = {
                "mean": None,
                "median": None,
                "mode": None,
                "stddev": None,
                "min": None,
                "max": None,
            }

        distribution = {label: 0 for label, _, _ in SCORE_BANDS}
        for percentage in percentages:
            distribution[score_band_for(percentage)] += 1
        score_distribution = [
            {"label": label, "count": distribution[label]}
            for label, _, _ in SCORE_BANDS
        ]

        if graded_count:
            pass_count = sum(1 for pct in percentages if pct >= PASS_THRESHOLD)
            pass_rate = round(pass_count / graded_count * 100.0, 2)
        else:
            pass_rate = None

        graded_attempt_ids = list(graded.values_list("id", flat=True))
        question_ids = list(exam.questions.values_list("id", flat=True))

        correct_by_question = defaultdict(int)
        awarded_by_question = defaultdict(float)
        attempts_with_answer = defaultdict(set)
        if graded_attempt_ids and question_ids:
            answers = StudentAnswer.objects.filter(
                exam_attempt_id__in=graded_attempt_ids,
                question_id__in=question_ids,
            ).select_related("question", "selected_option")
            for answer in answers:
                awarded = grade_question(answer.question, answer)
                if awarded > 0:
                    correct_by_question[answer.question_id] += 1
                awarded_by_question[answer.question_id] += awarded
                attempts_with_answer[answer.question_id].add(answer.exam_attempt_id)

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
                "average_points": (
                    awarded_by_question.get(question.pk, 0.0) / graded_count
                    if graded_count
                    else None
                ),
                "unanswered_count": graded_count
                - len(attempts_with_answer.get(question.pk, set())),
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
                "pass_rate": pass_rate,
                "pass_threshold": PASS_THRESHOLD,
                "score_distribution": score_distribution,
                "per_question": per_question,
            }
        )


class StudentResultsView(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), HasRole("STUDENT")()]

    @extend_schema(
        tags=["Results"],
        summary="My results",
        description=(
            "**Role: STUDENT**\n\n"
            "Returns the logged-in student's own graded results. "
            "A `Result` row exists once an attempt has been graded; the "
            "student only ever sees their own rows (self-scoped through "
            "`ExamAttempt.student`)."
        ),
        responses={200: ResultSerializer(many=True)},
    )
    def get(self, request):
        from results.models import Result

        student = getattr(request.user, "student_profile", None)
        if student is None:
            return Response(
                {"detail": "Authenticated user has no student profile."},
                status=status.HTTP_403_FORBIDDEN,
            )
        results = (
            Result.objects.filter(exam_attempt__student=student)
            .select_related(
                "exam_attempt__examination__course_offering__course",
                "certified_by",
            )
            .order_by("-created_at")
        )
        return Response(ResultSerializer(results, many=True).data)


class ExamResultsView(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), HasRole("LECTURER")()]

    @extend_schema(
        tags=["Results"],
        summary="Per-student results for an examination",
        description=(
            "**Role: LECTURER / ADMIN**\n\n"
            "Lists every attempt of one examination with the student's "
            "identity, score, grade letter and grading state. Lecturers may "
            "only query their own examinations (404 otherwise)."
        ),
        responses={
            200: ExamResultsSerializer,
            404: OpenApiResponse(description="Examination not found."),
        },
    )
    def get(self, request, pk):
        exam = get_examination(pk)
        if exam is None:
            return Response(
                {"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND
            )

        user_role = getattr(request.user, "role", None)
        is_admin = getattr(request.user, "is_superuser", False) or user_role == "ADMIN"
        if not is_admin:
            lecturer = getattr(request.user, "lecturer_profile", None)
            if lecturer is None or exam.lecturer_id != lecturer.pk:
                return Response(
                    {"detail": "Examination not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        attempts = exam.attempts.select_related("student__user", "result").order_by(
            "student__student_identifier"
        )

        students = []
        for attempt in attempts:
            students.append(
                {
                    "student_id": attempt.student_id,
                    "student_identifier": attempt.student.student_identifier,
                    "student_name": (
                        f"{attempt.student.user.first_name} "
                        f"{attempt.student.user.last_name}".strip()
                        or None
                    ),
                    "attempt_id": attempt.pk,
                    "final_score": (
                        attempt.result.final_score if attempt.result else None
                    ),
                    "grade_letter": (
                        attempt.result.grade_letter if attempt.result else None
                    ),
                    "grading_status": attempt.grading_status,
                    "submission_time": attempt.submission_time,
                    "is_disrupted": attempt.is_disrupted,
                }
            )

        return Response(
            {
                "exam_id": exam.pk,
                "title": exam.title,
                "status": exam.status,
                "attempt_count": attempts.count(),
                "graded_count": sum(
                    1 for attempt in attempts if attempt.result is not None
                ),
                "students": students,
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
