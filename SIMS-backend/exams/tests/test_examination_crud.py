import pytest
from accounts.models import Lecturer, RoleChoices
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from academics.models import (
    AcademicYear,
    College,
    Course,
    CourseOffering,
    DegreeLevelChoices,
    Department,
    Program,
    Semester,
    SemesterChoices,
    University,
)
from exams.models import ExamAttempt, ExamStatusChoices, Examination
from questions.models import Question, QuestionTypeChoices

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


def valid_payload(offering):
    return {
        "course_offering": str(offering.pk),
        "title": "Midterm",
        "start_window": "2026-10-01T09:00:00Z",
        "end_window": "2026-10-01T11:00:00Z",
        "duration_minutes": 120,
    }


def create_exam(offering=None, lecturer=None):
    offering = offering or make_course_offering()
    if lecturer is None:
        _, lecturer = create_lecturer()
    return Examination.objects.create(
        course_offering=offering,
        lecturer=lecturer,
        title="Midterm",
        start_window="2026-10-01T09:00:00Z",
        end_window="2026-10-01T11:00:00Z",
        duration_minutes=120,
    )


def test_create_examination_starts_in_draft(client):
    lecturer_user, _ = create_lecturer()
    token = auth_client(client, lecturer_user)
    offering = make_course_offering()

    response = client.post(
        reverse("examination_list"),
        valid_payload(offering),
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED
    body = response.json()
    assert body["status"] == ExamStatusChoices.DRAFT
    assert body["lecturer"] == str(lecturer_user.lecturer_profile.pk)


def test_create_examination_rejects_non_draft_status(client):
    lecturer_user, _ = create_lecturer()
    token = auth_client(client, lecturer_user)
    offering = make_course_offering()

    payload = valid_payload(offering)
    payload["status"] = "ACTIVE"
    response = client.post(
        reverse("examination_list"),
        payload,
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_lecturer_sees_only_own_examinations(client):
    _, lecturer = create_lecturer()
    create_exam(lecturer=lecturer)
    other_user, _ = create_lecturer()
    token = auth_client(client, other_user)

    response = client.get(
        reverse("examination_list"), HTTP_AUTHORIZATION=f"Bearer {token}"
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_illegal_transition_rejected(client):
    admin = User.objects.create_user(
        email="admin@example.com", password="strongpass123", role=RoleChoices.ADMIN
    )
    token = auth_client(client, admin)
    exam = create_exam()

    response = client.patch(
        reverse("examination_detail", kwargs={"pk": exam.pk}),
        {"status": "ACTIVE"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    response = client.patch(
        reverse("examination_detail", kwargs={"pk": exam.pk}),
        {"status": "SCHEDULED"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    exam.refresh_from_db()
    assert exam.status == ExamStatusChoices.SCHEDULED


def test_state_machine_is_strictly_forward(client):
    admin = User.objects.create_user(
        email="admin@example.com", password="strongpass123", role=RoleChoices.ADMIN
    )
    token = auth_client(client, admin)
    exam = create_exam()

    transitions = [
        ("SCHEDULED", status.HTTP_200_OK),
        ("ACTIVE", status.HTTP_200_OK),
        ("CLOSED", status.HTTP_200_OK),
        ("PUBLISHED", status.HTTP_200_OK),
    ]
    for target, expected in transitions:
        response = client.patch(
            reverse("examination_detail", kwargs={"pk": exam.pk}),
            {"status": target},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        assert response.status_code == expected, f"transition to {target} failed"

    exam.refresh_from_db()
    assert exam.status == ExamStatusChoices.PUBLISHED

    for illegal in ("ACTIVE", "CLOSED", "DRAFT"):
        response = client.patch(
            reverse("examination_detail", kwargs={"pk": exam.pk}),
            {"status": illegal},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST, (
            f"rollback to {illegal} should be rejected"
        )


def test_question_edits_locked_once_exam_leaves_draft_scheduled(client):
    _, lecturer = create_lecturer()
    token = auth_client(client, lecturer.user)
    exam = create_exam(lecturer=lecturer)
    question = Question.objects.create(
        examination=exam,
        creator=lecturer,
        question_text="Locked Q",
        question_type=QuestionTypeChoices.MCQ,
        total_points=5.00,
    )

    exam.status = ExamStatusChoices.ACTIVE
    exam.save()

    create_response = client.post(
        reverse("question_list"),
        {
            "examination": str(exam.pk),
            "question_text": "Another Q",
            "question_type": "MCQ",
            "total_points": "5.00",
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert create_response.status_code == status.HTTP_400_BAD_REQUEST

    update_response = client.patch(
        reverse("question_detail", kwargs={"pk": question.pk}),
        {"question_text": "Trying to edit"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert update_response.status_code == status.HTTP_400_BAD_REQUEST


def test_question_removal_locked_when_exam_active(client):
    _, lecturer = create_lecturer()
    token = auth_client(client, lecturer.user)
    exam = create_exam(lecturer=lecturer)
    question = Question.objects.create(
        examination=exam,
        creator=lecturer,
        question_text="Locked Q",
        question_type=QuestionTypeChoices.MCQ,
        total_points=5.00,
    )

    exam.status = ExamStatusChoices.ACTIVE
    exam.save()

    response = client.delete(
        reverse("question_detail", kwargs={"pk": question.pk}),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_question_edits_allowed_in_draft(client):
    _, lecturer = create_lecturer()
    token = auth_client(client, lecturer.user)
    exam = create_exam(lecturer=lecturer)

    response = client.post(
        reverse("question_list"),
        {
            "examination": str(exam.pk),
            "question_text": "Draft Q",
            "question_type": "MCQ",
            "total_points": "5.00",
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED


def test_delete_exam_with_attempts_conflicts(client):
    admin = User.objects.create_user(
        email="admin@example.com", password="strongpass123", role=RoleChoices.ADMIN
    )
    token = auth_client(client, admin)
    exam = create_exam()
    student_user = User.objects.create_user(
        email="student@example.com",
        password="strongpass123",
        role=RoleChoices.STUDENT,
    )
    from accounts.models import Student

    student = Student.objects.create(
        user=student_user, student_identifier="S001", class_standing="FRESHMAN"
    )
    ExamAttempt.objects.create(
        examination=exam,
        student=student,
        start_time="2026-10-01T09:00:00Z",
    )

    response = client.delete(
        reverse("examination_detail", kwargs={"pk": exam.pk}),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_409_CONFLICT
