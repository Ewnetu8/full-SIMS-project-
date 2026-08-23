import pytest
from django.urls import reverse
from rest_framework import status

from notifications.models import Notification

from results.models import Assessment, Mark
from results.tests.helpers import (
    assign,
    assessment_list_url,
    auth_client,
    enroll,
    make_admin,
    make_assessment,
    make_course_offering,
    make_lecturer,
    make_student,
)

pytestmark = pytest.mark.django_db


def test_lecturer_can_create_assessment(client):
    _, lecturer = make_lecturer()
    offering = make_course_offering()
    assign(lecturer, offering)
    token = auth_client(client, lecturer.user)

    response = client.post(
        assessment_list_url(offering),
        {
            "title": "Test 1",
            "assessment_type": "TEST",
            "max_marks": "30.00",
            "weight": "30.00",
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == "Test 1"
    assert data["created_by"] == str(lecturer.pk)
    assert Assessment.objects.filter(course_offering=offering, title="Test 1").exists()


def test_unassigned_lecturer_cannot_create(client):
    _, lecturer = make_lecturer()
    _, other = make_lecturer()
    offering = make_course_offering()
    assign(other, offering)
    token = auth_client(client, lecturer.user)

    response = client.post(
        assessment_list_url(offering),
        {"title": "Quiz", "weight": "10.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_student_cannot_create(client):
    _, student = make_student()
    offering = make_course_offering()
    token = auth_client(client, student.user)

    response = client.post(
        assessment_list_url(offering),
        {"title": "Hack", "weight": "10.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_duplicate_title_rejected(client):
    _, lecturer = make_lecturer()
    offering = make_course_offering()
    assign(lecturer, offering)
    make_assessment(offering, lecturer, title="Test 1")
    token = auth_client(client, lecturer.user)

    response = client.post(
        assessment_list_url(offering),
        {"title": "Test 1", "weight": "10.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_weight_over_100_rejected(client):
    _, lecturer = make_lecturer()
    offering = make_course_offering()
    assign(lecturer, offering)
    make_assessment(offering, lecturer, title="Test 1", weight="60.00")
    token = auth_client(client, lecturer.user)

    response = client.post(
        assessment_list_url(offering),
        {"title": "Assignment 1", "assessment_type": "ASSIGNMENT", "weight": "50.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "weight" in response.json()


def test_weight_update_over_limit_rejected(client):
    _, lecturer = make_lecturer()
    offering = make_course_offering()
    assign(lecturer, offering)
    make_assessment(offering, lecturer, title="Test 1", weight="70.00")
    assignment = make_assessment(
        offering, lecturer, title="Assignment 1", assessment_type="ASSIGNMENT", weight="20.00"
    )
    token = auth_client(client, lecturer.user)

    response = client.patch(
        reverse("assessment_detail", args=[assignment.pk]),
        {"weight": "40.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_student_sees_only_published(client):
    _, student = make_student()
    offering = make_course_offering()
    enroll(student, offering)
    _, lecturer = make_lecturer()
    assign(lecturer, offering)
    published = make_assessment(offering, lecturer, title="Published Test", is_published=True)
    make_assessment(offering, lecturer, title="Hidden Test", is_published=False)
    token = auth_client(client, student.user)

    response = client.get(
        assessment_list_url(offering), HTTP_AUTHORIZATION=f"Bearer {token}"
    )
    assert response.status_code == status.HTTP_200_OK
    titles = [item["title"] for item in response.json()]
    assert titles == ["Published Test"]

    detail_response = client.get(
        reverse("assessment_detail", args=[published.pk]),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert detail_response.status_code == status.HTTP_200_OK


def test_publishing_notifies_enrolled_students(client):
    _, student = make_student()
    offering = make_course_offering()
    enrollment = enroll(student, offering)
    _, lecturer = make_lecturer()
    assign(lecturer, offering)
    assessment = make_assessment(offering, lecturer, is_published=False)
    before = Notification.objects.filter(recipient=student.user).count()
    token = auth_client(client, lecturer.user)

    response = client.patch(
        reverse("assessment_detail", args=[assessment.pk]),
        {"is_published": True},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    after = Notification.objects.filter(recipient=student.user).count()
    assert after == before + 1
    enrollment.refresh_from_db()


def test_delete_blocked_when_marks_exist(client):
    _, lecturer = make_lecturer()
    _, student = make_student()
    offering = make_course_offering()
    assign(lecturer, offering)
    enrollment = enroll(student, offering)
    assessment = make_assessment(offering, lecturer)
    Mark.objects.create(assessment=assessment, enrollment=enrollment, score="20.00")
    token = auth_client(client, lecturer.user)

    response = client.delete(
        reverse("assessment_detail", args=[assessment.pk]),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_409_CONFLICT


def test_admin_bypasses_assignment_check(client):
    admin = make_admin()
    offering = make_course_offering()
    token = auth_client(client, admin)

    response = client.post(
        assessment_list_url(offering),
        {"title": "Admin Made Test", "weight": "25.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED
