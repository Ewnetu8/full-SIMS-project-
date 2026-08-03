from academics.models import Enrollment, EnrollmentStatusChoices
from accounts.permissions import HasRole
from django.db.models.deletion import ProtectedError
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from questions.models import Question, QuestionOption, QuestionTypeChoices
from rest_framework import status
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


def get_lecturer_write_permissions(request):
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        return [IsAuthenticated(), HasRole("ADMIN", "LECTURER")()]
    return [IsAuthenticated()]


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
        return get_lecturer_write_permissions(self.request)

    @extend_schema(
        tags=["Examination"],
        summary="List examinations",
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
            "Examinations are always created in DRAFT. "
            "Status follows the lifecycle DRAFT → SCHEDULED → ACTIVE → "
            "CLOSED → PUBLISHED; no skipping or rollback is allowed."
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
        return get_lecturer_write_permissions(self.request)

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
            "Status changes follow the lifecycle DRAFT → SCHEDULED → ACTIVE → "
            "CLOSED → PUBLISHED. Any other transition is rejected with a 400."
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
        return get_lecturer_write_permissions(self.request)

    @extend_schema(
        tags=["Examination"],
        summary="Schedule an examination",
        description=(
            "Validates the time window against the server clock and moves "
            "the exam from DRAFT to SCHEDULED. start_window must be in the "
            "future, end_window must be after start_window, and "
            "duration_minutes must be positive."
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

        obj.start_window = serializer.validated_data["start_window"]
        obj.end_window = serializer.validated_data["end_window"]
        obj.duration_minutes = serializer.validated_data["duration_minutes"]
        obj.status = ExamStatusChoices.SCHEDULED
        obj.save()
        return Response(ExaminationSerializer(obj).data)


class StudentActiveExamsView(APIView):
    def get_permissions(self):
        return [IsAuthenticated()]

    @extend_schema(
        tags=["Examination"],
        summary="List active examinations for the logged-in student",
        description=(
            "Returns only examinations for course offerings the student is "
            "enrolled in, whose status is ACTIVE and whose window currently "
            "includes the server time (start_window <= now < end_window)."
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
            )
            .select_related("course_offering__course", "lecturer")
            .prefetch_related("questions")
            .distinct()
            .order_by("start_window")
        )
        return Response(ExaminationSerializer(queryset, many=True).data)


class StartExamView(APIView):
    def get_permissions(self):
        return [IsAuthenticated()]

    @extend_schema(
        tags=["Attempt"],
        summary="Start an examination for the logged-in student",
        description=(
            "Creates an ExamAttempt if the student is enrolled, the exam is "
            "ACTIVE, the current server time is within the exam window, and "
            "the student has no existing attempt (unless the exam allows "
            "retakes). Returns the attempt plus the exam questions with "
            "correct answers hidden."
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
        return [IsAuthenticated()]

    @extend_schema(
        tags=["Attempt"],
        summary="Auto-save a student answer (upsert)",
        description=(
            "Creates or updates the student's answer to one question of one "
            "attempt. The attempt must belong to the logged-in student and "
            "must not be submitted yet. MCQ questions are answered via "
            "selected_option; text questions via submitted_text."
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
            answer, _ = StudentAnswer.objects.update_or_create(
                exam_attempt=attempt,
                question=question,
                defaults={"selected_option": None, "submitted_text": submitted_text},
            )
        return Response(StudentAnswerSerializer(answer).data)
