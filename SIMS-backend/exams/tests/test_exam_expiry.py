from unittest.mock import patch

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
    Program,
    Semester,
    SemesterChoices,
    University,
)
from exams.models import ExamAttempt, ExamStatusChoices, Examination, StudentAnswer
from exams.tasks import close_expired_exams_and_grade, grade_exam_attempt
from questions.models import Question, QuestionOption, QuestionTypeChoices
from results.models import Result

User = get_user_model()

pytestmark = pytest.mark.django_db

_counter = 0


def create_lecturer():
    global _counter
    _counter += 1
    user = User.objects.create_user(
        email=f"lecturer{_counter}@aastu.edu.et",
        password="strongpass123",
        role=RoleChoices.LECTURER,
    )
    lecturer = Lecturer.objects.create(
        user=user, faculty_identifier=f"L{_counter:03d}"
    )
    return user, lecturer


def create_student():
    global _counter
    _counter += 1
    user = User.objects.create_user(
        email=f"student{_counter}@aastu.edu.et",
        password="strongpass123",
        role=RoleChoices.STUDENT,
    )
    student = Student.objects.create(
        user=user,
        student_identifier=f"S{_counter:03d}",
        class_standing="FRESHMAN",
    )
    return user, student


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


def make_exam(lecturer, offering=None, status_=ExamStatusChoices.DRAFT):
    offering = offering or make_course_offering()
    now = timezone.now()
    return Examination.objects.create(
        course_offering=offering,
        lecturer=lecturer,
        title="Midterm",
        status=status_,
        start_window=now - timezone.timedelta(hours=2),
        end_window=now + timezone.timedelta(hours=1),
        duration_minutes=60,
    )


def activate(exam):
    exam.status = ExamStatusChoices.ACTIVE
    exam.save(update_fields=["status", "updated_at"])
    return exam


def make_mcq(exam, lecturer, points=5.0):
    question = Question.objects.create(
        examination=exam,
        creator=lecturer,
        question_text="What is 2+2?",
        question_type=QuestionTypeChoices.MCQ,
        total_points=points,
    )
    QuestionOption.objects.create(question=question, option_text="4", is_correct=True)
    QuestionOption.objects.create(question=question, option_text="5", is_correct=False)
    return question


def make_attempt(student, exam, start_time=None):
    return ExamAttempt.objects.create(
        examination=exam, student=student, start_time=start_time or timezone.now()
    )


def auth_client(client, user):
    login_response = client.post(
        reverse("auth_login"),
        {"email": user.email, "password": "strongpass123"},
        content_type="application/json",
    )
    assert login_response.status_code == status.HTTP_200_OK
    return login_response.json()["access"]


# ── sweep: close expired examinations ────────────────────────────────────


def test_sweep_closes_expired_exam():
    lecturer_user, lecturer = create_lecturer()
    now = timezone.now()
    exam = Examination.objects.create(
        course_offering=make_course_offering(),
        lecturer=lecturer,
        title="Midterm",
        status=ExamStatusChoices.ACTIVE,
        start_window=now - timezone.timedelta(hours=2),
        end_window=now - timezone.timedelta(minutes=1),
        duration_minutes=60,
    )

    close_expired_exams_and_grade()

    exam.refresh_from_db()
    assert exam.status == ExamStatusChoices.CLOSED


def test_sweep_does_not_close_exam_within_window():
    lecturer_user, lecturer = create_lecturer()
    now = timezone.now()
    exam = Examination.objects.create(
        course_offering=make_course_offering(),
        lecturer=lecturer,
        title="Midterm",
        status=ExamStatusChoices.ACTIVE,
        start_window=now - timezone.timedelta(hours=2),
        end_window=now + timezone.timedelta(hours=1),
        duration_minutes=60,
    )

    close_expired_exams_and_grade()

    exam.refresh_from_db()
    assert exam.status == ExamStatusChoices.ACTIVE


def test_sweep_does_not_touch_non_active_exams():
    lecturer_user, lecturer = create_lecturer()
    now = timezone.now()
    closed = Examination.objects.create(
        course_offering=make_course_offering(),
        lecturer=lecturer,
        title="Closed",
        status=ExamStatusChoices.CLOSED,
        start_window=now - timezone.timedelta(hours=2),
        end_window=now - timezone.timedelta(minutes=1),
        duration_minutes=60,
    )
    scheduled = Examination.objects.create(
        course_offering=make_course_offering(),
        lecturer=lecturer,
        title="Scheduled",
        status=ExamStatusChoices.SCHEDULED,
        start_window=now - timezone.timedelta(hours=2),
        end_window=now - timezone.timedelta(minutes=1),
        duration_minutes=60,
    )

    close_expired_exams_and_grade()

    closed.refresh_from_db()
    scheduled.refresh_from_db()
    assert closed.status == ExamStatusChoices.CLOSED
    assert scheduled.status == ExamStatusChoices.SCHEDULED


# ── sweep: grade abandoned attempts ──────────────────────────────────────


@patch("exams.tasks.grade_exam_attempt.delay")
def test_sweep_freezes_and_grades_abandoned_attempt(mock_delay):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    exam = make_exam(lecturer)
    # started 2h ago, exam window (1h) and duration (60m) both long expired
    attempt = make_attempt(student, exam, start_time=timezone.now() - timezone.timedelta(hours=2))
    expected_deadline = min(
        exam.end_window,
        attempt.start_time + timezone.timedelta(minutes=exam.duration_minutes),
    )

    close_expired_exams_and_grade()

    attempt.refresh_from_db()
    assert attempt.submission_time == expected_deadline
    mock_delay.assert_called_once_with(str(attempt.pk))


@patch("exams.tasks.grade_exam_attempt.delay")
def test_sweep_skips_attempt_within_deadline(mock_delay):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    exam = make_exam(lecturer)
    # started 10 min ago, 60 min duration → deadline still in the future
    attempt = make_attempt(student, exam, start_time=timezone.now() - timezone.timedelta(minutes=10))

    close_expired_exams_and_grade()

    attempt.refresh_from_db()
    assert attempt.submission_time is None
    mock_delay.assert_not_called()


@patch("exams.tasks.grade_exam_attempt.delay")
def test_sweep_skips_submitted_attempt(mock_delay):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    exam = make_exam(lecturer)
    attempt = make_attempt(student, exam, start_time=timezone.now() - timezone.timedelta(hours=2))
    attempt.submission_time = timezone.now() - timezone.timedelta(minutes=30)
    attempt.save()

    close_expired_exams_and_grade()

    attempt.refresh_from_db()
    assert attempt.submission_time is not None
    mock_delay.assert_not_called()


@patch("exams.tasks.grade_exam_attempt.delay", side_effect=lambda pk: grade_exam_attempt(pk))
def test_sweep_grades_abandoned_attempt_end_to_end(mock_delay):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    exam = make_exam(lecturer)
    mcq = make_mcq(exam, lecturer)
    activate(exam)
    attempt = make_attempt(student, exam, start_time=timezone.now() - timezone.timedelta(hours=2))
    correct = QuestionOption.objects.get(question=mcq, is_correct=True)
    StudentAnswer.objects.create(
        exam_attempt=attempt, question=mcq, selected_option=correct
    )

    close_expired_exams_and_grade()

    attempt.refresh_from_db()
    assert attempt.grading_status == ExamAttempt.GradingStatusChoices.GRADING_COMPLETE
    result = Result.objects.get(exam_attempt=attempt)
    assert float(result.final_score) == 5.0
    assert result.certified_by_id == lecturer.pk


@patch("exams.tasks.grade_exam_attempt.delay", side_effect=lambda pk: grade_exam_attempt(pk))
def test_sweep_is_idempotent(mock_delay):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    exam = make_exam(lecturer)
    make_mcq(exam, lecturer)
    activate(exam)
    attempt = make_attempt(student, exam, start_time=timezone.now() - timezone.timedelta(hours=2))

    close_expired_exams_and_grade()
    attempt.refresh_from_db()
    first_freeze = attempt.submission_time
    close_expired_exams_and_grade()

    attempt.refresh_from_db()
    assert attempt.submission_time == first_freeze
    assert Result.objects.filter(exam_attempt=attempt).count() == 1
    assert mock_delay.call_count == 1


# ── autosave rejected after the deadline ─────────────────────────────────


def test_autosave_rejected_after_deadline(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    now = timezone.now()
    exam = Examination.objects.create(
        course_offering=make_course_offering(),
        lecturer=lecturer,
        title="Midterm",
        status=ExamStatusChoices.DRAFT,
        start_window=now - timezone.timedelta(hours=2),
        end_window=now - timezone.timedelta(minutes=1),
        duration_minutes=60,
    )
    q = make_mcq(exam, lecturer)
    activate(exam)
    attempt = ExamAttempt.objects.create(
        examination=exam,
        student=student,
        start_time=now - timezone.timedelta(hours=2),
    )

    response = client.put(
        reverse("answer_upsert", kwargs={"attempt_pk": attempt.pk, "question_pk": q.pk}),
        {},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "expired" in response.json()["detail"].lower()
    assert StudentAnswer.objects.filter(exam_attempt=attempt).count() == 0


def test_autosave_allowed_before_deadline(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    exam = make_exam(lecturer)
    q = make_mcq(exam, lecturer)
    activate(exam)
    attempt = make_attempt(student, exam, start_time=timezone.now() - timezone.timedelta(minutes=10))

    response = client.put(
        reverse("answer_upsert", kwargs={"attempt_pk": attempt.pk, "question_pk": q.pk}),
        {"selected_option": str(QuestionOption.objects.get(question=q, is_correct=True).pk)},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert StudentAnswer.objects.filter(exam_attempt=attempt, question=q).count() == 1
