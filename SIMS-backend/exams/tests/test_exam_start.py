import pytest
from accounts.models import Lecturer, RoleChoices, Student
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

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
    University,
)
from exams.models import ExamAttempt, ExamStatusChoices, Examination
from questions.models import Question, QuestionOption, QuestionTypeChoices

User = get_user_model()

pytestmark = pytest.mark.django_db

_counter = 0


def create_lecturer():
    global _counter
    _counter += 1
    email = f"lecturer{_counter}@example.com"
    identifier = f"L{_counter:03d}"
    user = User.objects.create_user(
        email=email, password="strongpass123", role=RoleChoices.LECTURER
    )
    lecturer = Lecturer.objects.create(user=user, faculty_identifier=identifier)
    return user, lecturer


def auth_client(client, user):
    login_response = client.post(
        reverse("auth_login"),
        {"email": user.email, "password": "strongpass123"},
        content_type="application/json",
    )
    assert login_response.status_code == status.HTTP_200_OK
    return login_response.json()["access"]


def make_course_offering():
    global _counter
    _counter += 1
    uni = University.objects.create(name=f"Test Uni {_counter}", code=f"TU{_counter}")
    col = College.objects.create(
        university=uni, name=f"Test Col {_counter}", code=f"TC{_counter}"
    )
    dept = Department.objects.create(
        college=col, name=f"Test Dept {_counter}", code=f"TD{_counter}"
    )
    prog = Program.objects.create(
        department=dept,
        name=f"Test Prog {_counter}",
        code=f"TP{_counter}",
        degree_level=DegreeLevelChoices.BACHELOR,
    )
    course = Course.objects.create(
        program=prog,
        title=f"Test Course {_counter}",
        course_code=f"TC{_counter}",
        credit_hours=3,
    )
    academic_year = AcademicYear.objects.create(
        display_label=f"2026-{_counter}",
        start_boundary="2026-01-01",
        end_boundary="2026-12-31",
    )
    semester = Semester.objects.create(
        academic_year=academic_year, semester_index=SemesterChoices.FIRST
    )
    return CourseOffering.objects.create(course=course, semester=semester)


def create_student():
    global _counter
    _counter += 1
    email = f"student{_counter}@example.com"
    user = User.objects.create_user(
        email=email, password="strongpass123", role=RoleChoices.STUDENT
    )
    student = Student.objects.create(
        user=user,
        student_identifier=f"S{_counter:03d}",
        class_standing="FRESHMAN",
    )
    return user, student


def make_active_exam(offering, lecturer, now=None, allow_retake=False):
    now = now or timezone.now()
    exam = Examination.objects.create(
        course_offering=offering,
        lecturer=lecturer,
        title="Midterm",
        status=ExamStatusChoices.DRAFT,
        start_window=now - timezone.timedelta(hours=1),
        end_window=now + timezone.timedelta(hours=1),
        duration_minutes=60,
        allow_retake=allow_retake,
    )
    question = Question.objects.create(
        examination=exam,
        creator=lecturer,
        question_text="What is 2+2?",
        question_type=QuestionTypeChoices.MCQ,
        total_points=5.00,
    )
    QuestionOption.objects.create(question=question, option_text="4", is_correct=True)
    QuestionOption.objects.create(question=question, option_text="5", is_correct=False)
    exam.status = ExamStatusChoices.ACTIVE
    exam.save()
    return exam


def test_student_starts_exam(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    offering = make_course_offering()
    Enrollment.objects.create(student=student, course_offering=offering)
    exam = make_active_exam(offering, lecturer)

    response = client.post(
        reverse("exam_start", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED
    body = response.json()
    assert body["attempt"]["examination"] == str(exam.pk)
    assert body["attempt"]["submission_time"] is None
    assert len(body["questions"]) == 1
    question = body["questions"][0]
    assert "is_correct" not in question["options"][0]
    assert "is_correct" not in question["options"][1]
    assert ExamAttempt.objects.filter(examination=exam, student=student).count() == 1


def test_student_cannot_start_twice_without_retake(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    offering = make_course_offering()
    Enrollment.objects.create(student=student, course_offering=offering)
    exam = make_active_exam(offering, lecturer)

    first = client.post(
        reverse("exam_start", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert first.status_code == status.HTTP_201_CREATED

    second = client.post(
        reverse("exam_start", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert second.status_code == status.HTTP_400_BAD_REQUEST
    assert ExamAttempt.objects.filter(examination=exam, student=student).count() == 1


def test_student_can_retake_when_allowed(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    offering = make_course_offering()
    Enrollment.objects.create(student=student, course_offering=offering)
    exam = make_active_exam(offering, lecturer, allow_retake=True)

    first = client.post(
        reverse("exam_start", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert first.status_code == status.HTTP_201_CREATED

    second = client.post(
        reverse("exam_start", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert second.status_code == status.HTTP_201_CREATED
    assert ExamAttempt.objects.filter(examination=exam, student=student).count() == 2


def test_student_cannot_start_unenrolled(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    offering = make_course_offering()
    exam = make_active_exam(offering, lecturer)

    response = client.post(
        reverse("exam_start", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_student_cannot_start_when_exam_not_active(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    offering = make_course_offering()
    Enrollment.objects.create(student=student, course_offering=offering)
    now = timezone.now()
    exam = Examination.objects.create(
        course_offering=offering,
        lecturer=lecturer,
        title="Midterm",
        status=ExamStatusChoices.SCHEDULED,
        start_window=now + timezone.timedelta(hours=1),
        end_window=now + timezone.timedelta(hours=3),
        duration_minutes=60,
    )

    response = client.post(
        reverse("exam_start", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_student_cannot_start_outside_window(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    offering = make_course_offering()
    Enrollment.objects.create(student=student, course_offering=offering)
    now = timezone.now()
    exam = Examination.objects.create(
        course_offering=offering,
        lecturer=lecturer,
        title="Midterm",
        status=ExamStatusChoices.ACTIVE,
        start_window=now - timezone.timedelta(hours=3),
        end_window=now - timezone.timedelta(hours=2),
        duration_minutes=60,
    )

    response = client.post(
        reverse("exam_start", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_start_requires_student_profile(client):
    lecturer_user, _ = create_lecturer()
    token = auth_client(client, lecturer_user)
    offering = make_course_offering()
    exam = make_active_exam(offering, lecturer_user.lecturer_profile)

    response = client.post(
        reverse("exam_start", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
