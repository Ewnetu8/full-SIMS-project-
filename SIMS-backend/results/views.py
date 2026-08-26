import statistics
from collections import defaultdict

from accounts.models import RoleChoices
from academics.models import (
    CreditHourPolicy,
    CourseOffering,
    Enrollment,
    EnrollmentStatusChoices,
    Semester,
    TeachingAssignment,
)
from accounts.permissions import HasRole
from audit.utils import log_action
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import ProtectedError, Sum
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from notifications.views import notify_course_students
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from results.models import Assessment, Mark
from results.serializers import (
    AdvisingReportSerializer,
    AssessmentSerializer,
    BulkMarkSubmissionSerializer,
    CourseOfferingBriefSerializer,
    ExamAnalyticsSerializer,
    ExamResultsSerializer,
    GradebookAssessmentColumnSerializer,
    GradebookRowSerializer,
    MarkSerializer,
    ResultSerializer,
    StudentBriefSerializer,
    TeachingAssignmentSerializer,
)
from results.services import (
    get_offering_totals,
    get_student_total,
    publish_course_results,
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
            "rate (pass = score ΓëÑ 60% of exam total), and per-question "
            "difficulty (correct-rate, average points, unanswered count) "
            "(FR-015).\n\n"
            "Empty-data state (┬º9.9): when no attempt has a `Result` yet, "
            "the score summary is `null`, `pass_rate` is `null`, and every "
            "question reports `correct_rate = null` with 200 ΓÇö never an "
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
            "`CreditHourPolicy.min_credit_hours` (advisory ΓÇö no enrollment "
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


def get_offering(pk):
    try:
        return CourseOffering.objects.select_related(
            "course", "semester__academic_year"
        ).get(pk=pk)
    except (CourseOffering.DoesNotExist, ValueError):
        return None


def get_assessment(pk):
    try:
        return Assessment.objects.select_related(
            "course_offering__course", "created_by"
        ).get(pk=pk)
    except (Assessment.DoesNotExist, ValueError):
        return None


def ensure_can_manage_offering(offering, request):
    """Return an error Response, or None if the user may manage this offering."""
    user = request.user
    if user.is_superuser or user.role == RoleChoices.ADMIN:
        return None
    lecturer = getattr(user, "lecturer_profile", None)
    if lecturer is None:
        return Response(
            {"detail": "Authenticated user has no lecturer profile."},
            status=status.HTTP_403_FORBIDDEN,
        )
    if not TeachingAssignment.objects.filter(
        lecturer=lecturer, course_offering=offering, is_active=True
    ).exists():
        return Response(
            {"detail": "You are not assigned to this course offering."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


class TeachingAssignmentListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), HasRole("ADMIN", "SYSTEM_ADMIN")()]
        return [IsAuthenticated(), HasRole("ADMIN", "SYSTEM_ADMIN", "LECTURER")()]

    @extend_schema(
        tags=["Teaching Assignments"],
        summary="List teaching assignments",
        description=(
            "**Role: ADMIN / LECTURER**\n\n"
            "Admins see every assignment. Lecturers see only their own."
        ),
        responses={200: TeachingAssignmentSerializer(many=True)},
    )
    def get(self, request):
        queryset = TeachingAssignment.objects.select_related(
            "lecturer", "course_offering__course", "course_offering__semester__academic_year"
        ).order_by("-created_at")
        user_role = getattr(request.user, "role", None)
        if user_role == RoleChoices.LECTURER and hasattr(request.user, "lecturer_profile"):
            queryset = queryset.filter(lecturer=request.user.lecturer_profile)
        is_active = request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")
        return Response(TeachingAssignmentSerializer(queryset, many=True).data)

    @extend_schema(
        tags=["Teaching Assignments"],
        summary="Assign a lecturer to a course offering",
        description=(
            "**Role: ADMIN**\n\n"
            "Assigns a lecturer to teach a course offering. Only lecturers "
            "with an active assignment may enter assessments/marks for it."
        ),
        request=TeachingAssignmentSerializer,
        responses={
            201: TeachingAssignmentSerializer,
            400: OpenApiResponse(description="Validation error."),
        },
    )
    def post(self, request):
        serializer = TeachingAssignmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            log_action(
                actor=request.user,
                action_type="TEACHING_ASSIGNMENT_CREATED",
                request=request,
                payload={"teaching_assignment": str(serializer.instance.pk)},
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TeachingAssignmentDetailView(APIView):
    permission_classes = [IsAuthenticated, HasRole("ADMIN", "SYSTEM_ADMIN")]

    def get_object(self, pk):
        try:
            return TeachingAssignment.objects.get(pk=pk)
        except (TeachingAssignment.DoesNotExist, ValueError):
            return None

    @extend_schema(
        tags=["Teaching Assignments"],
        summary="Update a teaching assignment",
        description="**Role: ADMIN**\n\nToggle `is_active`, e.g. `{\"is_active\": false}`.",
        request=TeachingAssignmentSerializer,
        responses={200: TeachingAssignmentSerializer},
    )
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if obj is None:
            return Response(
                {"detail": "Teaching assignment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = TeachingAssignmentSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=["Teaching Assignments"],
        summary="Delete a teaching assignment",
        description="**Role: ADMIN**\n\nRevokes the lecturer's access to the offering.",
        responses={204: OpenApiResponse(description="Deleted.")},
    )
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if obj is None:
            return Response(
                {"detail": "Teaching assignment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyCoursesView(APIView):
    permission_classes = [IsAuthenticated, HasRole("LECTURER")]

    @extend_schema(
        tags=["Teaching Assignments"],
        summary="List the courses I teach",
        description=(
            "**Role: LECTURER**\n\nReturns the course offerings the "
            "authenticated lecturer is actively assigned to teach."
        ),
        responses={200: CourseOfferingBriefSerializer(many=True)},
    )
    def get(self, request):
        lecturer = getattr(request.user, "lecturer_profile", None)
        if lecturer is None:
            return Response(
                {"detail": "Authenticated user has no lecturer profile."},
                status=status.HTTP_403_FORBIDDEN,
            )
        offerings = CourseOffering.objects.filter(
            teaching_assignments__lecturer=lecturer,
            teaching_assignments__is_active=True,
        ).select_related("course", "semester__academic_year").distinct().order_by("course__course_code")
        return Response(CourseOfferingBriefSerializer(offerings, many=True).data)


class AssessmentListCreateView(APIView):
    permission_classes = [IsAuthenticated, HasRole("ADMIN", "LECTURER", "STUDENT")]

    @extend_schema(
        tags=["Assessments"],
        summary="List assessments for a course offering",
        description=(
            "**Role: LECTURER / ADMIN / STUDENT**\n\n"
            "Assigned lecturers and admins see everything. Enrolled students "
            "only see published assessments.\n\nFilter by `?type=TEST|ASSIGNMENT|OTHER`."
        ),
        parameters=[
            OpenApiParameter(name="type", required=False, description="TEST, ASSIGNMENT or OTHER"),
        ],
        responses={200: AssessmentSerializer(many=True)},
    )
    def get(self, request, offering_pk):
        offering = get_offering(offering_pk)
        if offering is None:
            return Response(
                {"detail": "Course offering not found."}, status=status.HTTP_404_NOT_FOUND
            )
        user_role = getattr(request.user, "role", None)
        if user_role in (RoleChoices.ADMIN, RoleChoices.LECTURER):
            error = ensure_can_manage_offering(offering, request)
            if error:
                return error
            queryset = Assessment.objects.filter(course_offering=offering)
        else:
            student = getattr(request.user, "student_profile", None)
            enrolled = student is not None and Enrollment.objects.filter(
                student=student,
                course_offering=offering,
                status=EnrollmentStatusChoices.ENROLLED,
            ).exists()
            if not enrolled:
                return Response(
                    {"detail": "You are not enrolled in this course offering."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            queryset = Assessment.objects.filter(course_offering=offering, is_published=True)

        type_filter = request.query_params.get("type")
        if type_filter:
            queryset = queryset.filter(assessment_type=type_filter.upper())
        queryset = queryset.select_related("course_offering__course").order_by("created_at")
        return Response(AssessmentSerializer(queryset, many=True).data)

    @extend_schema(
        tags=["Assessments"],
        summary="Create an assessment (test / assignment / other)",
        description=(
            "**Role: LECTURER (assigned) / ADMIN**\n\n"
            "Creates a gradable assessment attached to a course offering.\n\n"
            "Rules:\n"
            "- `weight` must be between 0.01 and 100 percent\n"
            "- The sum of all assessment weights in the offering cannot exceed 100%\n"
            "- `title` must be unique within the offering\n"
            "- The creator is recorded server-side from the authenticated lecturer"
        ),
        request=AssessmentSerializer,
        responses={
            201: AssessmentSerializer,
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="Not assigned to this offering."),
        },
    )
    def post(self, request, offering_pk):
        offering = get_offering(offering_pk)
        if offering is None:
            return Response(
                {"detail": "Course offering not found."}, status=status.HTTP_404_NOT_FOUND
            )
        error = ensure_can_manage_offering(offering, request)
        if error:
            return error

        data = dict(request.data)
        data["course_offering"] = str(offering.pk)
        serializer = AssessmentSerializer(data=data)
        if serializer.is_valid():
            lecturer = getattr(request.user, "lecturer_profile", None)
            serializer.save(created_by=lecturer)
            log_action(
                actor=request.user,
                action_type="ASSESSMENT_CREATED",
                request=request,
                payload={"assessment": str(serializer.instance.pk), "type": serializer.validated_data.get("assessment_type")},
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AssessmentDetailView(APIView):
    permission_classes = [IsAuthenticated, HasRole("ADMIN", "LECTURER", "STUDENT")]

    @extend_schema(
        tags=["Assessments"],
        summary="Retrieve an assessment",
        description=(
            "Lecturers/admins can always read. Students can read published "
            "assessments of offerings they are enrolled in."
        ),
        responses={200: AssessmentSerializer},
    )
    def get(self, request, pk):
        assessment = get_assessment(pk)
        if assessment is None:
            return Response(
                {"detail": "Assessment not found."}, status=status.HTTP_404_NOT_FOUND
            )
        user_role = getattr(request.user, "role", None)
        if user_role in (RoleChoices.ADMIN, RoleChoices.LECTURER):
            error = ensure_can_manage_offering(assessment.course_offering, request)
            if error:
                return error
        else:
            student = getattr(request.user, "student_profile", None)
            enrolled = (
                student is not None
                and assessment.is_published
                and Enrollment.objects.filter(
                    student=student,
                    course_offering=assessment.course_offering,
                    status=EnrollmentStatusChoices.ENROLLED,
                ).exists()
            )
            if not enrolled:
                return Response(
                    {"detail": "You are not enrolled in this course offering."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return Response(AssessmentSerializer(assessment).data)

    @extend_schema(
        tags=["Assessments"],
        summary="Update an assessment",
        description=(
            "**Role: LECTURER (assigned) / ADMIN**\n\n"
            "Partial update of title/type/max_marks/weight/description/due_date/"
            "`is_published`. Setting `is_published=true` notifies every enrolled "
            "student that their marks are visible. Weight rules still apply."
        ),
        request=AssessmentSerializer,
        responses={200: AssessmentSerializer},
    )
    def patch(self, request, pk):
        assessment = get_assessment(pk)
        if assessment is None:
            return Response(
                {"detail": "Assessment not found."}, status=status.HTTP_404_NOT_FOUND
            )
        error = ensure_can_manage_offering(assessment.course_offering, request)
        if error:
            return error

        was_published = assessment.is_published
        serializer = AssessmentSerializer(assessment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            if not was_published and assessment.is_published:
                notify_course_students(
                    assessment.course_offering,
                    (
                        f"Marks for '{assessment.title}' "
                        f"({assessment.course_offering.course.course_code}) have been published."
                    ),
                )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=["Assessments"],
        summary="Delete an assessment",
        description=(
            "**Role: LECTURER (assigned) / ADMIN**\n\n"
            "Deletion is blocked with 409 once any marks have been entered "
            "against the assessment."
        ),
        responses={
            204: OpenApiResponse(description="Deleted."),
            409: OpenApiResponse(description="Marks already entered."),
        },
    )
    def delete(self, request, pk):
        assessment = get_assessment(pk)
        if assessment is None:
            return Response(
                {"detail": "Assessment not found."}, status=status.HTTP_404_NOT_FOUND
            )
        error = ensure_can_manage_offering(assessment.course_offering, request)
        if error:
            return error

        if assessment.marks.exists():
            return Response(
                {
                    "detail": (
                        "This assessment already has marks entered and cannot be deleted."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )
        try:
            assessment.delete()
        except ProtectedError:
            return Response(
                {"detail": "This assessment cannot be deleted."},
                status=status.HTTP_409_CONFLICT,
            )
        log_action(
            actor=request.user,
            action_type="ASSESSMENT_DELETED",
            request=request,
            payload={"assessment": str(pk), "course_offering": str(assessment.course_offering_id)},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


def build_marksheet(assessment):
    """Rows for every non-dropped enrollment plus any existing mark."""
    enrollments = (
        Enrollment.objects.filter(course_offering=assessment.course_offering)
        .exclude(status=EnrollmentStatusChoices.DROPPED)
        .select_related("student__user")
        .order_by("student__student_identifier")
    )
    marks_by_enrollment = {
        m.enrollment_id: m
        for m in Mark.objects.filter(assessment=assessment).select_related("enrollment__student__user")
    }
    rows = []
    for enrollment in enrollments:
        mark = marks_by_enrollment.get(enrollment.id)
        rows.append(
            {
                "enrollment_id": enrollment.id,
                "student": {
                    "id": enrollment.student.id,
                    "full_name": (
                        f"{enrollment.student.user.first_name} {enrollment.student.user.last_name}".strip()
                    ),
                    "student_identifier": enrollment.student.student_identifier,
                },
                "mark_id": mark.id if mark else None,
                "score": mark.score if mark else None,
                "remarks": mark.remarks if mark else "",
            }
        )
    return rows


class AssessmentMarksView(APIView):
    """Mark sheet: view who is enrolled, then bulk-submit marks."""

    permission_classes = [IsAuthenticated, HasRole("ADMIN", "LECTURER")]

    @extend_schema(
        tags=["Marks"],
        summary="View the mark sheet of an assessment",
        description=(
            "**Role: LECTURER (assigned) / ADMIN**\n\n"
            "Returns one row per enrolled student with their current mark "
            "(score is null when not yet graded)."
        ),
        responses={200: OpenApiResponse(description="List of mark sheet rows.")},
    )
    def get(self, request, pk):
        assessment = get_assessment(pk)
        if assessment is None:
            return Response(
                {"detail": "Assessment not found."}, status=status.HTTP_404_NOT_FOUND
            )
        error = ensure_can_manage_offering(assessment.course_offering, request)
        if error:
            return error
        return Response(build_marksheet(assessment))

    @extend_schema(
        tags=["Marks"],
        summary="Submit marks for an assessment (bulk upsert)",
        description=(
            "**Role: LECTURER (assigned) / ADMIN**\n\n"
            "Submits marks for one or many enrolled students at once:\n\n"
            "`{\"marks\": [{\"enrollment\": \"<uuid>\", \"score\": 27.5, \"remarks\": \"good\"}]}`\n\n"
            "Rules:\n"
            "- Every student must have a non-DROPPED enrollment in this offering\n"
            "- `score` cannot exceed the assessment `max_marks`\n"
            "- Re-submitting the same student updates their mark (idempotent)\n"
            "- All-or-nothing: one invalid row rejects the whole batch"
        ),
        request=BulkMarkSubmissionSerializer,
        responses={
            200: OpenApiResponse(description="Updated mark sheet."),
            400: OpenApiResponse(description="Validation error (no marks written)."),
            403: OpenApiResponse(description="Not assigned to this offering."),
        },
    )
    def post(self, request, pk):
        assessment = get_assessment(pk)
        if assessment is None:
            return Response(
                {"detail": "Assessment not found."}, status=status.HTTP_404_NOT_FOUND
            )
        error = ensure_can_manage_offering(assessment.course_offering, request)
        if error:
            return error

        serializer = BulkMarkSubmissionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        entries = serializer.validated_data["marks"]

        max_marks = assessment.max_marks
        errors = []
        resolved = []
        seen_enrollments = set()
        for index, entry in enumerate(entries):
            enrollment = (
                Enrollment.objects.select_related("student__user")
                .filter(
                    pk=entry["enrollment"],
                    course_offering=assessment.course_offering,
                )
                .first()
            )
            if enrollment is None:
                errors.append(
                    {
                        "index": index,
                        "detail": "No matching enrollment in this course offering.",
                    }
                )
                continue
            if enrollment.status == EnrollmentStatusChoices.DROPPED:
                errors.append({"index": index, "detail": "Student has dropped this course."})
                continue
            if entry["enrollment"] in seen_enrollments:
                errors.append({"index": index, "detail": "Duplicate enrollment in payload."})
                continue
            seen_enrollments.add(entry["enrollment"])
            if entry["score"] < 0:
                errors.append({"index": index, "detail": "Score cannot be negative."})
                continue
            if entry["score"] > max_marks:
                errors.append(
                    {
                        "index": index,
                        "detail": f"Score exceeds max_marks ({max_marks}).",
                    }
                )
                continue
            resolved.append((entry, enrollment))

        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        lecturer = getattr(request.user, "lecturer_profile", None)
        with transaction.atomic():
            for entry, enrollment in resolved:
                Mark.objects.update_or_create(
                    assessment=assessment,
                    enrollment=enrollment,
                    defaults={
                        "score": entry["score"],
                        "remarks": entry.get("remarks", ""),
                        "entered_by": lecturer,
                    },
                )

        log_action(
            actor=request.user,
            action_type="MARKS_SUBMITTED",
            request=request,
            payload={
                "assessment": str(assessment.pk),
                "count": len(resolved),
                "scores": {str(e.pk): str(entry["score"]) for entry, e in resolved},
            },
        )
        return Response(build_marksheet(assessment))


class MarkDetailView(APIView):
    permission_classes = [IsAuthenticated, HasRole("ADMIN", "LECTURER")]

    def get_object(self, pk):
        try:
            return Mark.objects.select_related(
                "assessment__course_offering__course", "enrollment__student__user"
            ).get(pk=pk)
        except (Mark.DoesNotExist, ValueError):
            return None

    @extend_schema(
        tags=["Marks"],
        summary="Edit a single mark",
        description=(
            "**Role: LECTURER (assigned) / ADMIN**\n\n"
            "Change the score or remarks of an existing mark."
        ),
        request=MarkSerializer,
        responses={
            200: MarkSerializer,
            400: OpenApiResponse(description="Validation error."),
        },
    )
    def patch(self, request, pk):
        mark = self.get_object(pk)
        if mark is None:
            return Response({"detail": "Mark not found."}, status=status.HTTP_404_NOT_FOUND)
        error = ensure_can_manage_offering(mark.assessment.course_offering, request)
        if error:
            return error

        data = dict(request.data)
        data.pop("enrollment", None)
        data.pop("assessment", None)
        serializer = MarkSerializer(mark, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_score = serializer.validated_data.get("score", mark.score)
        if new_score < 0 or new_score > mark.assessment.max_marks:
            return Response(
                {"score": f"Score must be between 0 and {mark.assessment.max_marks}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer.save()
        log_action(
            actor=request.user,
            action_type="MARK_UPDATED",
            request=request,
            payload={"mark": str(mark.pk), "new_score": str(new_score)},
        )
        return Response(MarkSerializer(mark).data)


class GradebookView(APIView):
    permission_classes = [IsAuthenticated, HasRole("ADMIN", "LECTURER")]

    @extend_schema(
        tags=["Gradebook"],
        summary="Full gradebook of a course offering",
        description=(
            "**Role: LECTURER (assigned) / ADMIN**\n\n"
            "Returns the assessment columns, one row per enrolled student "
            "with all their marks and their running weighted total.\n\n"
            "The total is normalized over the weight of graded assessments, "
            "so it stays meaningful mid-semester."
        ),
        responses={200: OpenApiResponse(description="Gradebook matrix.")},
    )
    def get(self, request, offering_pk):
        offering = get_offering(offering_pk)
        if offering is None:
            return Response(
                {"detail": "Course offering not found."}, status=status.HTTP_404_NOT_FOUND
            )
        error = ensure_can_manage_offering(offering, request)
        if error:
            return error

        assessments = Assessment.objects.filter(course_offering=offering).order_by("created_at")
        totals = get_offering_totals(offering)

        enrollments = (
            Enrollment.objects.filter(course_offering=offering)
            .exclude(status=EnrollmentStatusChoices.DROPPED)
            .select_related("student__user")
            .order_by("student__student_identifier")
        )
        marks_by_enrollment = {}
        for m in Mark.objects.filter(assessment__course_offering=offering):
            marks_by_enrollment.setdefault(m.enrollment_id, {})[str(m.assessment_id)] = m.score

        rows = []
        for enrollment in enrollments:
            total = totals.get(enrollment.id, {})
            rows.append(
                {
                    "enrollment_id": enrollment.id,
                    "student": {
                        "id": enrollment.student.id,
                        "full_name": (
                            f"{enrollment.student.user.first_name} {enrollment.student.user.last_name}".strip()
                        ),
                        "student_identifier": enrollment.student.student_identifier,
                    },
                    "marks": marks_by_enrollment.get(enrollment.id, {}),
                    "total_percent": total.get("total_percent"),
                    "letter_grade": total.get("letter_grade"),
                }
            )

        return Response(
            {
                "course_offering": CourseOfferingBriefSerializer(offering).data,
                "assessments": GradebookAssessmentColumnSerializer(assessments, many=True).data,
                "rows": GradebookRowSerializer(rows, many=True).data,
            }
        )


class PublishCourseResultsView(APIView):
    permission_classes = [IsAuthenticated, HasRole("ADMIN", "LECTURER")]

    @extend_schema(
        tags=["Gradebook"],
        summary="Publish final results for a course offering",
        description=(
            "**Role: LECTURER (assigned) / ADMIN**\n\n"
            "Computes each student's weighted total over **published** "
            "assessments, converts it to a letter grade, and writes it onto "
            "the enrollment (`grade`) along with PASSED/FAILED status "
            "(pass threshold: 50%). Students are notified individually."
        ),
        request=None,
        responses={
            200: OpenApiResponse(description="Summary of written results."),
            400: OpenApiResponse(description="No published assessments."),
        },
    )
    def post(self, request, offering_pk):
        offering = get_offering(offering_pk)
        if offering is None:
            return Response(
                {"detail": "Course offering not found."}, status=status.HTTP_404_NOT_FOUND
            )
        error = ensure_can_manage_offering(offering, request)
        if error:
            return error

        if not Assessment.objects.filter(course_offering=offering, is_published=True).exists():
            return Response(
                {
                    "detail": (
                        "Publish at least one assessment before publishing course results."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated_count = publish_course_results(offering)

        from notifications.models import Notification

        enrollments = Enrollment.objects.filter(course_offering=offering).exclude(
            status=EnrollmentStatusChoices.DROPPED
        )
        notifications = [
            Notification(
                recipient=enrollment.student.user,
                message_body=(
                    f"Final result published for "
                    f"{offering.course.course_code}: {enrollment.grade}"
                ),
            )
            for enrollment in enrollments
            if enrollment.grade
        ]
        Notification.objects.bulk_create(notifications)

        log_action(
            actor=request.user,
            action_type="COURSE_RESULTS_PUBLISHED",
            request=request,
            payload={"course_offering": str(offering.pk), "students_updated": updated_count},
        )

        totals = get_offering_totals(offering)
        results_summary = []
        for enrollment in enrollments.select_related("student__user"):
            total = totals.get(enrollment.id, {})
            results_summary.append(
                {
                    "enrollment_id": enrollment.id,
                    "student": StudentBriefSerializer(enrollment.student).data,
                    "total_percent": total.get("total_percent"),
                    "letter_grade": enrollment.grade,
                    "status": enrollment.status,
                }
            )

        return Response(
            {
                "detail": f"Results published for {updated_count} student(s).",
                "results": results_summary,
            }
        )


class StudentMyMarksView(APIView):
    permission_classes = [IsAuthenticated, HasRole("STUDENT")]

    @extend_schema(
        tags=["Marks"],
        summary="My marks",
        description=(
            "**Role: STUDENT**\n\nReturns the authenticated student's marks "
            "(published assessments only) grouped by course offering, with "
            "the running weighted total and provisional letter grade. "
            "Optionally filter by `?course_offering=<uuid>`."
        ),
        parameters=[
            OpenApiParameter(
                name="course_offering",
                type=OpenApiTypes.UUID,
                required=False,
                description="Restrict results to one course offering.",
            ),
        ],
        responses={200: OpenApiResponse(description="Marks grouped by course offering.")},
    )
    def get(self, request):
        student = getattr(request.user, "student_profile", None)
        if student is None:
            return Response(
                {"detail": "Authenticated user has no student profile."},
                status=status.HTTP_403_FORBIDDEN,
            )

        enrollments = Enrollment.objects.filter(
            student=student,
            course_offering__isnull=False,
        ).exclude(status=EnrollmentStatusChoices.DROPPED).select_related(
            "course_offering__course", "course_offering__semester__academic_year"
        )

        offering_filter = request.query_params.get("course_offering")
        if offering_filter:
            enrollments = enrollments.filter(course_offering_id=offering_filter)

        payload = []
        for enrollment in enrollments.distinct():
            offering = enrollment.course_offering
            assessments = Assessment.objects.filter(
                course_offering=offering, is_published=True
            ).order_by("created_at")

            # Marks from ANY of the student's enrollments in this offering.
            marks_by_assessment = {
                m.assessment_id: m
                for m in Mark.objects.filter(
                    assessment__course_offering=offering,
                    enrollment__student=student,
                ).select_related("enrollment")
            }

            assessment_rows = []
            for assessment in assessments:
                mark = marks_by_assessment.get(assessment.id)
                assessment_rows.append(
                    {
                        "assessment_id": assessment.id,
                        "title": assessment.title,
                        "assessment_type": assessment.assessment_type,
                        "max_marks": assessment.max_marks,
                        "weight": assessment.weight,
                        "due_date": assessment.due_date,
                        "mark_id": mark.id if mark else None,
                        "score": mark.score if mark else None,
                        "remarks": mark.remarks if mark else "",
                    }
                )

            total = get_student_total(student, offering, published_only=True)
            payload.append(
                {
                    "enrollment_id": enrollment.id,
                    "course_offering": CourseOfferingBriefSerializer(offering).data,
                    "assessments": assessment_rows,
                    "total_percent": total["total_percent"] if total else None,
                    "letter_grade": total["letter_grade"] if total else None,
                }
            )
        return Response(payload)
