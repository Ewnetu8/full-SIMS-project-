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
from exams.tasks import grade_exam_attempt, grade_question
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
        start_window=now - timezone.timedelta(hours=1),
        end_window=now + timezone.timedelta(hours=1),
        duration_minutes=60,
    )


def make_mcq(exam, lecturer, points=5.0, with_options=True):
    question = Question.objects.create(
        examination=exam,
        creator=lecturer,
        question_text="What is 2+2?",
        question_type=QuestionTypeChoices.MCQ,
        total_points=points,
    )
    if with_options:
        QuestionOption.objects.create(question=question, option_text="4", is_correct=True)
        QuestionOption.objects.create(question=question, option_text="5", is_correct=False)
    return question


def make_attempt(student, exam):
    return ExamAttempt.objects.create(
        examination=exam, student=student, start_time=timezone.now()
    )


def answer(attempt, question, selected_option=None, submitted_text=None):
    return StudentAnswer.objects.create(
        exam_attempt=attempt,
        question=question,
        selected_option=selected_option,
        submitted_text=submitted_text,
    )


# ── grade_question unit behaviour ──────────────────────────────────────


def test_mcq_correct_answer_awards_full_points():
    lecturer_user, lecturer = create_lecturer()
    exam = make_exam(lecturer)
    q = make_mcq(exam, lecturer)
    attempt = make_attempt(create_student()[1], exam)
    correct = QuestionOption.objects.get(question=q, is_correct=True)
    a = answer(attempt, q, selected_option=correct)

    assert grade_question(q, a) == 5.0


def test_mcq_wrong_or_unanswered_awards_zero():
    lecturer_user, lecturer = create_lecturer()
    exam = make_exam(lecturer)
    q = make_mcq(exam, lecturer)
    student = create_student()[1]
    wrong = QuestionOption.objects.get(question=q, is_correct=False)
    assert grade_question(q, answer(make_attempt(student, exam), q, selected_option=wrong)) == 0.0
    assert grade_question(q, answer(make_attempt(student, exam), q)) == 0.0


def test_short_answer_is_not_auto_gradable():
    lecturer_user, lecturer = create_lecturer()
    exam = make_exam(lecturer)
    q = Question.objects.create(
        examination=exam,
        creator=lecturer,
        question_text="Capital of France?",
        question_type=QuestionTypeChoices.SHORT_ANSWER,
        total_points=5.0,
    )
    student = create_student()[1]
    assert grade_question(q, answer(make_attempt(student, exam), q, submitted_text="Paris")) == 0.0


# ── grade_exam_attempt end-to-end (run synchronously) ──────────────────


def test_grade_exam_attempt_full_score():
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    exam = make_exam(lecturer)
    mcq1 = make_mcq(exam, lecturer, points=5.0)
    mcq2 = make_mcq(exam, lecturer, points=5.0)
    attempt = make_attempt(student, exam)
    answer(attempt, mcq1, selected_option=QuestionOption.objects.get(question=mcq1, is_correct=True))
    answer(attempt, mcq2, selected_option=QuestionOption.objects.get(question=mcq2, is_correct=True))

    grade_exam_attempt(str(attempt.pk))

    attempt.refresh_from_db()
    result = Result.objects.get(exam_attempt=attempt)
    assert attempt.grading_status == ExamAttempt.GradingStatusChoices.GRADING_COMPLETE
    assert float(result.final_score) == 10.0
    assert result.grade_letter == "A"
    assert result.certified_by_id == lecturer.pk


def test_grade_exam_attempt_partial_score():
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    exam = make_exam(lecturer)
    mcq1 = make_mcq(exam, lecturer, points=5.0)
    mcq2 = make_mcq(exam, lecturer, points=5.0)
    attempt = make_attempt(student, exam)
    answer(attempt, mcq1, selected_option=QuestionOption.objects.get(question=mcq1, is_correct=True))
    answer(attempt, mcq2, selected_option=QuestionOption.objects.get(question=mcq2, is_correct=False))

    grade_exam_attempt(str(attempt.pk))

    result = Result.objects.get(exam_attempt=attempt)
    assert float(result.final_score) == 5.0
    assert result.grade_letter == "F"


def test_grade_exam_attempt_is_idempotent():
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    exam = make_exam(lecturer)
    mcq = make_mcq(exam, lecturer, points=5.0)
    attempt = make_attempt(student, exam)
    correct = QuestionOption.objects.get(question=mcq, is_correct=True)
    answer(attempt, mcq, selected_option=correct)

    grade_exam_attempt(str(attempt.pk))
    grade_exam_attempt(str(attempt.pk))

    assert Result.objects.filter(exam_attempt=attempt).count() == 1
    assert float(Result.objects.get(exam_attempt=attempt).final_score) == 5.0


@patch("results.models.Result.objects.update_or_create", side_effect=RuntimeError("boom"))
def test_grade_exam_attempt_marks_failed_on_error(mock_update):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    exam = make_exam(lecturer)
    make_mcq(exam, lecturer)
    attempt = make_attempt(student, exam)

    with pytest.raises(RuntimeError):
        grade_exam_attempt(str(attempt.pk))

    attempt.refresh_from_db()
    assert attempt.grading_status == ExamAttempt.GradingStatusChoices.GRADING_FAILED


# ── scheduling gate ─────────────────────────────────────────────────────


def auth_client(client, user):
    login_response = client.post(
        reverse("auth_login"),
        {"email": user.email, "password": "strongpass123"},
        content_type="application/json",
    )
    assert login_response.status_code == status.HTTP_200_OK
    return login_response.json()["access"]


def schedule_payload():
    return {
        "start_window": (timezone.now() + timezone.timedelta(hours=2)).isoformat(),
        "end_window": (timezone.now() + timezone.timedelta(hours=4)).isoformat(),
        "duration_minutes": 120,
    }


def test_schedule_accepts_fully_gradeable_exam(client):
    lecturer_user, lecturer = create_lecturer()
    token = auth_client(client, lecturer_user)
    exam = make_exam(lecturer)
    make_mcq(exam, lecturer)

    response = client.post(
        reverse("examination_schedule", kwargs={"pk": exam.pk}),
        schedule_payload(),
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    exam.refresh_from_db()
    assert exam.status == ExamStatusChoices.SCHEDULED


def test_schedule_rejects_essay_question(client):
    lecturer_user, lecturer = create_lecturer()
    token = auth_client(client, lecturer_user)
    exam = make_exam(lecturer)
    Question.objects.create(
        examination=exam,
        creator=lecturer,
        question_text="Write an essay.",
        question_type=QuestionTypeChoices.ESSAY,
        total_points=10.0,
    )

    response = client.post(
        reverse("examination_schedule", kwargs={"pk": exam.pk}),
        schedule_payload(),
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert any("ESSAY" in e for e in response.json()["errors"])
    exam.refresh_from_db()
    assert exam.status == ExamStatusChoices.DRAFT


def test_schedule_rejects_mcq_without_exactly_one_correct(client):
    lecturer_user, lecturer = create_lecturer()
    token = auth_client(client, lecturer_user)
    exam = make_exam(lecturer)
    q = make_mcq(exam, lecturer, with_options=False)
    QuestionOption.objects.create(question=q, option_text="A", is_correct=False)
    QuestionOption.objects.create(question=q, option_text="B", is_correct=False)

    response = client.post(
        reverse("examination_schedule", kwargs={"pk": exam.pk}),
        schedule_payload(),
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert any("exactly one correct option" in e for e in response.json()["errors"])
    exam.refresh_from_db()
    assert exam.status == ExamStatusChoices.DRAFT


def test_schedule_rejects_short_answer_question(client):
    lecturer_user, lecturer = create_lecturer()
    token = auth_client(client, lecturer_user)
    exam = make_exam(lecturer)
    Question.objects.create(
        examination=exam,
        creator=lecturer,
        question_text="Capital of France?",
        question_type=QuestionTypeChoices.SHORT_ANSWER,
        total_points=5.0,
    )

    response = client.post(
        reverse("examination_schedule", kwargs={"pk": exam.pk}),
        schedule_payload(),
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert any("SHORT_ANSWER" in e for e in response.json()["errors"])
    exam.refresh_from_db()
    assert exam.status == ExamStatusChoices.DRAFT


# ── exactly-one-correct option rule ─────────────────────────────────────


def test_option_serializer_rejects_second_correct_option(client):
    from questions.serializers import QuestionOptionSerializer

    lecturer_user, lecturer = create_lecturer()
    exam = make_exam(lecturer)
    q = make_mcq(exam, lecturer)

    serializer = QuestionOptionSerializer(
        data={"question": str(q.pk), "option_text": "Also right", "is_correct": True}
    )
    assert not serializer.is_valid()
    assert any("Exactly one" in e for e in serializer.errors.get("non_field_errors", []))
