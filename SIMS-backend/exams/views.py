from academics.models import Enrollment, EnrollmentStatusChoices
from accounts.permissions import HasRole
from django.db import transaction
from django.db.models.deletion import ProtectedError
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from questions.models import Question, QuestionOption, QuestionTypeChoices
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from exams.models import (
    ExamAttempt,
    Examination,
    ExamStatusChoices,
    StudentAnswer,
)
from exams.serializers import (
    ExamAttemptSerializer,
    ExaminationSerializer,
    ExamScheduleSerializer,
    StudentAnswerSerializer,
    StudentQuestionSerializer,
)
from exams.services import gradeability_errors


def get_examination(pk):
    try:
        return (
            Examination.objects.select_related("course_offering__course", "lecturer")
            .prefetch_related("questions")
            .get(pk=pk)
        )
    except Examination.DoesNotExist:
        return None


class ExaminationListView(APIView):
    def get_permissions(self):
        if self.request.method in ("POST",):
            return [IsAuthenticated(), HasRole("ADMIN", "LECTURER")()]
        return [IsAuthenticated(), HasRole("ADMIN", "LECTURER", "STUDENT")()]

    @extend_schema(
        tags=["Examination"],
        summary="List examinations",
        description=(
            "Lecturers see only their own examinations. "
            "Admins see all. Students see examinations for enrolled "
            "course offerings. Filterable by ?status= and ?course_offering=."
        ),
        responses={200: ExaminationSerializer(many=True)},
    )
    def get(self, request):
        queryset = (
            Examination.objects.all()
            .select_related("course_offering__course", "lecturer")
            .prefetch_related("questions")
            .order_by("-created_at")
        )
        user_role = getattr(request.user, "role", None)
        if user_role == "LECTURER" and hasattr(request.user, "lecturer_profile"):
            queryset = queryset.filter(lecturer=request.user.lecturer_profile)
        elif user_role == "STUDENT" and hasattr(request.user, "student_profile"):
            student = request.user.student_profile
            queryset = queryset.filter(
                course_offering__enrollments__student=student,
                course_offering__enrollments__status=EnrollmentStatusChoices.ENROLLED,
            ).distinct()
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        course_offering = request.query_params.get("course_offering")
        if course_offering:
            queryset = queryset.filter(course_offering_id=course_offering)
        return Response(ExaminationSerializer(queryset, many=True).data)

    @extend_schema(
        tags=["Examination"],
        summary="Create examination",
        description=(
            "**Role: LECTURER / ADMIN**\n\n"
            "Examinations are always created in DRAFT. "
            "Status follows the strict lifecycle:\n"
            "`DRAFT → SCHEDULED → ACTIVE → CLOSED → PUBLISHED`\n\n"
            "No skipping or rollback is allowed. The lecturer who creates "
            "the exam is automatically set as the owner."
        ),
        request=ExaminationSerializer,
        responses={201: ExaminationSerializer},
    )
    def post(self, request):
        serializer = ExaminationSerializer(data=request.data)
        if serializer.is_valid():
            lecturer = getattr(request.user, "lecturer_profile", None)
            if lecturer is None:
                return Response(
                    {"detail": "Authenticated user has no lecturer profile."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            serializer.save(lecturer=lecturer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExaminationDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsAuthenticated(), HasRole("ADMIN", "LECTURER")()]
        return [IsAuthenticated(), HasRole("ADMIN", "LECTURER", "STUDENT")()]

    def get_object(self, pk):
        return get_examination(pk)

    @extend_schema(
        tags=["Examination"],
        summary="Retrieve examination",
        responses={200: ExaminationSerializer},
    )
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(ExaminationSerializer(obj).data)

    @extend_schema(
        tags=["Examination"],
        summary="Update examination",
        description=(
            "**Role: LECTURER / ADMIN**\n\n"
            "Full replacement update. Status changes must follow the "
            "lifecycle: `DRAFT → SCHEDULED → ACTIVE → CLOSED → PUBLISHED`. "
            "Any other transition is rejected with a 400."
        ),
        request=ExaminationSerializer,
        responses={200: ExaminationSerializer},
    )
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ExaminationSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=["Examination"],
        summary="Partial update examination",
        description=(
            "**Role: LECTURER / ADMIN**\n\n"
            "Partial update. Status changes follow the strict lifecycle:\n"
            "`DRAFT → SCHEDULED → ACTIVE → CLOSED → PUBLISHED`\n\n"
            "No skipping or rollback is allowed. Question-list edits are "
            "locked once status leaves DRAFT/SCHEDULED (§9.2)."
        ),
        request=ExaminationSerializer,
        responses={200: ExaminationSerializer},
    )
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ExaminationSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=["Examination"],
        summary="Delete examination",
        description=(
            "**Role: LECTURER / ADMIN**\n\n"
            "Deletes a DRAFT examination. Returns 409 if attempts exist."
        ),
        responses={204: OpenApiResponse(description="Deleted.")},
    )
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND
            )
        try:
            obj.delete()
        except ProtectedError:
            return Response(
                {"detail": "Examination cannot be deleted once attempts exist."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ScheduleExaminationView(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), HasRole("ADMIN", "LECTURER")()]

    @extend_schema(
        tags=["Examination"],
        summary="Schedule an examination",
        description=(
            "**Role: LECTURER / ADMIN**\n\n"
            "Validates the time window against the server clock and moves "
            "the exam from DRAFT → SCHEDULED.\n\n"
            "Rules:\n"
            "- `start_window` must be in the **future** (server clock)\n"
            "- `end_window` must be after `start_window`\n"
            "- `duration_minutes` must be positive\n"
            "- Exam must currently be in DRAFT status\n"
            "- Every question must be deterministically auto-gradable "
            "(objective-grading mode): no ESSAY or SHORT_ANSWER questions "
            "(both require AI grading), MCQ with exactly one correct option"
        ),
        request=ExamScheduleSerializer,
        responses={
            200: ExaminationSerializer,
            400: OpenApiResponse(description="Validation error."),
        },
    )
    def post(self, request, pk):
        obj = get_examination(pk)
        if not obj:
            return Response(
                {"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND
            )
        if obj.status != ExamStatusChoices.DRAFT:
            return Response(
                {"detail": "Only DRAFT examinations can be scheduled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ExamScheduleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        gradeability = gradeability_errors(obj)
        if gradeability:
            return Response(
                {
                    "detail": (
                        "This examination cannot be scheduled because it is "
                        "not fully auto-gradable."
                    ),
                    "errors": gradeability,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        obj.start_window = serializer.validated_data["start_window"]
        obj.end_window = serializer.validated_data["end_window"]
        obj.duration_minutes = serializer.validated_data["duration_minutes"]
        obj.status = ExamStatusChoices.SCHEDULED
        obj.save()
        return Response(ExaminationSerializer(obj).data)


class PublishExaminationView(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), HasRole("LECTURER")()]

    @extend_schema(
        tags=["Examination"],
        summary="Publish examination results",
        description=(
            "**Role: LECTURER / ADMIN**\n\n"
            "Flips the examination from CLOSED to PUBLISHED and notifies all "
            "enrolled students once every attempt has been graded.\n\n"
            "Publish gate (400 otherwise):\n"
            "- `status` must be `CLOSED`\n"
            "- every attempt has `grading_status = GRADING_COMPLETE`\n"
            "- no attempt is missing a `Result` row (§9.8 blocks publish if "
            "anything is ungraded)"
        ),
        responses={
            200: ExaminationSerializer,
            400: OpenApiResponse(description="Examination cannot be published yet."),
            404: OpenApiResponse(description="Examination not found."),
        },
        request=None,
    )
    def post(self, request, pk):
        obj = get_examination(pk)
        if not obj:
            return Response(
                {"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND
            )

        problems = []
        if obj.status != ExamStatusChoices.CLOSED:
            problems.append(
                f"Only CLOSED examinations can be published "
                f"(current status: {obj.status})."
            )
        ungraded_count = obj.attempts.exclude(
            grading_status=ExamAttempt.GradingStatusChoices.GRADING_COMPLETE
        ).count()
        if ungraded_count:
            problems.append(
                f"{ungraded_count} attempt(s) are not fully graded "
                "(grading_status != GRADING_COMPLETE)."
            )
        missing_results_count = obj.attempts.filter(result__isnull=True).count()
        if missing_results_count:
            problems.append(
                f"{missing_results_count} attempt(s) have no Result row."
            )
        if problems:
            return Response(
                {
                    "detail": "This examination cannot be published yet.",
                    "errors": problems,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        from notifications.views import notify_course_students

        with transaction.atomic():
            obj.status = ExamStatusChoices.PUBLISHED
            obj.save(update_fields=["status", "updated_at"])
            notify_course_students(
                obj.course_offering,
                f"Results for the examination '{obj.title}' "
                f"({obj.course_offering.course.course_code}) have been published.",
            )
        return Response(ExaminationSerializer(obj).data)


class StudentActiveExamsView(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), HasRole("STUDENT")()]

    @extend_schema(
        tags=["Examination"],
        summary="List active examinations for the logged-in student",
        description=(
            "**Role: STUDENT**\n\n"
            "Returns only examinations the student can see, scoped through "
            "their actual Enrollment rows:\n"
            "`student → Enrollment → CourseOffering → Examination`\n\n"
            "An exam appears only when:\n"
            "- `status = ACTIVE`\n"
            "- `start_window <= now < end_window`\n"
            "- The student has an ENROLLED enrollment for the course offering\n\n"
            "No cron job is needed — visibility is enforced at query time."
        ),
        responses={200: ExaminationSerializer(many=True)},
    )
    def get(self, request):
        student = getattr(request.user, "student_profile", None)
        if student is None:
            return Response(
                {"detail": "Authenticated user has no student profile."},
                status=status.HTTP_403_FORBIDDEN,
            )
        now = timezone.now()
        queryset = (
            Examination.objects.filter(
                status=ExamStatusChoices.ACTIVE,
                start_window__lte=now,
                end_window__gt=now,
                course_offering__enrollments__student=student,
                course_offering__enrollments__status=EnrollmentStatusChoices.ENROLLED,
            )
            .select_related("course_offering__course", "lecturer")
            .prefetch_related("questions")
            .distinct()
            .order_by("start_window")
        )
        return Response(ExaminationSerializer(queryset, many=True).data)


class StartExamView(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), HasRole("STUDENT")()]

    @extend_schema(
        tags=["Attempt"],
        summary="Start an examination for the logged-in student",
        description=(
            "**Role: STUDENT**\n\n"
            "Creates an ExamAttempt if all conditions are met:\n"
            "- Student is enrolled in the course offering\n"
            "- Exam status is ACTIVE\n"
            "- Current server time is within [start_window, end_window)\n"
            "- Student has no existing attempt (unless `allow_retake` is set)\n\n"
            "Returns the attempt plus exam questions with correct answers hidden."
        ),
        responses={
            201: ExamAttemptSerializer,
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="Not enrolled or not a student."),
        },
    )
    def post(self, request, pk):
        exam = get_examination(pk)
        if not exam:
            return Response(
                {"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND
            )
        student = getattr(request.user, "student_profile", None)
        if student is None:
            return Response(
                {"detail": "Authenticated user has no student profile."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if exam.status != ExamStatusChoices.ACTIVE:
            return Response(
                {"detail": "This examination is not currently active."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        now = timezone.now()
        if not (exam.start_window <= now < exam.end_window):
            return Response(
                {"detail": "This examination window is not open right now."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        enrolled = Enrollment.objects.filter(
            student=student,
            course_offering=exam.course_offering,
            status=EnrollmentStatusChoices.ENROLLED,
        ).exists()
        if not enrolled:
            return Response(
                {"detail": "You are not enrolled in this examination's course."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if (
            not exam.allow_retake
            and ExamAttempt.objects.filter(examination=exam, student=student).exists()
        ):
            return Response(
                {"detail": "You have already attempted this examination."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attempt = ExamAttempt.objects.create(
            examination=exam, student=student, start_time=now
        )
        questions = exam.questions.all()
        return Response(
            {
                "attempt": ExamAttemptSerializer(attempt).data,
                "questions": StudentQuestionSerializer(questions, many=True).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AutoSaveAnswerView(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), HasRole("STUDENT")()]

    @extend_schema(
        tags=["Attempt"],
        summary="Auto-save a student answer (upsert)",
        description=(
            "**Role: STUDENT**\n\n"
            "Creates or updates the student's answer to one question of one "
            "attempt. The attempt must belong to the logged-in student and "
            "must not be submitted yet.\n\n"
            "MCQ questions are answered via `selected_option` (option ID);\n"
            "text/essay questions via `submitted_text`.\n\n"
            "**Idempotent**: sending the same payload twice does not "
            "duplicate rows (upsert on `(exam_attempt, question)`)."
        ),
        request=StudentAnswerSerializer,
        responses={
            200: StudentAnswerSerializer,
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="Not the student's attempt."),
        },
    )
    def put(self, request, attempt_pk, question_pk):
        try:
            attempt = ExamAttempt.objects.select_related("examination").get(
                pk=attempt_pk
            )
        except ExamAttempt.DoesNotExist:
            return Response(
                {"detail": "Attempt not found."}, status=status.HTTP_404_NOT_FOUND
            )
        student = getattr(request.user, "student_profile", None)
        if student is None or attempt.student_id != student.pk:
            return Response(
                {"detail": "This is not your attempt."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if attempt.submission_time is not None:
            return Response(
                {"detail": "This attempt has already been submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        deadline_by_window = attempt.examination.end_window
        deadline_by_duration = attempt.start_time + timezone.timedelta(
            minutes=attempt.examination.duration_minutes
        )
        if now >= min(deadline_by_window, deadline_by_duration):
            return Response(
                {
                    "detail": (
                        "Auto-save rejected: the exam window or duration "
                        "has expired. Answers can no longer be changed."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            question = Question.objects.get(
                pk=question_pk, examination=attempt.examination
            )
        except Question.DoesNotExist:
            return Response(
                {"detail": "Question is not part of this examination."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        selected_option = request.data.get("selected_option")
        submitted_text = request.data.get("submitted_text")

        if question.question_type == QuestionTypeChoices.MCQ:
            option = None
            if selected_option is not None:
                try:
                    option = QuestionOption.objects.get(
                        pk=selected_option, question=question
                    )
                except QuestionOption.DoesNotExist:
                    return Response(
                        {
                            "detail": "selected_option is not an option of this question."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            with transaction.atomic():
                answer, _ = StudentAnswer.objects.update_or_create(
                    exam_attempt=attempt,
                    question=question,
                    defaults={"selected_option": option, "submitted_text": None},
                )
        else:
            if selected_option is not None:
                return Response(
                    {"detail": "Text questions must be answered with submitted_text."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            with transaction.atomic():
                answer, _ = StudentAnswer.objects.update_or_create(
                    exam_attempt=attempt,
                    question=question,
                    defaults={"selected_option": None, "submitted_text": submitted_text},
                )
        return Response(StudentAnswerSerializer(answer).data)


class SubmitExamView(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), HasRole("STUDENT")()]

    @extend_schema(
        tags=["Attempt"],
        summary="Submit (freeze) an exam attempt",
        description=(
            "**Role: STUDENT**\n\n"
            "Freezes the student's attempt and hands off grading to Celery.\n\n"
            "Rules enforced:\n"
            "- The attempt must belong to the logged-in student\n"
            "- The attempt must not already be submitted\n"
            "- Submission **is rejected** if `now() >= end_window` **or** "
            "`now() > start_time + duration_minutes` (late submissions "
            "are never accepted — §9.5)\n\n"
            "On success:\n"
            "- `submission_time` is set to `now()`\n"
            "- `is_disrupted` is set if the client detected a timeout/disconnect\n"
            "- A Celery task `grade_exam_attempt` is enqueued (async, "
            "handoff to Phase 4 grading logic)"
        ),
        request=inline_serializer(
            name="SubmitExamRequest",
            fields={
                "is_disrupted": serializers.BooleanField(
                    required=False,
                    default=False,
                    help_text="Set to true if the client detected a browser crash or disconnect.",
                ),
            },
        ),
        responses={
            200: ExamAttemptSerializer,
            400: OpenApiResponse(description="Already submitted or window expired."),
            403: OpenApiResponse(description="Not your attempt."),
        },
    )
    def post(self, request, pk):
        exam = get_examination(pk)
        if not exam:
            return Response(
                {"detail": "Examination not found."}, status=status.HTTP_404_NOT_FOUND
            )

        student = getattr(request.user, "student_profile", None)
        if student is None:
            return Response(
                {"detail": "Authenticated user has no student profile."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            attempt = ExamAttempt.objects.get(
                examination=exam, student=student
            )
        except ExamAttempt.DoesNotExist:
            return Response(
                {"detail": "No attempt found for this examination."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if attempt.submission_time is not None:
            return Response(
                {"detail": "This attempt has already been submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()

        # ── Late-rejection gate (§9.5) ────────────────────────────────
        deadline_by_window = exam.end_window
        deadline_by_duration = attempt.start_time + timezone.timedelta(
            minutes=exam.duration_minutes
        )
        effective_deadline = min(deadline_by_window, deadline_by_duration)

        if now >= effective_deadline:
            return Response(
                {
                    "detail": (
                        "Submission rejected: the exam window or duration "
                        "has expired. You can no longer submit this attempt."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_disrupted = request.data.get("is_disrupted", False)

        # ── Freeze the attempt ────────────────────────────────────────
        with transaction.atomic():
            attempt.submission_time = now
            attempt.is_disrupted = is_disrupted
            attempt.grading_status = ExamAttempt.GradingStatusChoices.GRADING_PENDING
            attempt.save(
                update_fields=[
                    "submission_time",
                    "is_disrupted",
                    "grading_status",
                    "updated_at",
                ]
            )

        # ── Enqueue async grading (handoff to Phase 4) ───────────────
        from exams.tasks import grade_exam_attempt

        grade_exam_attempt.delay(str(attempt.pk))

        return Response(ExamAttemptSerializer(attempt).data)
