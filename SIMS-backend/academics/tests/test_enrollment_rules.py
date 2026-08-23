import pytest
from django.core.exceptions import ValidationError
from accounts.models import User, Student, RoleChoices, ClassStandingChoices
from academics.models import (
    University, College, Department, Program, Course, CoursePrerequisite,
    AcademicYear, Semester, SemesterChoices, CourseOffering, CreditHourPolicy,
    EnrollmentOverride, OverrideTypeChoices, Enrollment, EnrollmentStatusChoices
)
from academics.services import validate_enrollment

pytestmark = pytest.mark.django_db


def setup_enrollment_data():
    uni = University.objects.create(name="Enroll Uni", code="EU")
    col = College.objects.create(university=uni, name="Enroll Col", code="EC")
    dept = Department.objects.create(college=col, name="Enroll Dept", code="ED")
    prog = Program.objects.create(department=dept, name="Enroll Prog", code="EP")

    user = User.objects.create_user(email="std1@aastu.edu.et", password="pass", role=RoleChoices.STUDENT)
    student = Student.objects.create(user=user, student_identifier="ST1001", class_standing=ClassStandingChoices.FRESHMAN)

    c1 = Course.objects.create(program=prog, title="Intro CS", course_code="CS101", credit_hours=3, intended_class_standing=ClassStandingChoices.FRESHMAN)
    c2 = Course.objects.create(program=prog, title="Adv Algorithms", course_code="CS301", credit_hours=4, intended_class_standing=ClassStandingChoices.JUNIOR)

    # c2 requires c1
    CoursePrerequisite.objects.create(course=c2, prerequisite_course=c1)

    ay = AcademicYear.objects.create(display_label="2026/2027", start_boundary="2026-09-01", end_boundary="2027-06-30")
    sem = Semester.objects.create(academic_year=ay, semester_index=SemesterChoices.FIRST)

    off1 = CourseOffering.objects.create(course=c1, semester=sem, section="A")
    off2 = CourseOffering.objects.create(course=c2, semester=sem, section="A")

    CreditHourPolicy.objects.create(class_standing=ClassStandingChoices.FRESHMAN, min_credit_hours=12, max_credit_hours=6)

    return student, c1, c2, sem, off1, off2


def test_prerequisite_rule_validation():
    student, c1, c2, sem, off1, off2 = setup_enrollment_data()

    # Enrolling in c2 without passing c1 should raise ValidationError
    with pytest.raises(ValidationError) as exc:
        validate_enrollment(student, off2)
    assert "Prerequisite missing" in str(exc.value)

    # Pass c1
    Enrollment.objects.create(student=student, course_offering=off1, status=EnrollmentStatusChoices.PASSED)

    # Still freshman, c2 requires JUNIOR standing -> should fail standing rule
    with pytest.raises(ValidationError) as exc:
        validate_enrollment(student, off2)
    assert "Class standing requirement not met" in str(exc.value)


def test_override_bypasses_standing_and_credit_limit():
    student, c1, c2, sem, off1, off2 = setup_enrollment_data()

    # Pass c1
    Enrollment.objects.create(student=student, course_offering=off1, status=EnrollmentStatusChoices.PASSED)

    # Grant standing and credit limit override
    EnrollmentOverride.objects.create(
        student=student,
        semester=sem,
        override_type=OverrideTypeChoices.STANDING,
        is_active=True
    )
    EnrollmentOverride.objects.create(
        student=student,
        semester=sem,
        override_type=OverrideTypeChoices.CREDIT_LIMIT,
        is_active=True
    )

    # Validation should succeed now!
    res = validate_enrollment(student, off2)
    assert res['is_retake'] is False


def test_retake_detection():
    student, c1, c2, sem, off1, off2 = setup_enrollment_data()

    # Previous attempt in another term
    ay_prev = AcademicYear.objects.create(display_label="2025/2026", start_boundary="2025-09-01", end_boundary="2026-06-30")
    sem_prev = Semester.objects.create(academic_year=ay_prev, semester_index=SemesterChoices.FIRST)
    off_prev = CourseOffering.objects.create(course=c1, semester=sem_prev, section="A")

    Enrollment.objects.create(student=student, course_offering=off_prev, status=EnrollmentStatusChoices.FAILED)

    res = validate_enrollment(student, off1)
    assert res['is_retake'] is True
