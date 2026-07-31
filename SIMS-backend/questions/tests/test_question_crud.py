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
from questions.models import Question, QuestionTypeChoices, Tag

User = get_user_model()

pytestmark = pytest.mark.django_db


_counter = 0


def create_lecturer():
    global _counter
    _counter += 1
    email = f"lecturer{_counter}@example.com"
    identifier = f"L{_counter:03d}"
    user = User.objects.create_user(email=email, password="strongpass123", role=RoleChoices.LECTURER)
    lecturer = Lecturer.objects.create(user=user, faculty_identifier=identifier)
    return user, lecturer


def create_admin():
    global _counter
    _counter += 1
    email = f"admin{_counter}@example.com"
    return User.objects.create_user(email=email, password="strongpass123", role=RoleChoices.ADMIN)


def auth_client(client, user):
    login_response = client.post(
        reverse("auth_login"),
        {"email": user.email, "password": "strongpass123"},
        content_type="application/json",
    )
    assert login_response.status_code == status.HTTP_200_OK
    return login_response.json()["access"]


def setup_exam(lecturer=None):
    uni = University.objects.create(name=f"Test Uni {_counter}", code=f"TU{_counter}")
    col = College.objects.create(university=uni, name=f"Test Col {_counter}", code=f"TC{_counter}")
    dept = Department.objects.create(college=col, name=f"Test Dept {_counter}", code=f"TD{_counter}")
    prog = Program.objects.create(department=dept, name=f"Test Prog {_counter}", code=f"TP{_counter}", degree_level=DegreeLevelChoices.BACHELOR)
    course = Course.objects.create(program=prog, title=f"Test Course {_counter}", course_code=f"TC{_counter}", credit_hours=3)
    if lecturer is None:
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


LIST_URL = reverse("question_list")


def test_create_question_succeeds(client):
    lecturer_user, lecturer = create_lecturer()
    token = auth_client(client, lecturer_user)
    exam = setup_exam()

    data = {
        "examination": str(exam.pk),
        "question_text": "What is 2+2?",
        "question_type": "MCQ",
        "total_points": "5.00",
    }
    response = client.post(
        LIST_URL,
        data,
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["question_text"] == "What is 2+2?"
    assert response.json()["question_type"] == "MCQ"


def test_create_question_with_tags(client):
    lecturer_user, lecturer = create_lecturer()
    token = auth_client(client, lecturer_user)
    exam = setup_exam()

    tag1 = Tag.objects.create(name="algebra")
    tag2 = Tag.objects.create(name="calculus")

    data = {
        "examination": str(exam.pk),
        "question_text": "Solve for x: 2x + 3 = 7",
        "question_type": "SHORT_ANSWER",
        "total_points": "10.00",
        "tag_ids": [str(tag1.pk), str(tag2.pk)],
    }
    response = client.post(
        LIST_URL,
        data,
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert len(response.json()["tags"]) == 2


def test_create_question_auto_sets_creator(client):
    lecturer_user, lecturer = create_lecturer()
    token = auth_client(client, lecturer_user)
    exam = setup_exam()

    data = {
        "examination": str(exam.pk),
        "question_text": "What is the capital of France?",
        "question_type": "MCQ",
        "total_points": "5.00",
    }
    response = client.post(
        LIST_URL,
        data,
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["creator"] == str(lecturer.pk)


def test_lecturer_can_read_own_questions(client):
    lecturer_user, lecturer = create_lecturer()
    token = auth_client(client, lecturer_user)
    exam = setup_exam(lecturer=lecturer)

    Question.objects.create(
        examination=exam,
        creator=lecturer,
        question_text="Lecturer Q",
        question_type=QuestionTypeChoices.MCQ,
        total_points=5.00,
    )

    response = client.get(LIST_URL, HTTP_AUTHORIZATION=f"Bearer {token}")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1


def test_duplicate_question_warning(client):
    lecturer_user, lecturer = create_lecturer()
    token = auth_client(client, lecturer_user)
    exam = setup_exam()

    data = {
        "examination": str(exam.pk),
        "question_text": "What is the capital of France? Paris is the capital.",
        "question_type": "MCQ",
        "total_points": "5.00",
    }
    response = client.post(
        LIST_URL,
        data,
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED

    data["question_text"] = "What is the capital of France? Paris is the capital city."
    response = client.post(
        LIST_URL,
        data,
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert "warnings" in response.json()


def test_question_list_filter_by_examination(client):
    admin = create_admin()
    token = auth_client(client, admin)
    exam = setup_exam()

    Question.objects.create(
        examination=exam, creator=exam.lecturer,
        question_text="Q1", question_type=QuestionTypeChoices.MCQ, total_points=5.00,
    )

    response = client.get(
        LIST_URL,
        {"examination": str(exam.pk)},
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1


def test_question_detail(client):
    admin = create_admin()
    token = auth_client(client, admin)
    exam = setup_exam()

    question = Question.objects.create(
        examination=exam, creator=exam.lecturer,
        question_text="Detail Q", question_type=QuestionTypeChoices.MCQ, total_points=5.00,
    )

    url = reverse("question_detail", kwargs={"pk": question.pk})
    response = client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["question_text"] == "Detail Q"


def test_question_update(client):
    admin = create_admin()
    token = auth_client(client, admin)
    exam = setup_exam()

    question = Question.objects.create(
        examination=exam, creator=exam.lecturer,
        question_text="Old", question_type=QuestionTypeChoices.MCQ, total_points=5.00,
    )

    url = reverse("question_detail", kwargs={"pk": question.pk})
    response = client.put(
        url,
        {"examination": str(exam.pk), "question_text": "Updated", "question_type": "MCQ", "total_points": "10.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["question_text"] == "Updated"


def test_question_partial_update(client):
    admin = create_admin()
    token = auth_client(client, admin)
    exam = setup_exam()

    question = Question.objects.create(
        examination=exam, creator=exam.lecturer,
        question_text="Partial", question_type=QuestionTypeChoices.MCQ, total_points=5.00,
    )

    url = reverse("question_detail", kwargs={"pk": question.pk})
    response = client.patch(
        url,
        {"question_text": "Partially Updated"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["question_text"] == "Partially Updated"


def test_question_delete(client):
    """Delete now performs a soft-delete (§9.3): sets is_active=False, returns 200."""
    admin = create_admin()
    token = auth_client(client, admin)
    exam = setup_exam()

    question = Question.objects.create(
        examination=exam, creator=exam.lecturer,
        question_text="Delete me", question_type=QuestionTypeChoices.MCQ, total_points=5.00,
    )

    url = reverse("question_detail", kwargs={"pk": question.pk})
    response = client.delete(url, HTTP_AUTHORIZATION=f"Bearer {token}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["is_active"] is False
    # Record still exists but is deactivated
    question.refresh_from_db()
    assert question.is_active is False
    assert Question.objects.filter(pk=question.pk).exists()


def test_non_admin_cannot_create(client):
    student = User.objects.create_user(email="s@example.com", password="strongpass123", role=RoleChoices.STUDENT)
    token = auth_client(client, student)

    response = client.post(
        LIST_URL,
        {"question_text": "test", "question_type": "MCQ", "total_points": "5.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
