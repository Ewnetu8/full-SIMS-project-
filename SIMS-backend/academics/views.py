from accounts.permissions import HasRole
from drf_spectacular.utils import (
    OpenApiResponse,
    extend_schema,
    inline_serializer,
)
from rest_framework import serializers as drf_serializers
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from academics.models import University
from academics.serializers import UniversitySerializer

_UniversityListOut = inline_serializer(
    name="UniversityListOut",
    fields={
        "count": drf_serializers.IntegerField(),
        "results": UniversitySerializer(many=True),
    },
)

_ErrorOut = inline_serializer(
    name="UniversityErrorOut",
    fields={
        "detail": drf_serializers.CharField(),
    },
)


class UniversityListView(APIView):
    permission_classes = [IsAuthenticated, HasRole("ADMIN")]

    @extend_schema(
        tags=["University"],
        summary="List all universities",
        description="Returns a paginated list of all universities. Requires ADMIN role.",
        responses={
            200: UniversitySerializer(many=True),
            401: OpenApiResponse(description="Not authenticated."),
            403: OpenApiResponse(description="Not authorized – ADMIN role required."),
        },
    )
    def get(self, request):
        universities = University.objects.all().order_by("-created_at")
        serializer = UniversitySerializer(universities, many=True)
        return Response(serializer.data)

    @extend_schema(
        tags=["University"],
        summary="Create a new university",
        description="Creates a new university. Requires ADMIN role.",
        request=UniversitySerializer,
        responses={
            201: UniversitySerializer,
            400: OpenApiResponse(description="Validation error."),
            401: OpenApiResponse(description="Not authenticated."),
            403: OpenApiResponse(description="Not authorized – ADMIN role required."),
        },
    )
    def post(self, request):
        serializer = UniversitySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UniversityDetailView(APIView):
    permission_classes = [IsAuthenticated, HasRole("ADMIN")]

    def get_object(self, pk):
        try:
            return University.objects.get(pk=pk)
        except University.DoesNotExist:
            return None

    @extend_schema(
        tags=["University"],
        summary="Retrieve a university",
        description="Returns a single university by ID. Requires ADMIN role.",
        responses={
            200: UniversitySerializer,
            401: OpenApiResponse(description="Not authenticated."),
            403: OpenApiResponse(description="Not authorized – ADMIN role required."),
            404: OpenApiResponse(description="University not found."),
        },
    )
    def get(self, request, pk):
        university = self.get_object(pk)
        if university is None:
            return Response(
                {"detail": "University not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = UniversitySerializer(university)
        return Response(serializer.data)

    @extend_schema(
        tags=["University"],
        summary="Update a university",
        description="Full update of a university. Requires ADMIN role.",
        request=UniversitySerializer,
        responses={
            200: UniversitySerializer,
            400: OpenApiResponse(description="Validation error."),
            401: OpenApiResponse(description="Not authenticated."),
            403: OpenApiResponse(description="Not authorized – ADMIN role required."),
            404: OpenApiResponse(description="University not found."),
        },
    )
    def put(self, request, pk):
        university = self.get_object(pk)
        if university is None:
            return Response(
                {"detail": "University not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = UniversitySerializer(university, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=["University"],
        summary="Partial update a university",
        description="Partial update of a university. Requires ADMIN role.",
        request=UniversitySerializer,
        responses={
            200: UniversitySerializer,
            400: OpenApiResponse(description="Validation error."),
            401: OpenApiResponse(description="Not authenticated."),
            403: OpenApiResponse(description="Not authorized – ADMIN role required."),
            404: OpenApiResponse(description="University not found."),
        },
    )
    def patch(self, request, pk):
        university = self.get_object(pk)
        if university is None:
            return Response(
                {"detail": "University not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = UniversitySerializer(university, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=["University"],
        summary="Delete a university",
        description="Deletes a university. Requires ADMIN role.",
        responses={
            204: OpenApiResponse(description="University deleted."),
            401: OpenApiResponse(description="Not authenticated."),
            403: OpenApiResponse(description="Not authorized – ADMIN role required."),
            404: OpenApiResponse(description="University not found."),
        },
    )
    def delete(self, request, pk):
        university = self.get_object(pk)
        if university is None:
            return Response(
                {"detail": "University not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        university.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
