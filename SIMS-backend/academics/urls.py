from django.urls import path

from academics.views import (
    UniversityListView,
    UniversityDetailView,
    CollegeListView,
    CollegeDetailView,
    DepartmentListView,
    DepartmentDetailView,
    ProgramListView,
    ProgramDetailView,
    AcademicYearListView,
    AcademicYearDetailView,
    SemesterListView,
    SemesterDetailView,
    CourseListView,
    CourseDetailView,
    CoursePrerequisiteListView,
    CoursePrerequisiteDetailView,
    CourseOfferingListView,
    CourseOfferingDetailView,
    CreditHourPolicyListView,
    CreditHourPolicyDetailView,
    EnrollmentOverrideListView,
    EnrollmentOverrideDetailView,
    EnrollmentListView,
    EnrollmentDetailView,
    BatchEnrollmentImportView,
)

urlpatterns = [
    # University
    path("universities", UniversityListView.as_view(), name="university_list"),
    path("universities/<uuid:pk>", UniversityDetailView.as_view(), name="university_detail"),

    # College
    path("colleges", CollegeListView.as_view(), name="college_list"),
    path("colleges/<uuid:pk>", CollegeDetailView.as_view(), name="college_detail"),

    # Department
    path("departments", DepartmentListView.as_view(), name="department_list"),
    path("departments/<uuid:pk>", DepartmentDetailView.as_view(), name="department_detail"),

    # Program
    path("programs", ProgramListView.as_view(), name="program_list"),
    path("programs/<uuid:pk>", ProgramDetailView.as_view(), name="program_detail"),

    # Academic Year & Semester
    path("academic-years", AcademicYearListView.as_view(), name="academic_year_list"),
    path("academic-years/<uuid:pk>", AcademicYearDetailView.as_view(), name="academic_year_detail"),
    path("semesters", SemesterListView.as_view(), name="semester_list"),
    path("semesters/<uuid:pk>", SemesterDetailView.as_view(), name="semester_detail"),

    # Course & Prerequisites
    path("courses", CourseListView.as_view(), name="course_list"),
    path("courses/<uuid:pk>", CourseDetailView.as_view(), name="course_detail"),
    path("course-prerequisites", CoursePrerequisiteListView.as_view(), name="course_prerequisite_list"),
    path("course-prerequisites/<uuid:pk>", CoursePrerequisiteDetailView.as_view(), name="course_prerequisite_detail"),

    # Course Offering
    path("course-offerings", CourseOfferingListView.as_view(), name="course_offering_list"),
    path("course-offerings/<uuid:pk>", CourseOfferingDetailView.as_view(), name="course_offering_detail"),

    # Credit Policy & Overrides
    path("credit-hour-policies", CreditHourPolicyListView.as_view(), name="credit_hour_policy_list"),
    path("credit-hour-policies/<uuid:pk>", CreditHourPolicyDetailView.as_view(), name="credit_hour_policy_detail"),
    path("enrollment-overrides", EnrollmentOverrideListView.as_view(), name="enrollment_override_list"),
    path("enrollment-overrides/<uuid:pk>", EnrollmentOverrideDetailView.as_view(), name="enrollment_override_detail"),

    # Enrollment & Batch Import
    path("enrollments", EnrollmentListView.as_view(), name="enrollment_list"),
    path("enrollments/batch-import", BatchEnrollmentImportView.as_view(), name="batch_enrollment_import"),
    path("enrollments/<uuid:pk>", EnrollmentDetailView.as_view(), name="enrollment_detail"),
]
