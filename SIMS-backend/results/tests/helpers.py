from accounts.models import Lecturer, RoleChoices, Student, User
from academics.models import (
    AcademicYear,
    College,
    Course,
    CourseOffering,
    DegreeLevelChoices,
    Department,
    Enrollment,
    Program,
    Semester,
    SemesterChoices,
    TeachingAssignment,
    University,
)
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken

from results.models import Assessment

_counter = 0


def next_id():
    global _counter
    _counter += 1
    return _counter


def auth_client(client, user):
    # Mint a token directly: hitting auth_login in every test trips
    # the 10/minute AuthRateThrottle once the suite grows.
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


def make_admin():
    n = next_id()
    user = User.objects.create_user(
        email=f"admin{n}@example.com",
        password="strongpass123",
        role=RoleChoices.ADMIN,
    )
    return user


def make_lecturer():
    n = next_id()
    user = User.objects.create_user(
        email=f"lecturer{n}@example.com",
        password="strongpass123",
        role=RoleChoices.LECTURER,
    )
    lecturer = Lecturer.objects.create(user=user, faculty_identifier=f"L{n:03d}")
    return user, lecturer


def make_student():
    n = next_id()
    user = User.objects.create_user(
        email=f"student{n}@example.com",
        password="strongpass123",
        role=RoleChoices.STUDENT,
    )
    student = Student.objects.create(
        user=user,
        student_identifier=f"S{n:03d}",
        class_standing="FRESHMAN",
    )
    return user, student


def make_course_offering():
    n = next_id()
    uni = University.objects.create(name=f"Test Uni {n}", code=f"TU{n}")
    col = College.objects.create(university=uni, name=f"Test Col {n}", code=f"TC{n}")
    dept = Department.objects.create(college=col, name=f"Test Dept {n}", code=f"TD{n}")
    prog = Program.objects.create(
        department=dept,
        name=f"Test Prog {n}",
        code=f"TP{n}",
        degree_level=DegreeLevelChoices.BACHELOR,
    )
    course = Course.objects.create(
        program=prog,
        title=f"Test Course {n}",
        course_code=f"TC{n}",
        credit_hours=3,
    )
    academic_year = AcademicYear.objects.create(
        display_label=f"2026-{n}",
        start_boundary="2026-01-01",
        end_boundary="2026-12-31",
    )
    semester = Semester.objects.create(
        academic_year=academic_year, semester_index=SemesterChoices.FIRST
    )
    return CourseOffering.objects.create(course=course, semester=semester)


def enroll(student, offering, status="ENROLLED"):
    return Enrollment.objects.create(
        student=student, course_offering=offering, status=status
    )


def assign(lecturer, offering):
    return TeachingAssignment.objects.create(lecturer=lecturer, course_offering=offering)


def make_assessment(offering, lecturer, title=None, assessment_type="TEST", weight="30.00", max_marks="30.00", is_published=False):
    n = next_id()
    return Assessment.objects.create(
        course_offering=offering,
        created_by=lecturer,
        title=title or f"Assessment {n}",
        assessment_type=assessment_type,
        weight=weight,
        max_marks=max_marks,
        is_published=is_published,
    )


def assessment_list_url(offering):
    return reverse("assessment_list_create", args=[offering.pk])


def marks_url(assessment):
    return reverse("assessment_marks", args=[assessment.pk])
