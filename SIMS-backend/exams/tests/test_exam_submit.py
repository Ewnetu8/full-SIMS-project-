from unittest.mock import patch

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
from exams.models import ExamAttempt, ExamStatusChoices, Examination, StudentAnswer
from questions.models import Question, QuestionOption, QuestionTypeChoices

User = get_user_model()

pytestmark = pytest.mark.django_db

_counter = 0


def create_lecturer():
    global _counter
    _counter += 1
    email = f"lecturer{_counter}@aastu.edu.et"
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
    email = f"student{_counter}@aastu.edu.et"
    user = User.objects.create_user(
        email=email, password="strongpass123", role=RoleChoices.STUDENT
    )
    student = Student.objects.create(
        user=user,
        student_identifier=f"S{_counter:03d}",
        class_standing="FRESHMAN",
    )
    return user, student


def make_active_exam(offering, lecturer, now=None, duration_minutes=60):
    now = now or timezone.now()
    exam = Examination.objects.create(
        course_offering=offering,
        lecturer=lecturer,
        title="Midterm",
        status=ExamStatusChoices.DRAFT,
        start_window=now - timezone.timedelta(hours=1),
        end_window=now + timezone.timedelta(hours=1),
        duration_minutes=duration_minutes,
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


def make_attempt(student, exam):
    return ExamAttempt.objects.create(
        examination=exam, student=student, start_time=timezone.now()
    )


# ── Successful submission ───────────────────────────────────────────


@patch("exams.tasks.grade_exam_attempt.delay")
def test_submit_freezes_attempt(mock_delay, client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    offering = make_course_offering()
    Enrollment.objects.create(student=student, course_offering=offering)
    exam = make_active_exam(offering, lecturer)
    attempt = make_attempt(student, exam)

    response = client.post(
        reverse("exam_submit", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["submission_time"] is not None
    attempt.refresh_from_db()
    assert attempt.submission_time is not None
    mock_delay.assert_called_once_with(str(attempt.pk))


@patch("exams.tasks.grade_exam_attempt.delay")
def test_submit_sets_is_disrupted(mock_delay, client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    offering = make_course_offering()
    Enrollment.objects.create(student=student, course_offering=offering)
    exam = make_active_exam(offering, lecturer)
    attempt = make_attempt(student, exam)

    response = client.post(
        reverse("exam_submit", kwargs={"pk": exam.pk}),
        {"is_disrupted": True},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    attempt.refresh_from_db()
    assert attempt.is_disrupted is True


# ── Rejection: already submitted ────────────────────────────────────


@patch("exams.tasks.grade_exam_attempt.delay")
def test_submit_rejects_double_submit(mock_delay, client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    offering = make_course_offering()
    Enrollment.objects.create(student=student, course_offering=offering)
    exam = make_active_exam(offering, lecturer)
    attempt = make_attempt(student, exam)

    first = client.post(
        reverse("exam_submit", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert first.status_code == status.HTTP_200_OK

    second = client.post(
        reverse("exam_submit", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert second.status_code == status.HTTP_400_BAD_REQUEST
    assert "already been submitted" in second.json()["detail"]


# ── Rejection: late by end_window ───────────────────────────────────


@patch("exams.tasks.grade_exam_attempt.delay")
def test_submit_rejects_after_end_window(mock_delay, client):
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
        start_window=now - timezone.timedelta(hours=2),
        end_window=now - timezone.timedelta(minutes=1),
        duration_minutes=60,
    )
    attempt = ExamAttempt.objects.create(
        examination=exam,
        student=student,
        start_time=now - timezone.timedelta(hours=2),
    )

    response = client.post(
        reverse("exam_submit", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "expired" in response.json()["detail"].lower()


# ── Rejection: late by duration_minutes ──────────────────────────────


@patch("exams.tasks.grade_exam_attempt.delay")
def test_submit_rejects_after_duration_expired(mock_delay, client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    offering = make_course_offering()
    Enrollment.objects.create(student=student, course_offering=offering)
    now = timezone.now()
    # end_window is far in the future, but duration is only 30 min
    exam = Examination.objects.create(
        course_offering=offering,
        lecturer=lecturer,
        title="Midterm",
        status=ExamStatusChoices.ACTIVE,
        start_window=now - timezone.timedelta(hours=2),
        end_window=now + timezone.timedelta(hours=2),
        duration_minutes=30,
    )
    # started 2 hours ago → duration expired 1.5 hours ago
    attempt = ExamAttempt.objects.create(
        examination=exam,
        student=student,
        start_time=now - timezone.timedelta(hours=2),
    )

    response = client.post(
        reverse("exam_submit", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "expired" in response.json()["detail"].lower()


# ── Rejection: no attempt exists ────────────────────────────────────


@patch("exams.tasks.grade_exam_attempt.delay")
def test_submit_rejects_if_no_attempt(mock_delay, client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    offering = make_course_offering()
    Enrollment.objects.create(student=student, course_offering=offering)
    exam = make_active_exam(offering, lecturer)

    response = client.post(
        reverse("exam_submit", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "No attempt" in response.json()["detail"]


# ── Rejection: wrong student ────────────────────────────────────────


@patch("exams.tasks.grade_exam_attempt.delay")
def test_submit_rejects_other_students_attempt(mock_delay, client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    other_user, other_student = create_student()
    token = auth_client(client, other_user)
    offering = make_course_offering()
    Enrollment.objects.create(student=student, course_offering=offering)
    Enrollment.objects.create(student=other_student, course_offering=offering)
    exam = make_active_exam(offering, lecturer)
    make_attempt(student, exam)  # student has attempt, other_user tries to submit

    response = client.post(
        reverse("exam_submit", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "No attempt" in response.json()["detail"]


# ── Rejection: student role required ────────────────────────────────


@patch("exams.tasks.grade_exam_attempt.delay")
def test_submit_requires_student_role(mock_delay, client):
    lecturer_user, lecturer = create_lecturer()
    token = auth_client(client, lecturer_user)
    offering = make_course_offering()
    exam = make_active_exam(offering, lecturer)

    response = client.post(
        reverse("exam_submit", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


# ── Rejection: exam not found ───────────────────────────────────────


def test_submit_rejects_nonexistent_exam(client):
    student_user, _ = create_student()
    token = auth_client(client, student_user)

    response = client.post(
        reverse("exam_submit", kwargs={"pk": "00000000-0000-0000-0000-000000000000"}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


# ── Grading task is always enqueued on success ──────────────────────


@patch("exams.tasks.grade_exam_attempt.delay")
def test_submit_enqueues_grading_task(mock_delay, client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    offering = make_course_offering()
    Enrollment.objects.create(student=student, course_offering=offering)
    exam = make_active_exam(offering, lecturer)
    attempt = make_attempt(student, exam)

    response = client.post(
        reverse("exam_submit", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert mock_delay.call_count == 1
    assert mock_delay.call_args[0][0] == str(attempt.pk)


# ── Role-based: student endpoints reject lecturer ───────────────────


@patch("exams.tasks.grade_exam_attempt.delay")
def test_lecturer_cannot_submit(mock_delay, client):
    lecturer_user, lecturer = create_lecturer()
    token = auth_client(client, lecturer_user)
    offering = make_course_offering()
    exam = make_active_exam(offering, lecturer)

    response = client.post(
        reverse("exam_submit", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_lecturer_cannot_start_exam(client):
    lecturer_user, lecturer = create_lecturer()
    token = auth_client(client, lecturer_user)
    offering = make_course_offering()
    exam = make_active_exam(offering, lecturer)

    response = client.post(
        reverse("exam_start", kwargs={"pk": exam.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_student_cannot_schedule_exam(client):
    _, lecturer = create_lecturer()
    student_user, _ = create_student()
    token = auth_client(client, student_user)
    offering = make_course_offering()
    exam = Examination.objects.create(
        course_offering=offering,
        lecturer=lecturer,
        title="Midterm",
        status=ExamStatusChoices.DRAFT,
        start_window=timezone.now() + timezone.timedelta(hours=1),
        end_window=timezone.now() + timezone.timedelta(hours=3),
        duration_minutes=120,
    )

    response = client.post(
        reverse("examination_schedule", kwargs={"pk": exam.pk}),
        {
            "start_window": (timezone.now() + timezone.timedelta(hours=2)).isoformat(),
            "end_window": (timezone.now() + timezone.timedelta(hours=4)).isoformat(),
            "duration_minutes": 120,
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_student_cannot_create_examination(client):
    student_user, _ = create_student()
    token = auth_client(client, student_user)
    offering = make_course_offering()

    response = client.post(
        reverse("examination_list"),
        {
            "course_offering": str(offering.pk),
            "title": "Midterm",
            "start_window": "2026-10-01T09:00:00Z",
            "end_window": "2026-10-01T11:00:00Z",
            "duration_minutes": 120,
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
