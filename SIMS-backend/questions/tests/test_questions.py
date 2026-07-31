import pytest
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User, RoleChoices, Lecturer, Student
from academics.models import Department, College, University, Course
from exams.models import Examination, StudentAnswer
from questions.models import Question, QuestionTypeChoices


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def setup_data(db):
    university = University.objects.create(name="Test Univ", code="TU")
    college = College.objects.create(university=university, name="Engineering", code="ENG")
    dept = Department.objects.create(college=college, name="Computer Science", code="CS")

    # Lecturer user
    lecturer_user = User.objects.create_user(
        email="lecturer@test.com",
        password="password123",
        role=RoleChoices.LECTURER,
    )
    lecturer = Lecturer.objects.create(
        user=lecturer_user,
        faculty_identifier="LEC-001",
        department=dept,
    )

    # Student user
    student_user = User.objects.create_user(
        email="student@test.com",
        password="password123",
        role=RoleChoices.STUDENT,
    )
    Student.objects.create(
        user=student_user,
        student_identifier="STU-001",
        department=dept,
    )

    # Admin user
    admin_user = User.objects.create_user(
        email="admin@test.com",
        password="password123",
        role=RoleChoices.ADMIN,
    )

    # Course & Examination — use correct Course field names from academics/models.py
    course = Course.objects.create(course_code="CS101", title="Intro to CS")
    examination = Examination.objects.create(
        course=course,
        lecturer=lecturer,
        title="Midterm Exam",
        start_window="2026-08-01T09:00:00Z",
        end_window="2026-08-01T11:00:00Z",
        duration_minutes=120,
    )

    return {
        "lecturer_user": lecturer_user,
        "lecturer": lecturer,
        "student_user": student_user,
        "admin_user": admin_user,
        "examination": examination,
    }


@pytest.mark.django_db
class TestQuestionsRBAC:
    """Verify that only LECTURERs (and ADMINs) can access Question endpoints."""

    def test_unauthenticated_cannot_list_questions(self, api_client):
        response = api_client.get("/api/v1/questions")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_student_is_forbidden_from_listing_questions(self, api_client, setup_data):
        api_client.force_authenticate(user=setup_data["student_user"])
        response = api_client.get("/api/v1/questions")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_student_is_forbidden_from_creating_questions(self, api_client, setup_data):
        api_client.force_authenticate(user=setup_data["student_user"])
        payload = {
            "examination": str(setup_data["examination"].id),
            "question_text": "Forbidden?",
            "question_type": QuestionTypeChoices.ESSAY,
            "total_points": "5.00",
        }
        response = api_client.post("/api/v1/questions", data=payload, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_lecturer_can_list_questions(self, api_client, setup_data):
        api_client.force_authenticate(user=setup_data["lecturer_user"])
        response = api_client.get("/api/v1/questions")
        assert response.status_code == status.HTTP_200_OK

    def test_admin_can_list_questions(self, api_client, setup_data):
        api_client.force_authenticate(user=setup_data["admin_user"])
        response = api_client.get("/api/v1/questions")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestQuestionSoftDelete:
    """SRS §9.3: no hard-delete when question is linked to an examination or student answers."""

    def _create_question(self, lecturer, examination=None, question_type=QuestionTypeChoices.ESSAY):
        return Question.objects.create(
            creator=lecturer,
            examination=examination,
            question_text="Sample question text for soft-delete test?",
            question_type=question_type,
            total_points=10,
        )

    def test_linked_question_is_soft_deleted_not_hard_deleted(self, api_client, setup_data):
        """DELETE on a question attached to an Examination must set is_active=False."""
        api_client.force_authenticate(user=setup_data["lecturer_user"])
        question = self._create_question(
            lecturer=setup_data["lecturer"],
            examination=setup_data["examination"],
        )

        response = api_client.delete(f"/api/v1/questions/{question.id}")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is False

        question.refresh_from_db()
        assert question.is_active is False
        # Question record still exists in DB (not hard-deleted)
        assert Question.objects.filter(id=question.id).exists()

    def test_unlinked_question_is_also_soft_deleted(self, api_client, setup_data):
        """Even unlinked questions must be soft-deleted for audit consistency."""
        api_client.force_authenticate(user=setup_data["lecturer_user"])
        question = self._create_question(lecturer=setup_data["lecturer"])

        response = api_client.delete(f"/api/v1/questions/{question.id}")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is False

        question.refresh_from_db()
        assert question.is_active is False
        assert Question.objects.filter(id=question.id).exists()

    def test_delete_nonexistent_question_returns_404(self, api_client, setup_data):
        api_client.force_authenticate(user=setup_data["lecturer_user"])
        import uuid
        response = api_client.delete(f"/api/v1/questions/{uuid.uuid4()}")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_student_cannot_delete_question(self, api_client, setup_data):
        question = self._create_question(lecturer=setup_data["lecturer"])
        api_client.force_authenticate(user=setup_data["student_user"])
        response = api_client.delete(f"/api/v1/questions/{question.id}")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        # Confirm question is still active
        question.refresh_from_db()
        assert question.is_active is True
