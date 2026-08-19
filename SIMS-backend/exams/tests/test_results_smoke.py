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


def make_exam(lecturer, status_=ExamStatusChoices.CLOSED):
    now = timezone.now()
    return Examination.objects.create(
        course_offering=make_course_offering(),
        lecturer=lecturer,
        title="Midterm",
        status=status_,
        start_window=now - timezone.timedelta(hours=2),
        end_window=now - timezone.timedelta(hours=1),
        duration_minutes=60,
    )


def auth_client(client, user):
    login_response = client.post(
        reverse("auth_login"),
        {"email": user.email, "password": "strongpass123"},
        content_type="application/json",
    )
    assert login_response.status_code == status.HTTP_200_OK
    return login_response.json()["access"]


def make_graded(lecturer, student, exam):
    attempt = ExamAttempt.objects.create(
        examination=exam, student=student, start_time=timezone.now() - timezone.timedelta(hours=2)
    )
    attempt.submission_time = timezone.now() - timezone.timedelta(hours=1)
    attempt.save()
    Result.objects.create(
        exam_attempt=attempt,
        final_score="4.00",
        grade_letter="A",
        certified_by=lecturer,
    )
    return attempt


def test_student_results_me(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    other_user, other = create_student()
    exam = make_exam(lecturer)
    make_graded(lecturer, student, exam)
    make_graded(lecturer, other, exam)

    token = auth_client(client, student_user)
    response = client.get(
        reverse("student_results"),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    rows = response.json()
    assert len(rows) == 1
    assert rows[0]["final_score"] == "4.00"
    assert rows[0]["grade_letter"] == "A"
    assert rows[0]["exam_title"] == "Midterm"


def test_student_results_me_requires_student(client):
    lecturer_user, lecturer = create_lecturer()
    token = auth_client(client, lecturer_user)
    response = client.get(
        reverse("student_results"),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_lecturer_exam_results(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    exam = make_exam(lecturer)
    make_graded(lecturer, student, exam)

    token = auth_client(client, lecturer_user)
    response = client.get(
        reverse("exam_results", kwargs={"pk": exam.pk}),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["attempt_count"] == 1
    assert body["graded_count"] == 1
    assert body["students"][0]["student_identifier"] == student.student_identifier
    assert body["students"][0]["grade_letter"] == "A"


def test_lecturer_exam_results_denies_other_lecturer(client):
    owner_user, owner = create_lecturer()
    other_user, other = create_lecturer()
    exam = make_exam(owner)

    token = auth_client(client, other_user)
    response = client.get(
        reverse("exam_results", kwargs={"pk": exam.pk}),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_student_cannot_view_exam_results(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    exam = make_exam(lecturer)

    token = auth_client(client, student_user)
    response = client.get(
        reverse("exam_results", kwargs={"pk": exam.pk}),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_analytics_new_stats(client):
    lecturer_user, lecturer = create_lecturer()
    now = timezone.now()
    exam = Examination.objects.create(
        course_offering=make_course_offering(),
        lecturer=lecturer,
        title="Midterm",
        status=ExamStatusChoices.DRAFT,
        start_window=now - timezone.timedelta(hours=2),
        end_window=now - timezone.timedelta(hours=1),
        duration_minutes=60,
    )
    q1 = Question.objects.create(
        examination=exam, creator=lecturer, question_text="Q1",
        question_type=QuestionTypeChoices.MCQ, total_points=5.0,
    )
    QuestionOption.objects.create(question=q1, option_text="A", is_correct=True)
    q2 = Question.objects.create(
        examination=exam, creator=lecturer, question_text="Q2",
        question_type=QuestionTypeChoices.MCQ, total_points=5.0,
    )
    QuestionOption.objects.create(question=q2, option_text="A", is_correct=True)
    exam.status = ExamStatusChoices.CLOSED
    exam.save()

    students = [create_student()[1] for _ in range(3)]
    for student, score in zip(students, [8.0, 8.0, 4.0]):
        attempt = ExamAttempt.objects.create(
            examination=exam, student=student,
            start_time=now - timezone.timedelta(hours=2),
        )
        Result.objects.create(
            exam_attempt=attempt,
            final_score=f"{score:.2f}",
            grade_letter="B" if score >= 8.0 else "F",
            certified_by=lecturer,
        )

    token = auth_client(client, lecturer_user)
    response = client.get(
        reverse("exam_analytics", kwargs={"pk": exam.pk}),
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["score"]["mode"] == 8.0
    assert body["score"]["mean"] == pytest.approx(20 / 3, abs=0.01)
    assert body["pass_rate"] == pytest.approx(66.67, abs=0.01)
    assert body["pass_threshold"] == 60.0
    dist = {b["label"]: b["count"] for b in body["score_distribution"]}
    assert dist["80-89"] == 2
    assert dist["40-49"] == 1
    assert all(pq["average_points"] is not None for pq in body["per_question"])
    assert body["per_question"][0]["unanswered_count"] == 3
