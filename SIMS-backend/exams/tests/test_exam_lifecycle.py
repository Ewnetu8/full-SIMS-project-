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
    EnrollmentStatusChoices,
    Program,
    Semester,
    SemesterChoices,
    University,
)
from exams.models import ExamAttempt, ExamStatusChoices, Examination
from exams.services import sync_examination_lifecycle, sync_single_exam_status
from exams.tasks import close_expired_exams_and_grade
from questions.models import Question, QuestionOption, QuestionTypeChoices

User = get_user_model()
pytestmark = pytest.mark.django_db

_counter = 0


def create_lecturer():
    global _counter
    _counter += 1
    email = f"lecturer_lc{_counter}@aastu.edu.et"
    identifier = f"L_LC{_counter:03d}"
    user = User.objects.create_user(
        email=email, password="strongpass123", role=RoleChoices.LECTURER
    )
    lecturer = Lecturer.objects.create(user=user, faculty_identifier=identifier)
    return user, lecturer


def create_student():
    global _counter
    _counter += 1
    email = f"student_lc{_counter}@aastu.edu.et"
    identifier = f"ATR/LC{_counter:03d}/14"
    user = User.objects.create_user(
        email=email, password="strongpass123", role=RoleChoices.STUDENT
    )
    student = Student.objects.create(user=user, student_identifier=identifier)
    return user, student


def auth_client(client, user):
    from rest_framework_simplejwt.tokens import RefreshToken
    return str(RefreshToken.for_user(user).access_token)


def make_course_offering():
    global _counter
    _counter += 1
    uni = University.objects.create(name=f"LC Uni {_counter}", code=f"LCU{_counter}")
    col = College.objects.create(
        university=uni, name=f"LC Col {_counter}", code=f"LCC{_counter}"
    )
    dept = Department.objects.create(
        college=col, name=f"LC Dept {_counter}", code=f"LCD{_counter}"
    )
    prog = Program.objects.create(
        department=dept,
        name=f"LC Prog {_counter}",
        code=f"LCP{_counter}",
        degree_level=DegreeLevelChoices.BACHELOR,
    )
    course = Course.objects.create(
        program=prog,
        title=f"LC Course {_counter}",
        course_code=f"LCC{_counter}",
        credit_hours=3,
    )
    academic_year = AcademicYear.objects.create(
        display_label=f"2026-LC{_counter}",
        start_boundary="2026-01-01",
        end_boundary="2026-12-31",
    )
    semester = Semester.objects.create(
        academic_year=academic_year, semester_index=SemesterChoices.FIRST
    )
    return CourseOffering.objects.create(course=course, semester=semester)


def enroll(student_profile, offering):
    return Enrollment.objects.create(
        student=student_profile,
        course_offering=offering,
        status=EnrollmentStatusChoices.ENROLLED,
    )


def make_mcq_exam(offering, lecturer_profile, start_window, end_window, status_value=ExamStatusChoices.SCHEDULED):
    exam = Examination.objects.create(
        course_offering=offering,
        lecturer=lecturer_profile,
        title="Lifecycle Test Exam",
        start_window=start_window,
        end_window=end_window,
        duration_minutes=60,
        status=status_value,
    )
    q = Question.objects.create(
        examination=exam,
        creator=lecturer_profile,
        question_text="What is 2 + 2?",
        question_type=QuestionTypeChoices.MCQ,
        total_points=5.0,
    )
    QuestionOption.objects.create(question=q, option_text="3", is_correct=False)
    QuestionOption.objects.create(question=q, option_text="4", is_correct=True)
    return exam


def test_scheduled_exam_becomes_active_and_visible_when_start_window_reached(client):
    now = timezone.now()
    student_user, student_profile = create_student()
    lecturer_user, lecturer_profile = create_lecturer()
    offering = make_course_offering()
    enroll(student_profile, offering)

    # Exam was scheduled to start 10 minutes ago, ends in 50 minutes
    exam = make_mcq_exam(
        offering=offering,
        lecturer_profile=lecturer_profile,
        start_window=now - timezone.timedelta(minutes=10),
        end_window=now + timezone.timedelta(minutes=50),
        status_value=ExamStatusChoices.SCHEDULED,
    )

    token = auth_client(client, student_user)

    # When student queries active exams, the backend lifecycle sync transitions it to ACTIVE
    response = client.get(
        reverse("student_active_exams"),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    exam_ids = [item["id"] for item in response.json()]
    assert str(exam.pk) in exam_ids

    # Refresh from database and verify status is now ACTIVE
    exam.refresh_from_db()
    assert exam.status == ExamStatusChoices.ACTIVE


def test_scheduled_exam_can_be_started_when_start_window_reached(client):
    now = timezone.now()
    student_user, student_profile = create_student()
    lecturer_user, lecturer_profile = create_lecturer()
    offering = make_course_offering()
    enroll(student_profile, offering)

    exam = make_mcq_exam(
        offering=offering,
        lecturer_profile=lecturer_profile,
        start_window=now - timezone.timedelta(minutes=5),
        end_window=now + timezone.timedelta(minutes=55),
        status_value=ExamStatusChoices.SCHEDULED,
    )

    token = auth_client(client, student_user)

    response = client.post(
        reverse("exam_start", kwargs={"pk": str(exam.pk)}),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "attempt" in data
    assert "id" in data["attempt"]
    assert data["attempt"]["grading_status"] == "GRADING_PENDING"

    exam.refresh_from_db()
    assert exam.status == ExamStatusChoices.ACTIVE


def test_active_exam_becomes_closed_when_window_expired():
    now = timezone.now()
    lecturer_user, lecturer_profile = create_lecturer()
    offering = make_course_offering()

    exam = make_mcq_exam(
        offering=offering,
        lecturer_profile=lecturer_profile,
        start_window=now - timezone.timedelta(hours=2),
        end_window=now - timezone.timedelta(minutes=10),
        status_value=ExamStatusChoices.SCHEDULED,
    )
    exam.status = ExamStatusChoices.ACTIVE
    exam.save(update_fields=["status"])

    sync_examination_lifecycle(now)
    exam.refresh_from_db()
    assert exam.status == ExamStatusChoices.CLOSED


def test_celery_task_sweeps_and_activates_scheduled_exams():
    now = timezone.now()
    lecturer_user, lecturer_profile = create_lecturer()
    offering = make_course_offering()

    exam = make_mcq_exam(
        offering=offering,
        lecturer_profile=lecturer_profile,
        start_window=now - timezone.timedelta(minutes=1),
        end_window=now + timezone.timedelta(minutes=59),
        status_value=ExamStatusChoices.SCHEDULED,
    )

    close_expired_exams_and_grade()
    exam.refresh_from_db()
    assert exam.status == ExamStatusChoices.ACTIVE
