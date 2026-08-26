from accounts.permissions import HasRole
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from exams.models import StudentAnswer

from questions.models import Question, QuestionOption, RubricCriterion, Tag
from questions.serializers import (
    QuestionOptionSerializer,
    QuestionSerializer,
    RubricCriterionSerializer,
    TagSerializer,
)


def get_admin_write_permissions(request):
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        return [IsAuthenticated(), HasRole("ADMIN", "SYSTEM_ADMIN")()]
    return [IsAuthenticated()]


def get_lecturer_write_permissions(request):
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        return [IsAuthenticated(), HasRole("ADMIN", "SYSTEM_ADMIN", "LECTURER")()]
    return [IsAuthenticated()]


# QUESTION VIEWS
class QuestionListView(APIView):
    """Question list / create — restricted to LECTURERs (and ADMINs via HasRole)."""
    permission_classes = [IsAuthenticated, HasRole("LECTURER")]

    @extend_schema(
        tags=["Question"],
        summary="List questions",
        responses={200: QuestionSerializer(many=True)},
    )
    def get(self, request):
        queryset = (
            Question.objects.all()
            .select_related("creator", "examination")
            .prefetch_related("tags", "options", "rubric_criteria")
            .order_by("-created_at")
        )
        user_role = getattr(request.user, "role", None)
        if user_role == "LECTURER" and hasattr(request.user, "lecturer_profile"):
            queryset = queryset.filter(creator=request.user.lecturer_profile)
        examination = request.query_params.get("examination")
        if examination:
            queryset = queryset.filter(examination_id=examination)
        question_type = request.query_params.get("question_type")
        if question_type:
            queryset = queryset.filter(question_type=question_type)
        creator = request.query_params.get("creator")
        if creator:
            queryset = queryset.filter(creator_id=creator)
        return Response(QuestionSerializer(queryset, many=True).data)

    @extend_schema(
        tags=["Question"],
        summary="Create question",
        request=QuestionSerializer,
        responses={201: QuestionSerializer},
    )
    def post(self, request):
        serializer = QuestionSerializer(data=request.data)
        if serializer.is_valid():
            creator = getattr(request.user, "lecturer_profile", None)
            if creator is None:
                return Response(
                    {"detail": "Authenticated user has no lecturer profile."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            serializer.save(creator=creator)
            data = serializer.data
            warnings = getattr(serializer, "_warnings", None)
            if warnings:
                data["warnings"] = warnings
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuestionDetailView(APIView):
    """Question retrieve / update / delete — restricted to LECTURERs (and ADMINs)."""
    permission_classes = [IsAuthenticated, HasRole("LECTURER")]

    def get_object(self, pk):
        try:
            return Question.objects.get(pk=pk)
        except Question.DoesNotExist:
            return None

    @extend_schema(
        tags=["Question"],
        summary="Retrieve question",
        responses={200: QuestionSerializer},
    )
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Question not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(QuestionSerializer(obj).data)

    @extend_schema(
        tags=["Question"],
        summary="Update question",
        request=QuestionSerializer,
        responses={200: QuestionSerializer},
    )
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Question not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = QuestionSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            data = serializer.data
            warnings = getattr(serializer, "_warnings", None)
            if warnings:
                data["warnings"] = warnings
            return Response(data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=["Question"],
        summary="Partial update question",
        request=QuestionSerializer,
        responses={200: QuestionSerializer},
    )
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Question not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = QuestionSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            data = serializer.data
            warnings = getattr(serializer, "_warnings", None)
            if warnings:
                data["warnings"] = warnings
            return Response(data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=["Question"],
        summary="Delete (or soft-delete) question — SRS §9.3",
        description=(
            "Enforces the no-delete-if-linked business rule (SRS §9.3). "
            "If the question is referenced by any Examination or StudentAnswer the request "
            "performs a soft-delete by setting is_active=False and returns HTTP 200. "
            "Unlinked questions are also soft-deleted for audit consistency."
        ),
        responses={
            200: OpenApiResponse(description="Question soft-deleted (is_active set to False)."),
            404: OpenApiResponse(description="Question not found."),
        },
    )
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Question not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # §9.3: soft-delete via is_active flag — protects referential integrity
        # for past/current examinations and preserves audit trail.
        is_linked = (
            obj.examination_id is not None
            or StudentAnswer.objects.filter(question=obj).exists()
        )
        obj.is_active = False
        obj.save(update_fields=["is_active", "updated_at"])

        msg = (
            "Question soft-deleted; it is still referenced by an examination or student answers."
            if is_linked
            else "Question soft-deleted."
        )
        return Response({"detail": msg, "is_active": False}, status=status.HTTP_200_OK)


# QUESTION OPTION VIEWS
class QuestionOptionListView(APIView):
    def get_permissions(self):
        return get_lecturer_write_permissions(self.request)

    @extend_schema(
        tags=["QuestionOption"],
        summary="List question options",
        responses={200: QuestionOptionSerializer(many=True)},
    )
    def get(self, request):
        queryset = (
            QuestionOption.objects.all()
            .select_related("question")
            .order_by("-created_at")
        )
        question = request.query_params.get("question")
        if question:
            queryset = queryset.filter(question_id=question)
        return Response(QuestionOptionSerializer(queryset, many=True).data)

    @extend_schema(
        tags=["QuestionOption"],
        summary="Create question option",
        request=QuestionOptionSerializer,
        responses={201: QuestionOptionSerializer},
    )
    def post(self, request):
        serializer = QuestionOptionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuestionOptionDetailView(APIView):
    def get_permissions(self):
        return get_lecturer_write_permissions(self.request)

    def get_object(self, pk):
        try:
            return QuestionOption.objects.get(pk=pk)
        except QuestionOption.DoesNotExist:
            return None

    @extend_schema(
        tags=["QuestionOption"],
        summary="Retrieve option",
        responses={200: QuestionOptionSerializer},
    )
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Option not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(QuestionOptionSerializer(obj).data)

    @extend_schema(
        tags=["QuestionOption"],
        summary="Update option",
        request=QuestionOptionSerializer,
        responses={200: QuestionOptionSerializer},
    )
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Option not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = QuestionOptionSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=["QuestionOption"],
        summary="Partial update option",
        request=QuestionOptionSerializer,
        responses={200: QuestionOptionSerializer},
    )
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Option not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = QuestionOptionSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=["QuestionOption"],
        summary="Delete option",
        responses={204: OpenApiResponse(description="Deleted.")},
    )
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Option not found."}, status=status.HTTP_404_NOT_FOUND
            )
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# RUBRIC CRITERION VIEWS
class RubricCriterionListView(APIView):
    def get_permissions(self):
        return get_lecturer_write_permissions(self.request)

    @extend_schema(
        tags=["RubricCriterion"],
        summary="List rubric criteria",
        responses={200: RubricCriterionSerializer(many=True)},
    )
    def get(self, request):
        queryset = (
            RubricCriterion.objects.all()
            .select_related("question")
            .order_by("-created_at")
        )
        question = request.query_params.get("question")
        if question:
            queryset = queryset.filter(question_id=question)
        return Response(RubricCriterionSerializer(queryset, many=True).data)

    @extend_schema(
        tags=["RubricCriterion"],
        summary="Create rubric criterion",
        request=RubricCriterionSerializer,
        responses={201: RubricCriterionSerializer},
    )
    def post(self, request):
        serializer = RubricCriterionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RubricCriterionDetailView(APIView):
    def get_permissions(self):
        return get_lecturer_write_permissions(self.request)

    def get_object(self, pk):
        try:
            return RubricCriterion.objects.get(pk=pk)
        except RubricCriterion.DoesNotExist:
            return None

    @extend_schema(
        tags=["RubricCriterion"],
        summary="Retrieve criterion",
        responses={200: RubricCriterionSerializer},
    )
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Criterion not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(RubricCriterionSerializer(obj).data)

    @extend_schema(
        tags=["RubricCriterion"],
        summary="Update criterion",
        request=RubricCriterionSerializer,
        responses={200: RubricCriterionSerializer},
    )
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Criterion not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = RubricCriterionSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=["RubricCriterion"],
        summary="Partial update criterion",
        request=RubricCriterionSerializer,
        responses={200: RubricCriterionSerializer},
    )
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Criterion not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = RubricCriterionSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=["RubricCriterion"],
        summary="Delete criterion",
        responses={204: OpenApiResponse(description="Deleted.")},
    )
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Criterion not found."}, status=status.HTTP_404_NOT_FOUND
            )
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# TAG VIEWS
class TagListView(APIView):
    def get_permissions(self):
        return get_lecturer_write_permissions(self.request)

    @extend_schema(
        tags=["Tag"], summary="List tags", responses={200: TagSerializer(many=True)}
    )
    def get(self, request):
        queryset = Tag.objects.all().order_by("name")
        return Response(TagSerializer(queryset, many=True).data)

    @extend_schema(
        tags=["Tag"],
        summary="Create tag",
        request=TagSerializer,
        responses={201: TagSerializer},
    )
    def post(self, request):
        serializer = TagSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TagDetailView(APIView):
    def get_permissions(self):
        return get_lecturer_write_permissions(self.request)

    def get_object(self, pk):
        try:
            return Tag.objects.get(pk=pk)
        except Tag.DoesNotExist:
            return None

    @extend_schema(tags=["Tag"], summary="Retrieve tag", responses={200: TagSerializer})
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Tag not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(TagSerializer(obj).data)

    @extend_schema(
        tags=["Tag"],
        summary="Update tag",
        request=TagSerializer,
        responses={200: TagSerializer},
    )
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Tag not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = TagSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=["Tag"],
        summary="Partial update tag",
        request=TagSerializer,
        responses={200: TagSerializer},
    )
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Tag not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = TagSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=["Tag"],
        summary="Delete tag",
        responses={204: OpenApiResponse(description="Deleted.")},
    )
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Tag not found."}, status=status.HTTP_404_NOT_FOUND
            )
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
