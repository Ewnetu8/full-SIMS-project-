import pytest
from accounts.models import Lecturer, RoleChoices
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from academics.models import (
    College,
    Course,
    DegreeLevelChoices,
    Department,
    Program,
    University,
)
from exams.models import Examination
from questions.models import Question, QuestionTypeChoices, RubricCriterion

User = get_user_model()

pytestmark = pytest.mark.django_db


def create_lecturer():
    user = User.objects.create_user(email="lecturer@example.com", password="strongpass123", role=RoleChoices.LECTURER)
    lecturer = Lecturer.objects.create(user=user, faculty_identifier="L001")
    return user, lecturer


def create_admin():
    return User.objects.create_user(email="admin@example.com", password="strongpass123", role=RoleChoices.ADMIN)


def auth_client(client, user):
    login_response = client.post(
        reverse("auth_login"),
        {"email": user.email, "password": "strongpass123"},
        content_type="application/json",
    )
    assert login_response.status_code == status.HTTP_200_OK
    return login_response.json()["access"]


def setup_course_and_exam():
    uni = University.objects.create(name="Test Uni", code="TU")
    col = College.objects.create(university=uni, name="Test Col", code="TC")
    dept = Department.objects.create(college=col, name="Test Dept", code="TD")
    prog = Program.objects.create(department=dept, name="Test Prog", code="TP", degree_level=DegreeLevelChoices.BACHELOR)
    course = Course.objects.create(program=prog, title="Test Course", course_code="TC101", credit_hours=3)
    _, lecturer = create_lecturer()
    exam = Examination.objects.create(
        course=course,
        lecturer=lecturer,
        title="Midterm",
        start_window="2026-10-01T09:00:00Z",
        end_window="2026-10-01T11:00:00Z",
        duration_minutes=120,
    )
    return exam


LIST_URL = reverse("rubric_criterion_list")


def test_create_rubric_criterion_mcq_no_validation(client):
    admin = create_admin()
    token = auth_client(client, admin)
    exam = setup_course_and_exam()

    question = Question.objects.create(
        examination=exam,
        creator=exam.lecturer,
        question_text="What is 2+2?",
        question_type=QuestionTypeChoices.MCQ,
        total_points=5.00,
    )

    response = client.post(
        LIST_URL,
        {"question": str(question.pk), "criterion_text": "Correct answer", "point_weight": "3.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["criterion_text"] == "Correct answer"


def test_fr006_point_weight_sum_validation(client):
    admin = create_admin()
    token = auth_client(client, admin)
    exam = setup_course_and_exam()

    question = Question.objects.create(
        examination=exam,
        creator=exam.lecturer,
        question_text="Explain gravity",
        question_type=QuestionTypeChoices.ESSAY,
        total_points=10.00,
    )

    RubricCriterion.objects.create(question=question, criterion_text="Content", point_weight=4.00)
    RubricCriterion.objects.create(question=question, criterion_text="Clarity", point_weight=3.00)

    response = client.post(
        LIST_URL,
        {"question": str(question.pk), "criterion_text": "References", "point_weight": "3.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED

    response = client.post(
        LIST_URL,
        {"question": str(question.pk), "criterion_text": "Extra", "point_weight": "1.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_fr006_exact_sum_passes(client):
    admin = create_admin()
    token = auth_client(client, admin)
    exam = setup_course_and_exam()

    question = Question.objects.create(
        examination=exam,
        creator=exam.lecturer,
        question_text="Short answer question",
        question_type=QuestionTypeChoices.SHORT_ANSWER,
        total_points=6.00,
    )

    response = client.post(
        LIST_URL,
        {"question": str(question.pk), "criterion_text": "Accuracy", "point_weight": "6.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED


def test_rubric_criterion_list_filter(client):
    admin = create_admin()
    token = auth_client(client, admin)
    exam = setup_course_and_exam()

    q1 = Question.objects.create(
        examination=exam, creator=exam.lecturer,
        question_text="Q1", question_type=QuestionTypeChoices.MCQ, total_points=5.00,
    )
    q2 = Question.objects.create(
        examination=exam, creator=exam.lecturer,
        question_text="Q2", question_type=QuestionTypeChoices.MCQ, total_points=5.00,
    )
    RubricCriterion.objects.create(question=q1, criterion_text="C1", point_weight=5.00)
    RubricCriterion.objects.create(question=q2, criterion_text="C2", point_weight=5.00)

    response = client.get(
        LIST_URL,
        {"question": str(q1.pk)},
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1


def test_rubric_criterion_detail_update_delete(client):
    admin = create_admin()
    token = auth_client(client, admin)
    exam = setup_course_and_exam()

    question = Question.objects.create(
        examination=exam, creator=exam.lecturer,
        question_text="Essay Q", question_type=QuestionTypeChoices.ESSAY, total_points=5.00,
    )
    criterion = RubricCriterion.objects.create(question=question, criterion_text="Original", point_weight=5.00)

    detail_url = reverse("rubric_criterion_detail", kwargs={"pk": criterion.pk})

    response = client.get(detail_url, HTTP_AUTHORIZATION=f"Bearer {token}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["criterion_text"] == "Original"

    response = client.put(
        detail_url,
        {"question": str(question.pk), "criterion_text": "Updated", "point_weight": "5.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["criterion_text"] == "Updated"

    response = client.delete(detail_url, HTTP_AUTHORIZATION=f"Bearer {token}")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not RubricCriterion.objects.filter(pk=criterion.pk).exists()


def test_non_lecturer_cannot_create(client):
    student = User.objects.create_user(email="student@example.com", password="strongpass123", role=RoleChoices.STUDENT)
    token = auth_client(client, student)

    response = client.post(
        LIST_URL,
        {"question": "00000000-0000-0000-0000-000000000000", "criterion_text": "test", "point_weight": "1.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
