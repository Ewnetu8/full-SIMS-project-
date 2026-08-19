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
from exams.models import ExamStatusChoices, Examination

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


def enroll(student, offering):
    return Enrollment.objects.create(student=student, course_offering=offering)


def make_exam(
    offering,
    status_value=ExamStatusChoices.DRAFT,
    now=None,
    start_window=None,
    end_window=None,
):
    now = now or timezone.now()
    return Examination.objects.create(
        course_offering=offering,
        lecturer=Lecturer.objects.first(),
        title="Midterm",
        status=status_value,
        start_window=start_window or (now + timezone.timedelta(hours=1)),
        end_window=end_window or (now + timezone.timedelta(hours=3)),
        duration_minutes=120,
    )


def schedule_payload(now=None):
    now = now or timezone.now()
    return {
        "start_window": (now + timezone.timedelta(hours=1)).isoformat(),
        "end_window": (now + timezone.timedelta(hours=3)).isoformat(),
        "duration_minutes": 120,
    }


def test_schedule_moves_draft_to_scheduled(client):
    lecturer_user, _ = create_lecturer()
    token = auth_client(client, lecturer_user)
    offering = make_course_offering()
    exam = make_exam(offering)

    response = client.post(
        reverse("examination_schedule", kwargs={"pk": exam.pk}),
        schedule_payload(),
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    exam.refresh_from_db()
    assert exam.status == ExamStatusChoices.SCHEDULED
    assert response.json()["status"] == ExamStatusChoices.SCHEDULED


def test_schedule_rejects_past_start_window(client):
    lecturer_user, _ = create_lecturer()
    token = auth_client(client, lecturer_user)
    offering = make_course_offering()
    exam = make_exam(offering)
    now = timezone.now()

    payload = schedule_payload(now)
    payload["start_window"] = (now - timezone.timedelta(hours=1)).isoformat()
    response = client.post(
        reverse("examination_schedule", kwargs={"pk": exam.pk}),
        payload,
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    exam.refresh_from_db()
    assert exam.status == ExamStatusChoices.DRAFT


def test_schedule_rejects_end_before_start(client):
    lecturer_user, _ = create_lecturer()
    token = auth_client(client, lecturer_user)
    offering = make_course_offering()
    exam = make_exam(offering)
    now = timezone.now()

    payload = schedule_payload(now)
    payload["end_window"] = payload["start_window"]
    response = client.post(
        reverse("examination_schedule", kwargs={"pk": exam.pk}),
        payload,
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_schedule_rejects_zero_duration(client):
    lecturer_user, _ = create_lecturer()
    token = auth_client(client, lecturer_user)
    offering = make_course_offering()
    exam = make_exam(offering)

    payload = schedule_payload()
    payload["duration_minutes"] = 0
    response = client.post(
        reverse("examination_schedule", kwargs={"pk": exam.pk}),
        payload,
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_schedule_rejects_exam_not_in_draft(client):
    lecturer_user, _ = create_lecturer()
    token = auth_client(client, lecturer_user)
    offering = make_course_offering()
    exam = make_exam(offering, status_value=ExamStatusChoices.SCHEDULED)

    response = client.post(
        reverse("examination_schedule", kwargs={"pk": exam.pk}),
        schedule_payload(),
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_schedule_requires_lecturer(client):
    lecturer_user, _ = create_lecturer()
    student_user, _ = create_student()
    token = auth_client(client, student_user)
    offering = make_course_offering()
    exam = make_exam(offering)

    response = client.post(
        reverse("examination_schedule", kwargs={"pk": exam.pk}),
        schedule_payload(),
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_student_sees_only_own_active_exams(client):
    lecturer_user, _ = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    now = timezone.now()

    own_offering = make_course_offering()
    enroll(student, own_offering)
    active_exam = make_exam(
        own_offering,
        status_value=ExamStatusChoices.ACTIVE,
        now=now,
        start_window=now - timezone.timedelta(hours=1),
        end_window=now + timezone.timedelta(hours=1),
    )

    other_offering = make_course_offering()
    not_enrolled_exam = make_exam(
        other_offering,
        status_value=ExamStatusChoices.ACTIVE,
        now=now,
        start_window=now - timezone.timedelta(hours=1),
        end_window=now + timezone.timedelta(hours=1),
    )

    too_early = make_exam(
        own_offering,
        status_value=ExamStatusChoices.ACTIVE,
        now=now,
        start_window=now + timezone.timedelta(hours=1),
        end_window=now + timezone.timedelta(hours=2),
    )

    scheduled_not_active = make_exam(
        own_offering, status_value=ExamStatusChoices.SCHEDULED, now=now
    )

    response = client.get(
        reverse("student_active_exams"), HTTP_AUTHORIZATION=f"Bearer {token}"
    )
    assert response.status_code == status.HTTP_200_OK
    ids = {item["id"] for item in response.json()}
    assert str(active_exam.pk) in ids
    assert str(not_enrolled_exam.pk) not in ids
    assert str(too_early.pk) not in ids
    assert str(scheduled_not_active.pk) not in ids


def test_student_active_exams_requires_student_profile(client):
    lecturer_user, _ = create_lecturer()
    token = auth_client(client, lecturer_user)

    response = client.get(
        reverse("student_active_exams"), HTTP_AUTHORIZATION=f"Bearer {token}"
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
