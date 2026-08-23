import pytest
from django.urls import reverse
from rest_framework import status

from results.models import Mark
from results.tests.helpers import (
    assign,
    auth_client,
    enroll,
    make_assessment,
    make_course_offering,
    make_lecturer,
    make_student,
    marks_url,
)

pytestmark = pytest.mark.django_db


def test_bulk_submit_marks(client):
    _, lecturer = make_lecturer()
    _, student_a = make_student()
    _, student_b = make_student()
    offering = make_course_offering()
    assign(lecturer, offering)
    enrollment_a = enroll(student_a, offering)
    enrollment_b = enroll(student_b, offering)
    assessment = make_assessment(offering, lecturer, title="Test 1", max_marks="30.00")
    token = auth_client(client, lecturer.user)

    response = client.post(
        marks_url(assessment),
        {
            "marks": [
                {"enrollment": str(enrollment_a.pk), "score": "28.50"},
                {"enrollment": str(enrollment_b.pk), "score": "15.00", "remarks": "late"},
            ]
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    rows = {row["student"]["student_identifier"]: row for row in response.json()}
    assert rows[student_a.student_identifier]["score"] == 28.5
    assert rows[student_b.student_identifier]["remarks"] == "late"

    assert Mark.objects.filter(assessment=assessment).count() == 2
    mark = Mark.objects.get(assessment=assessment, enrollment=enrollment_a)
    assert mark.entered_by == lecturer


def test_resubmission_upserts_instead_of_duplicating(client):
    _, lecturer = make_lecturer()
    _, student = make_student()
    offering = make_course_offering()
    assign(lecturer, offering)
    enrollment = enroll(student, offering)
    assessment = make_assessment(offering, lecturer, title="Test 1", max_marks="30.00")
    token = auth_client(client, lecturer.user)
    payload = {"marks": [{"enrollment": str(enrollment.pk), "score": "10.00"}]}
    first = client.post(
        marks_url(assessment),
        payload,
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert first.status_code == status.HTTP_200_OK

    payload["marks"][0]["score"] = "22.25"
    second = client.post(
        marks_url(assessment),
        payload,
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert second.status_code == status.HTTP_200_OK
    assert Mark.objects.filter(assessment=assessment, enrollment=enrollment).count() == 1
    assert Mark.objects.get(
        assessment=assessment, enrollment=enrollment
    ).score == 22.25


def test_invalid_row_rejects_whole_batch_atomically(client):
    _, lecturer = make_lecturer()
    _, student_a = make_student()
    _, student_b = make_student()
    other_offering = make_course_offering()
    offering = make_course_offering()
    assign(lecturer, offering)
    enrollment_a = enroll(student_a, offering)
    enroll(student_b, other_offering)  # not in this offering
    assessment = make_assessment(offering, lecturer, title="Test 1", max_marks="30.00")
    token = auth_client(client, lecturer.user)

    response = client.post(
        marks_url(assessment),
        {
            "marks": [
                {"enrollment": str(enrollment_a.pk), "score": "30.00"},
                {"enrollment": student_b.enrollments.first().pk, "score": "5.00"},
            ]
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    # Nothing was written (all-or-nothing).
    assert Mark.objects.filter(assessment=assessment).count() == 0


def test_score_above_max_rejected(client):
    _, lecturer = make_lecturer()
    _, student = make_student()
    offering = make_course_offering()
    assign(lecturer, offering)
    enrollment = enroll(student, offering)
    assessment = make_assessment(offering, lecturer, title="Test 1", max_marks="20.00")
    token = auth_client(client, lecturer.user)

    response = client.post(
        marks_url(assessment),
        {"marks": [{"enrollment": str(enrollment.pk), "score": "25.00"}]},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_dropped_student_rejected(client):
    _, lecturer = make_lecturer()
    _, student = make_student()
    offering = make_course_offering()
    assign(lecturer, offering)
    enrollment = enroll(student, offering, status="DROPPED")
    assessment = make_assessment(offering, lecturer, title="Test 1")
    token = auth_client(client, lecturer.user)

    response = client.post(
        marks_url(assessment),
        {"marks": [{"enrollment": str(enrollment.pk), "score": "10.00"}]},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_unassigned_lecturer_cannot_submit_marks(client):
    _, intruder = make_lecturer()
    _, owner = make_lecturer()
    _, student = make_student()
    offering = make_course_offering()
    assign(owner, offering)
    enrollment = enroll(student, offering)
    assessment = make_assessment(offering, owner, title="Test 1")
    token = auth_client(client, intruder.user)

    response = client.post(
        marks_url(assessment),
        {"marks": [{"enrollment": str(enrollment.pk), "score": "10.00"}]},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_single_mark_edit_and_bounds(client):
    _, lecturer = make_lecturer()
    _, student = make_student()
    offering = make_course_offering()
    assign(lecturer, offering)
    enrollment = enroll(student, offering)
    assessment = make_assessment(offering, lecturer, title="Test 1", max_marks="20.00")
    mark = Mark.objects.create(assessment=assessment, enrollment=enrollment, score="5.00")
    token = auth_client(client, lecturer.user)

    ok = client.patch(
        reverse("mark_detail", args=[mark.pk]),
        {"score": "18.75", "remarks": "improved"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert ok.status_code == status.HTTP_200_OK
    assert ok.json()["score"] == "18.75"

    too_high = client.patch(
        reverse("mark_detail", args=[mark.pk]),
        {"score": "21.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert too_high.status_code == status.HTTP_400_BAD_REQUEST

    student_token = auth_client(client, student.user)
    forbidden = client.patch(
        reverse("mark_detail", args=[mark.pk]),
        {"score": "1.00"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {student_token}",
    )
    assert forbidden.status_code == status.HTTP_403_FORBIDDEN


def test_my_marks_shows_published_only_and_running_total(client):
    _, lecturer = make_lecturer()
    _, student = make_student()
    offering = make_course_offering()
    assign(lecturer, offering)
    enroll(student, offering)
    published = make_assessment(
        offering, lecturer, title="Test 1", weight="40.00", max_marks="40.00", is_published=True
    )
    hidden = make_assessment(
        offering,
        lecturer,
        title="Assignment 1",
        assessment_type="ASSIGNMENT",
        weight="20.00",
        max_marks="20.00",
        is_published=False,
    )

    enrollment = student.enrollments.first()
    Mark.objects.create(assessment=published, enrollment=enrollment, score="36.00")  # 90%
    Mark.objects.create(assessment=hidden, enrollment=enrollment, score="20.00")

    token = auth_client(client, student.user)
    response = client.get(reverse("my_marks"), HTTP_AUTHORIZATION=f"Bearer {token}")
    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert len(payload) == 1
    entry = payload[0]
    titles = [a["title"] for a in entry["assessments"]]
    assert titles == ["Test 1"]
    # Total over published assessments only: 36/40 * 100 = 90 → A
    assert entry["total_percent"] == 90.0
    assert entry["letter_grade"] == "A"
