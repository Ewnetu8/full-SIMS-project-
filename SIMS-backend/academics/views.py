from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer
from rest_framework import serializers as drf_serializers

from accounts.permissions import HasRole
from academics.models import (
    University,
    College,
    Department,
    Program,
    AcademicYear,
    Semester,
    Course,
    CoursePrerequisite,
    CourseOffering,
    CreditHourPolicy,
    EnrollmentOverride,
    Enrollment,
)
from academics.serializers import (
    UniversitySerializer,
    CollegeSerializer,
    DepartmentSerializer,
    ProgramSerializer,
    AcademicYearSerializer,
    SemesterSerializer,
    CourseSerializer,
    CoursePrerequisiteSerializer,
    CourseOfferingSerializer,
    CreditHourPolicySerializer,
    EnrollmentOverrideSerializer,
    EnrollmentSerializer,
    BatchEnrollmentImportSerializer,
)
from academics.tasks import process_batch_enrollment_csv


# Helper function for permission checks based on HTTP method
def get_admin_write_permissions(request):
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        return [IsAuthenticated(), HasRole("ADMIN")()]
    return [IsAuthenticated()]


# ==========================================
# UNIVERSITY VIEWS
# ==========================================
class UniversityListView(APIView):
    permission_classes = [IsAuthenticated, HasRole("ADMIN")]

    @extend_schema(
        tags=["University"],
        summary="List all universities",
        responses={200: UniversitySerializer(many=True)},
    )
    def get(self, request):
        queryset = University.objects.all().order_by("-created_at")
        serializer = UniversitySerializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        tags=["University"],
        summary="Create a new university",
        request=UniversitySerializer,
        responses={201: UniversitySerializer, 400: OpenApiResponse(description="Validation error.")},
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

    @extend_schema(tags=["University"], summary="Retrieve a university", responses={200: UniversitySerializer, 404: OpenApiResponse(description="Not found.")})
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "University not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(UniversitySerializer(obj).data)

    @extend_schema(tags=["University"], summary="Update a university", request=UniversitySerializer, responses={200: UniversitySerializer})
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "University not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = UniversitySerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["University"], summary="Partial update a university", request=UniversitySerializer, responses={200: UniversitySerializer})
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "University not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = UniversitySerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["University"], summary="Delete a university", responses={204: OpenApiResponse(description="Deleted.")})
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "University not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==========================================
# COLLEGE VIEWS
# ==========================================
class CollegeListView(APIView):
    def get_permissions(self):
        return get_admin_write_permissions(self.request)

    @extend_schema(tags=["College"], summary="List colleges", responses={200: CollegeSerializer(many=True)})
    def get(self, request):
        queryset = College.objects.all().select_related("university").order_by("-created_at")
        return Response(CollegeSerializer(queryset, many=True).data)

    @extend_schema(tags=["College"], summary="Create college", request=CollegeSerializer, responses={201: CollegeSerializer})
    def post(self, request):
        serializer = CollegeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CollegeDetailView(APIView):
    def get_permissions(self):
        return get_admin_write_permissions(self.request)

    def get_object(self, pk):
        try:
            return College.objects.get(pk=pk)
        except College.DoesNotExist:
            return None

    @extend_schema(tags=["College"], summary="Retrieve college", responses={200: CollegeSerializer})
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "College not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CollegeSerializer(obj).data)

    @extend_schema(tags=["College"], summary="Update college", request=CollegeSerializer, responses={200: CollegeSerializer})
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "College not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CollegeSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["College"], summary="Partial update college", request=CollegeSerializer, responses={200: CollegeSerializer})
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "College not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CollegeSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["College"], summary="Delete college", responses={204: OpenApiResponse(description="Deleted.")})
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "College not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==========================================
# DEPARTMENT VIEWS
# ==========================================
class DepartmentListView(APIView):
    def get_permissions(self):
        return get_admin_write_permissions(self.request)

    @extend_schema(tags=["Department"], summary="List departments", responses={200: DepartmentSerializer(many=True)})
    def get(self, request):
        queryset = Department.objects.all().select_related("college").order_by("-created_at")
        return Response(DepartmentSerializer(queryset, many=True).data)

    @extend_schema(tags=["Department"], summary="Create department", request=DepartmentSerializer, responses={201: DepartmentSerializer})
    def post(self, request):
        serializer = DepartmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DepartmentDetailView(APIView):
    def get_permissions(self):
        return get_admin_write_permissions(self.request)

    def get_object(self, pk):
        try:
            return Department.objects.get(pk=pk)
        except Department.DoesNotExist:
            return None

    @extend_schema(tags=["Department"], summary="Retrieve department", responses={200: DepartmentSerializer})
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Department not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(DepartmentSerializer(obj).data)

    @extend_schema(tags=["Department"], summary="Update department", request=DepartmentSerializer, responses={200: DepartmentSerializer})
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Department not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = DepartmentSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["Department"], summary="Partial update department", request=DepartmentSerializer, responses={200: DepartmentSerializer})
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Department not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = DepartmentSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["Department"], summary="Delete department", responses={204: OpenApiResponse(description="Deleted.")})
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Department not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==========================================
# PROGRAM VIEWS
# ==========================================
class ProgramListView(APIView):
    def get_permissions(self):
        return get_admin_write_permissions(self.request)

    @extend_schema(tags=["Program"], summary="List programs", responses={200: ProgramSerializer(many=True)})
    def get(self, request):
        queryset = Program.objects.all().select_related("department").order_by("-created_at")
        return Response(ProgramSerializer(queryset, many=True).data)

    @extend_schema(tags=["Program"], summary="Create program", request=ProgramSerializer, responses={201: ProgramSerializer})
    def post(self, request):
        serializer = ProgramSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProgramDetailView(APIView):
    def get_permissions(self):
        return get_admin_write_permissions(self.request)

    def get_object(self, pk):
        try:
            return Program.objects.get(pk=pk)
        except Program.DoesNotExist:
            return None

    @extend_schema(tags=["Program"], summary="Retrieve program", responses={200: ProgramSerializer})
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Program not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProgramSerializer(obj).data)

    @extend_schema(tags=["Program"], summary="Update program", request=ProgramSerializer, responses={200: ProgramSerializer})
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Program not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProgramSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["Program"], summary="Partial update program", request=ProgramSerializer, responses={200: ProgramSerializer})
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Program not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProgramSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["Program"], summary="Delete program", responses={204: OpenApiResponse(description="Deleted.")})
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Program not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==========================================
# ACADEMIC YEAR & SEMESTER VIEWS
# ==========================================
class AcademicYearListView(APIView):
    def get_permissions(self):
        return get_admin_write_permissions(self.request)

    @extend_schema(tags=["AcademicYear"], summary="List academic years", responses={200: AcademicYearSerializer(many=True)})
    def get(self, request):
        queryset = AcademicYear.objects.all().order_by("-start_boundary")
        return Response(AcademicYearSerializer(queryset, many=True).data)

    @extend_schema(tags=["AcademicYear"], summary="Create academic year", request=AcademicYearSerializer, responses={201: AcademicYearSerializer})
    def post(self, request):
        serializer = AcademicYearSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AcademicYearDetailView(APIView):
    def get_permissions(self):
        return get_admin_write_permissions(self.request)

    def get_object(self, pk):
        try:
            return AcademicYear.objects.get(pk=pk)
        except AcademicYear.DoesNotExist:
            return None

    @extend_schema(tags=["AcademicYear"], summary="Retrieve academic year", responses={200: AcademicYearSerializer})
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Academic year not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(AcademicYearSerializer(obj).data)

    @extend_schema(tags=["AcademicYear"], summary="Update academic year", request=AcademicYearSerializer, responses={200: AcademicYearSerializer})
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Academic year not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AcademicYearSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["AcademicYear"], summary="Partial update academic year", request=AcademicYearSerializer, responses={200: AcademicYearSerializer})
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Academic year not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AcademicYearSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["AcademicYear"], summary="Delete academic year", responses={204: OpenApiResponse(description="Deleted.")})
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Academic year not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SemesterListView(APIView):
    def get_permissions(self):
        return get_admin_write_permissions(self.request)

    @extend_schema(tags=["Semester"], summary="List semesters", responses={200: SemesterSerializer(many=True)})
    def get(self, request):
        queryset = Semester.objects.all().select_related("academic_year").order_by("-created_at")
        return Response(SemesterSerializer(queryset, many=True).data)

    @extend_schema(tags=["Semester"], summary="Create semester", request=SemesterSerializer, responses={201: SemesterSerializer})
    def post(self, request):
        serializer = SemesterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SemesterDetailView(APIView):
    def get_permissions(self):
        return get_admin_write_permissions(self.request)

    def get_object(self, pk):
        try:
            return Semester.objects.get(pk=pk)
        except Semester.DoesNotExist:
            return None

    @extend_schema(tags=["Semester"], summary="Retrieve semester", responses={200: SemesterSerializer})
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Semester not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(SemesterSerializer(obj).data)

    @extend_schema(tags=["Semester"], summary="Update semester", request=SemesterSerializer, responses={200: SemesterSerializer})
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Semester not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = SemesterSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["Semester"], summary="Partial update semester", request=SemesterSerializer, responses={200: SemesterSerializer})
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Semester not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = SemesterSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["Semester"], summary="Delete semester", responses={204: OpenApiResponse(description="Deleted.")})
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Semester not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==========================================
# COURSE & PREREQUISITE VIEWS
# ==========================================
class CourseListView(APIView):
    def get_permissions(self):
        return get_admin_write_permissions(self.request)

    @extend_schema(tags=["Course"], summary="List courses", responses={200: CourseSerializer(many=True)})
    def get(self, request):
        queryset = Course.objects.all().select_related("program").order_by("-created_at")
        return Response(CourseSerializer(queryset, many=True).data)

    @extend_schema(tags=["Course"], summary="Create course", request=CourseSerializer, responses={201: CourseSerializer})
    def post(self, request):
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CourseDetailView(APIView):
    def get_permissions(self):
        return get_admin_write_permissions(self.request)

    def get_object(self, pk):
        try:
            return Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return None

    @extend_schema(tags=["Course"], summary="Retrieve course", responses={200: CourseSerializer})
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CourseSerializer(obj).data)

    @extend_schema(tags=["Course"], summary="Update course", request=CourseSerializer, responses={200: CourseSerializer})
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CourseSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["Course"], summary="Partial update course", request=CourseSerializer, responses={200: CourseSerializer})
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CourseSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["Course"], summary="Delete course", responses={204: OpenApiResponse(description="Deleted.")})
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CoursePrerequisiteListView(APIView):
    def get_permissions(self):
        return get_admin_write_permissions(self.request)

    @extend_schema(tags=["CoursePrerequisite"], summary="List prerequisites", responses={200: CoursePrerequisiteSerializer(many=True)})
    def get(self, request):
        queryset = CoursePrerequisite.objects.all().select_related("course", "prerequisite_course")
        return Response(CoursePrerequisiteSerializer(queryset, many=True).data)

    @extend_schema(tags=["CoursePrerequisite"], summary="Create prerequisite", request=CoursePrerequisiteSerializer, responses={201: CoursePrerequisiteSerializer})
    def post(self, request):
        serializer = CoursePrerequisiteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CoursePrerequisiteDetailView(APIView):
    permission_classes = [IsAuthenticated, HasRole("ADMIN")]

    def get_object(self, pk):
        try:
            return CoursePrerequisite.objects.get(pk=pk)
        except CoursePrerequisite.DoesNotExist:
            return None

    @extend_schema(tags=["CoursePrerequisite"], summary="Retrieve prerequisite", responses={200: CoursePrerequisiteSerializer})
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Prerequisite not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CoursePrerequisiteSerializer(obj).data)

    @extend_schema(tags=["CoursePrerequisite"], summary="Delete prerequisite", responses={204: OpenApiResponse(description="Deleted.")})
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Prerequisite not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==========================================
# COURSE OFFERING VIEWS
# ==========================================
class CourseOfferingListView(APIView):
    def get_permissions(self):
        return get_admin_write_permissions(self.request)

    @extend_schema(tags=["CourseOffering"], summary="List course offerings", responses={200: CourseOfferingSerializer(many=True)})
    def get(self, request):
        queryset = CourseOffering.objects.all().select_related("course", "semester")
        return Response(CourseOfferingSerializer(queryset, many=True).data)

    @extend_schema(tags=["CourseOffering"], summary="Create course offering", request=CourseOfferingSerializer, responses={201: CourseOfferingSerializer})
    def post(self, request):
        serializer = CourseOfferingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CourseOfferingDetailView(APIView):
    def get_permissions(self):
        return get_admin_write_permissions(self.request)

    def get_object(self, pk):
        try:
            return CourseOffering.objects.get(pk=pk)
        except CourseOffering.DoesNotExist:
            return None

    @extend_schema(tags=["CourseOffering"], summary="Retrieve course offering", responses={200: CourseOfferingSerializer})
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Offering not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CourseOfferingSerializer(obj).data)

    @extend_schema(tags=["CourseOffering"], summary="Update course offering", request=CourseOfferingSerializer, responses={200: CourseOfferingSerializer})
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Offering not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CourseOfferingSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["CourseOffering"], summary="Partial update course offering", request=CourseOfferingSerializer, responses={200: CourseOfferingSerializer})
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Offering not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CourseOfferingSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["CourseOffering"], summary="Delete course offering", responses={204: OpenApiResponse(description="Deleted.")})
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Offering not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==========================================
# CREDIT HOUR POLICY & OVERRIDE VIEWS
# ==========================================
class CreditHourPolicyListView(APIView):
    permission_classes = [IsAuthenticated, HasRole("ADMIN")]

    @extend_schema(tags=["CreditHourPolicy"], summary="List credit hour policies", responses={200: CreditHourPolicySerializer(many=True)})
    def get(self, request):
        queryset = CreditHourPolicy.objects.all()
        return Response(CreditHourPolicySerializer(queryset, many=True).data)

    @extend_schema(tags=["CreditHourPolicy"], summary="Create credit hour policy", request=CreditHourPolicySerializer, responses={201: CreditHourPolicySerializer})
    def post(self, request):
        serializer = CreditHourPolicySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreditHourPolicyDetailView(APIView):
    permission_classes = [IsAuthenticated, HasRole("ADMIN")]

    def get_object(self, pk):
        try:
            return CreditHourPolicy.objects.get(pk=pk)
        except CreditHourPolicy.DoesNotExist:
            return None

    @extend_schema(tags=["CreditHourPolicy"], summary="Retrieve policy", responses={200: CreditHourPolicySerializer})
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Policy not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CreditHourPolicySerializer(obj).data)

    @extend_schema(tags=["CreditHourPolicy"], summary="Update policy", request=CreditHourPolicySerializer, responses={200: CreditHourPolicySerializer})
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Policy not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CreditHourPolicySerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["CreditHourPolicy"], summary="Delete policy", responses={204: OpenApiResponse(description="Deleted.")})
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Policy not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EnrollmentOverrideListView(APIView):
    permission_classes = [IsAuthenticated, HasRole("ADMIN")]

    @extend_schema(tags=["EnrollmentOverride"], summary="List enrollment overrides", responses={200: EnrollmentOverrideSerializer(many=True)})
    def get(self, request):
        queryset = EnrollmentOverride.objects.all().select_related("student", "semester", "approved_by")
        return Response(EnrollmentOverrideSerializer(queryset, many=True).data)

    @extend_schema(tags=["EnrollmentOverride"], summary="Create enrollment override", request=EnrollmentOverrideSerializer, responses={201: EnrollmentOverrideSerializer})
    def post(self, request):
        serializer = EnrollmentOverrideSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(approved_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EnrollmentOverrideDetailView(APIView):
    permission_classes = [IsAuthenticated, HasRole("ADMIN")]

    def get_object(self, pk):
        try:
            return EnrollmentOverride.objects.get(pk=pk)
        except EnrollmentOverride.DoesNotExist:
            return None

    @extend_schema(tags=["EnrollmentOverride"], summary="Retrieve override", responses={200: EnrollmentOverrideSerializer})
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Override not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(EnrollmentOverrideSerializer(obj).data)

    @extend_schema(tags=["EnrollmentOverride"], summary="Delete override", responses={204: OpenApiResponse(description="Deleted.")})
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Override not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==========================================
# ENROLLMENT VIEWS
# ==========================================
class EnrollmentListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Enrollment"], summary="List enrollments", responses={200: EnrollmentSerializer(many=True)})
    def get(self, request):
        if request.user.role == "STUDENT":
            queryset = Enrollment.objects.filter(student__user=request.user)
        else:
            queryset = Enrollment.objects.all()
        queryset = queryset.select_related("student", "course_offering")
        return Response(EnrollmentSerializer(queryset, many=True).data)

    @extend_schema(tags=["Enrollment"], summary="Create enrollment (with 4-rule validation)", request=EnrollmentSerializer, responses={201: EnrollmentSerializer})
    def post(self, request):
        serializer = EnrollmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EnrollmentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Enrollment.objects.get(pk=pk)
        except Enrollment.DoesNotExist:
            return None

    @extend_schema(tags=["Enrollment"], summary="Retrieve enrollment", responses={200: EnrollmentSerializer})
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Enrollment not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(EnrollmentSerializer(obj).data)

    @extend_schema(tags=["Enrollment"], summary="Update enrollment status/grade", request=EnrollmentSerializer, responses={200: EnrollmentSerializer})
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Enrollment not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = EnrollmentSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["Enrollment"], summary="Delete/Drop enrollment", responses={204: OpenApiResponse(description="Deleted.")})
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Enrollment not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==========================================
# BATCH ENROLLMENT IMPORT VIEW (FR-004)
# ==========================================
_BatchImportAsyncOut = inline_serializer(
    name="BatchImportAsyncOut",
    fields={
        "detail": drf_serializers.CharField(),
        "task_id": drf_serializers.CharField(),
    },
)


class BatchEnrollmentImportView(APIView):
    permission_classes = [IsAuthenticated, HasRole("ADMIN")]

    @extend_schema(
        tags=["Enrollment"],
        summary="Async CSV batch enrollment import (FR-004)",
        description="Upload a CSV file containing batch enrollment rows. Triggers background Celery task.",
        request=BatchEnrollmentImportSerializer,
        responses={202: _BatchImportAsyncOut, 400: OpenApiResponse(description="Invalid request.")},
    )
    def post(self, request):
        serializer = BatchEnrollmentImportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = serializer.validated_data["file"]
        csv_content = uploaded_file.read().decode("utf-8")

        task = process_batch_enrollment_csv.delay(csv_content)

        return Response(
            {
                "detail": "Batch enrollment import task dispatched successfully.",
                "task_id": task.id,
            },
            status=status.HTTP_202_ACCEPTED,
        )
