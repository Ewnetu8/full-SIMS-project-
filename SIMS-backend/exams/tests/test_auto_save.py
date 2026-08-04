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
from exams.models import ExamAttempt, ExamStatusChoices, Examination, StudentAnswer
from questions.models import Question, QuestionOption, QuestionTypeChoices

User = get_user_model()

pytestmark = pytest.mark.django_db

_counter = 0


def create_lecturer():
    global _counter
    _counter += 1
    email = f"lecturer{_counter}@example.com"
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
    email = f"student{_counter}@example.com"
    user = User.objects.create_user(
        email=email, password="strongpass123", role=RoleChoices.STUDENT
    )
    student = Student.objects.create(
        user=user,
        student_identifier=f"S{_counter:03d}",
        class_standing="FRESHMAN",
    )
    return user, student


def make_exam_with_questions(lecturer, mcq=True):
    offering = make_course_offering()
    now = timezone.now()
    exam = Examination.objects.create(
        course_offering=offering,
        lecturer=lecturer,
        title="Midterm",
        status=ExamStatusChoices.DRAFT,
        start_window=now - timezone.timedelta(hours=1),
        end_window=now + timezone.timedelta(hours=1),
        duration_minutes=60,
    )
    qtype = (
        QuestionTypeChoices.MCQ if mcq else QuestionTypeChoices.ESSAY
    )
    question = Question.objects.create(
        examination=exam,
        creator=lecturer,
        question_text="Question?",
        question_type=qtype,
        total_points=5.00,
    )
    option_a = QuestionOption.objects.create(
        question=question, option_text="A", is_correct=True
    )
    option_b = QuestionOption.objects.create(
        question=question, option_text="B", is_correct=False
    )
    exam.status = ExamStatusChoices.ACTIVE
    exam.save()
    return exam, question, option_a, option_b


def make_attempt(student, exam, submitted=False):
    attempt = ExamAttempt.objects.create(
        examination=exam, student=student, start_time=timezone.now()
    )
    if submitted:
        attempt.submission_time = timezone.now()
        attempt.save()
    return attempt


def test_autosave_creates_answer(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    exam, question, option_a, option_b = make_exam_with_questions(lecturer)
    attempt = make_attempt(student, exam)

    response = client.put(
        reverse("answer_upsert", kwargs={"attempt_pk": attempt.pk, "question_pk": question.pk}),
        {"selected_option": str(option_a.pk)},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["selected_option"] == str(option_a.pk)
    assert StudentAnswer.objects.filter(
        exam_attempt=attempt, question=question
    ).count() == 1


def test_autosave_updates_existing_answer(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    exam, question, option_a, option_b = make_exam_with_questions(lecturer)
    attempt = make_attempt(student, exam)

    first = client.put(
        reverse("answer_upsert", kwargs={"attempt_pk": attempt.pk, "question_pk": question.pk}),
        {"selected_option": str(option_a.pk)},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert first.status_code == status.HTTP_200_OK

    second = client.put(
        reverse("answer_upsert", kwargs={"attempt_pk": attempt.pk, "question_pk": question.pk}),
        {"selected_option": str(option_b.pk)},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert second.status_code == status.HTTP_200_OK
    assert second.json()["selected_option"] == str(option_b.pk)
    assert StudentAnswer.objects.filter(
        exam_attempt=attempt, question=question
    ).count() == 1


def test_autosave_clears_mcq_answer(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    exam, question, option_a, option_b = make_exam_with_questions(lecturer)
    attempt = make_attempt(student, exam)

    client.put(
        reverse("answer_upsert", kwargs={"attempt_pk": attempt.pk, "question_pk": question.pk}),
        {"selected_option": str(option_a.pk)},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    response = client.put(
        reverse("answer_upsert", kwargs={"attempt_pk": attempt.pk, "question_pk": question.pk}),
        {"selected_option": None},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["selected_option"] is None


def test_autosave_rejects_option_from_other_question(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    exam, question, option_a, option_b = make_exam_with_questions(lecturer)
    _, other_question, other_a, other_b = make_exam_with_questions(lecturer)
    attempt = make_attempt(student, exam)

    response = client.put(
        reverse("answer_upsert", kwargs={"attempt_pk": attempt.pk, "question_pk": question.pk}),
        {"selected_option": str(other_a.pk)},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_autosave_text_answer(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    exam, question, _, _ = make_exam_with_questions(lecturer, mcq=False)
    attempt = make_attempt(student, exam)

    response = client.put(
        reverse("answer_upsert", kwargs={"attempt_pk": attempt.pk, "question_pk": question.pk}),
        {"submitted_text": "My essay answer"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["submitted_text"] == "My essay answer"


def test_autosave_rejects_option_on_text_question(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    exam, question, _, _ = make_exam_with_questions(lecturer, mcq=False)
    attempt = make_attempt(student, exam)

    response = client.put(
        reverse("answer_upsert", kwargs={"attempt_pk": attempt.pk, "question_pk": question.pk}),
        {"selected_option": str(question.options.first().pk)},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_autosave_rejects_after_submission(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    exam, question, option_a, option_b = make_exam_with_questions(lecturer)
    attempt = make_attempt(student, exam, submitted=True)

    response = client.put(
        reverse("answer_upsert", kwargs={"attempt_pk": attempt.pk, "question_pk": question.pk}),
        {"selected_option": str(option_a.pk)},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_autosave_rejects_other_students_attempt(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    other_user, other_student = create_student()
    token = auth_client(client, other_user)
    exam, question, option_a, option_b = make_exam_with_questions(lecturer)
    attempt = make_attempt(student, exam)

    response = client.put(
        reverse("answer_upsert", kwargs={"attempt_pk": attempt.pk, "question_pk": question.pk}),
        {"selected_option": str(option_a.pk)},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_autosave_rejects_question_from_other_exam(client):
    lecturer_user, lecturer = create_lecturer()
    student_user, student = create_student()
    token = auth_client(client, student_user)
    exam, question, option_a, option_b = make_exam_with_questions(lecturer)
    other_exam, other_question, _, _ = make_exam_with_questions(lecturer)
    attempt = make_attempt(student, exam)

    response = client.put(
        reverse("answer_upsert", kwargs={"attempt_pk": attempt.pk, "question_pk": other_question.pk}),
        {"selected_option": str(option_a.pk)},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
