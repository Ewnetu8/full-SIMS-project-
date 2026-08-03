from accounts.permissions import HasRole
from django.db.models.deletion import ProtectedError
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from exams.models import Examination
from exams.serializers import ExaminationSerializer


def get_lecturer_write_permissions(request):
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        return [IsAuthenticated(), HasRole("ADMIN", "LECTURER")()]
    return [IsAuthenticated()]


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
        try:
            return (
                Examination.objects.select_related(
                    "course_offering__course", "lecturer"
                )
                .prefetch_related("questions")
                .get(pk=pk)
            )
        except Examination.DoesNotExist:
            return None

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
