from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError

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
from academics.services import check_prerequisite_cycle, validate_enrollment


class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = ("id", "name", "code", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class CollegeSerializer(serializers.ModelSerializer):
    university_detail = UniversitySerializer(source="university", read_only=True)

    class Meta:
        model = College
        fields = ("id", "university", "university_detail", "name", "code", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class DepartmentSerializer(serializers.ModelSerializer):
    college_detail = CollegeSerializer(source="college", read_only=True)

    class Meta:
        model = Department
        fields = ("id", "college", "college_detail", "name", "code", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class ProgramSerializer(serializers.ModelSerializer):
    department_detail = DepartmentSerializer(source="department", read_only=True)

    class Meta:
        model = Program
        fields = (
            "id",
            "department",
            "department_detail",
            "name",
            "code",
            "degree_level",
            "total_credit_hours_required",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ("id", "display_label", "start_boundary", "end_boundary", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class SemesterSerializer(serializers.ModelSerializer):
    academic_year_detail = AcademicYearSerializer(source="academic_year", read_only=True)

    class Meta:
        model = Semester
        fields = ("id", "academic_year", "academic_year_detail", "semester_index", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class CourseSerializer(serializers.ModelSerializer):
    program_detail = ProgramSerializer(source="program", read_only=True)

    class Meta:
        model = Course
        fields = (
            "id",
            "program",
            "program_detail",
            "title",
            "course_code",
            "credit_hours",
            "intended_class_standing",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class CoursePrerequisiteSerializer(serializers.ModelSerializer):
    course_detail = CourseSerializer(source="course", read_only=True)
    prerequisite_course_detail = CourseSerializer(source="prerequisite_course", read_only=True)

    class Meta:
        model = CoursePrerequisite
        fields = (
            "id",
            "course",
            "course_detail",
            "prerequisite_course",
            "prerequisite_course_detail",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        course = attrs.get("course") or (self.instance.course if self.instance else None)
        prereq = attrs.get("prerequisite_course") or (self.instance.prerequisite_course if self.instance else None)
        if course and prereq:
            try:
                check_prerequisite_cycle(course, prereq)
            except DjangoValidationError as e:
                raise serializers.ValidationError(e.message if hasattr(e, 'message') else str(e))
        return attrs


class CourseOfferingSerializer(serializers.ModelSerializer):
    course_detail = CourseSerializer(source="course", read_only=True)
    semester_detail = SemesterSerializer(source="semester", read_only=True)

    class Meta:
        model = CourseOffering
        fields = (
            "id",
            "course",
            "course_detail",
            "semester",
            "semester_detail",
            "section",
            "capacity",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class CreditHourPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditHourPolicy
        fields = ("id", "class_standing", "min_credit_hours", "max_credit_hours", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class EnrollmentOverrideSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnrollmentOverride
        fields = (
            "id",
            "student",
            "semester",
            "override_type",
            "approved_by",
            "reason",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class EnrollmentSerializer(serializers.ModelSerializer):
    course_offering_detail = CourseOfferingSerializer(source="course_offering", read_only=True)

    class Meta:
        model = Enrollment
        fields = (
            "id",
            "student",
            "course_offering",
            "course_offering_detail",
            "status",
            "is_retake",
            "grade",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "is_retake", "created_at", "updated_at")

    def validate(self, attrs):
        student = attrs.get("student") or (self.instance.student if self.instance else None)
        course_offering = attrs.get("course_offering") or (self.instance.course_offering if self.instance else None)

        if not self.instance and student and course_offering:
            try:
                res = validate_enrollment(student, course_offering)
                attrs["is_retake"] = res.get("is_retake", False)
            except DjangoValidationError as e:
                raise serializers.ValidationError(e.message if hasattr(e, 'message') else str(e))
        return attrs


class BatchEnrollmentImportSerializer(serializers.Serializer):
    file = serializers.FileField(help_text="CSV file containing student enrollment rows.")
