from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework import status

from academics.models import EnrollmentStatusChoices
from results.services import get_letter_grade, get_offering_totals

from results.tests.helpers import (
    assign,
    auth_client,
    enroll,
    make_admin,
    make_assessment,
    make_course_offering,
    make_lecturer,
    make_student,
)

pytestmark = pytest.mark.django_db


def test_letter_grade_boundaries():
    assert get_letter_grade(Decimal("95.00")) == "A"
    assert get_letter_grade(Decimal("85.00")) == "A"
    assert get_letter_grade(Decimal("84.99")) == "A-"
    assert get_letter_grade(Decimal("75.00")) == "B+"
    assert get_letter_grade(Decimal("60.00")) == "C+"
    assert get_letter_grade(Decimal("50.00")) == "C"
    assert get_letter_grade(Decimal("49.99")) == "C-"
    assert get_letter_grade(Decimal("35.00")) == "F"
    assert get_letter_grade(None) is None


def test_my_courses_lists_only_assigned_offerings(client):
    _, lecturer = make_lecturer()
    _, other = make_lecturer()
    mine = make_course_offering()
    theirs = make_course_offering()
    assign(lecturer, mine)
    assign(other, theirs)
    token = auth_client(client, lecturer.user)

    response = client.get(reverse("my_courses"), HTTP_AUTHORIZATION=f"Bearer {token}")
    assert response.status_code == status.HTTP_200_OK
    codes = [item["course_code"] for item in response.json()]
    assert mine.course.course_code in codes
    assert theirs.course.course_code not in codes


def test_teaching_assignment_admin_create_and_duplicate_guard(client):
    admin = make_admin()
    _, lecturer = make_lecturer()
    offering = make_course_offering()
    token = auth_client(client, admin)

    response = client.post(
        reverse("teaching_assignment_list"),
        {"lecturer": str(lecturer.pk), "course_offering": str(offering.pk)},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED

    duplicate = client.post(
        reverse("teaching_assignment_list"),
        {"lecturer": str(lecturer.pk), "course_offering": str(offering.pk)},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert duplicate.status_code == status.HTTP_400_BAD_REQUEST


def test_gradebook_totals_and_matrix(client):
    _, lecturer = make_lecturer()
    _, student_a = make_student()
    _, student_b = make_student()
    offering = make_course_offering()
    assign(lecturer, offering)
    enrollment_a = enroll(student_a, offering)
    enrollment_b = enroll(student_b, offering)

    test1 = make_assessment(offering, lecturer, title="Test 1", weight="30.00", max_marks="30.00")
    assignment = make_assessment(
        offering,
        lecturer,
        title="Assignment 1",
        assessment_type="ASSIGNMENT",
        weight="20.00",
        max_marks="20.00",
    )

    # A: full marks on both → 100%
    from results.models import Mark

    Mark.objects.create(assessment=test1, enrollment=enrollment_a, score="30.00")
    Mark.objects.create(assessment=assignment, enrollment=enrollment_a, score="20.00")
    # B: only half the test so far → normalized 50% over graded weight of 30
    Mark.objects.create(assessment=test1, enrollment=enrollment_b, score="15.00")

    totals = get_offering_totals(offering)
    assert totals[enrollment_a.pk]["total_percent"] == Decimal("100.00")
    assert totals[enrollment_a.pk]["letter_grade"] == "A"
    assert totals[enrollment_b.pk]["total_percent"] == Decimal("50.00")
    assert totals[enrollment_b.pk]["letter_grade"] == "C"

    token = auth_client(client, lecturer.user)
    response = client.get(
        reverse("offering_gradebook", args=[offering.pk]),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["assessments"]) == 2
    rows = {row["student"]["student_identifier"]: row for row in data["rows"]}
    assert rows[student_a.student_identifier]["total_percent"] == "100.00"
    assert rows[student_b.student_identifier]["total_percent"] == "50.00"
    assert rows[student_b.student_identifier]["marks"][str(test1.pk)] == "15.00"


def test_publish_writes_enrollment_grades_and_status(client):
    _, lecturer = make_lecturer()
    _, student_a = make_student()
    _, student_b = make_student()
    offering = make_course_offering()
    assign(lecturer, offering)
    enrollment_a = enroll(student_a, offering)
    enrollment_b = enroll(student_b, offering)

    test1 = make_assessment(offering, lecturer, title="Test 1", weight="50.00", max_marks="50.00", is_published=True)

    from results.models import Mark

    Mark.objects.create(assessment=test1, enrollment=enrollment_a, score="45.00")  # 90% → A, pass
    Mark.objects.create(assessment=test1, enrollment=enrollment_b, score="20.00")  # 40% → D, fail

    token = auth_client(client, lecturer.user)
    response = client.post(
        reverse("offering_publish_results", args=[offering.pk]),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK

    enrollment_a.refresh_from_db()
    enrollment_b.refresh_from_db()
    assert enrollment_a.grade == "A"
    assert enrollment_a.status == EnrollmentStatusChoices.PASSED
    assert enrollment_b.grade == "D"
    assert enrollment_b.status == EnrollmentStatusChoices.FAILED


def test_publish_requires_at_least_one_published_assessment(client):
    _, lecturer = make_lecturer()
    offering = make_course_offering()
    assign(lecturer, offering)
    make_assessment(offering, lecturer, is_published=False)
    token = auth_client(client, lecturer.user)

    response = client.post(
        reverse("offering_publish_results", args=[offering.pk]),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_unassigned_lecturer_cannot_view_gradebook(client):
    _, intruder = make_lecturer()
    offering = make_course_offering()
    token = auth_client(client, intruder.user)

    response = client.get(
        reverse("offering_gradebook", args=[offering.pk]),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
