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
from questions.models import Question, QuestionOption, QuestionTypeChoices

User = get_user_model()

pytestmark = pytest.mark.django_db


def create_lecturer():
    user = User.objects.create_user(email="lecturer@aastu.edu.et", password="strongpass123", role=RoleChoices.LECTURER)
    lecturer = Lecturer.objects.create(user=user, faculty_identifier="L001")
    return user, lecturer


def create_admin():
    return User.objects.create_user(email="admin@aastu.edu.et", password="strongpass123", role=RoleChoices.ADMIN)


def auth_client(client, user):
    login_response = client.post(
        reverse("auth_login"),
        {"email": user.email, "password": "strongpass123"},
        content_type="application/json",
    )
    assert login_response.status_code == status.HTTP_200_OK
    return login_response.json()["access"]


def setup_question():
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
    question = Question.objects.create(
        examination=exam,
        creator=lecturer,
        question_text="What is 2+2?",
        question_type=QuestionTypeChoices.MCQ,
        total_points=5.00,
    )
    return question


LIST_URL = reverse("question_option_list")


def test_create_mcq_option_succeeds(client):
    admin = create_admin()
    token = auth_client(client, admin)
    question = setup_question()

    response = client.post(
        LIST_URL,
        {"question": str(question.pk), "option_text": "4", "is_correct": True},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["option_text"] == "4"
    assert response.json()["is_correct"] is True


def test_at_least_one_correct_validation(client):
    admin = create_admin()
    token = auth_client(client, admin)
    question = setup_question()

    QuestionOption.objects.create(question=question, option_text="3", is_correct=True)

    response = client.post(
        LIST_URL,
        {"question": str(question.pk), "option_text": "5", "is_correct": False},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED

    only_correct = QuestionOption.objects.get(question=question, option_text="3")
    detail_url = reverse("question_option_detail", kwargs={"pk": only_correct.pk})
    response = client.patch(
        detail_url,
        {"is_correct": False},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_option_list_filter(client):
    admin = create_admin()
    token = auth_client(client, admin)
    question = setup_question()
    other_q = Question.objects.create(
        examination=question.examination,
        creator=question.creator,
        question_text="Other?",
        question_type=QuestionTypeChoices.MCQ,
        total_points=5.00,
    )
    o1 = QuestionOption.objects.create(question=question, option_text="A", is_correct=True)
    o2 = QuestionOption.objects.create(question=other_q, option_text="B", is_correct=True)

    response = client.get(
        LIST_URL,
        {"question": str(question.pk)},
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1


def test_option_update(client):
    admin = create_admin()
    token = auth_client(client, admin)
    question = setup_question()

    option = QuestionOption.objects.create(question=question, option_text="Old", is_correct=True)

    detail_url = reverse("question_option_detail", kwargs={"pk": option.pk})
    response = client.put(
        detail_url,
        {"question": str(question.pk), "option_text": "New", "is_correct": True},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["option_text"] == "New"


def test_option_delete(client):
    admin = create_admin()
    token = auth_client(client, admin)
    question = setup_question()

    option = QuestionOption.objects.create(question=question, option_text="Delete", is_correct=True)

    detail_url = reverse("question_option_detail", kwargs={"pk": option.pk})
    response = client.delete(detail_url, HTTP_AUTHORIZATION=f"Bearer {token}")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not QuestionOption.objects.filter(pk=option.pk).exists()


def test_non_admin_cannot_create(client):
    student = User.objects.create_user(email="student@aastu.edu.et", password="strongpass123", role=RoleChoices.STUDENT)
    token = auth_client(client, student)

    response = client.post(
        LIST_URL,
        {"question": "00000000-0000-0000-0000-000000000000", "option_text": "test", "is_correct": True},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
