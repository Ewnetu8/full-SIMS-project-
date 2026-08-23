import pytest
from accounts.models import User, Student, RoleChoices, ClassStandingChoices
from academics.models import (
    University, College, Department, Program, Course,
    AcademicYear, Semester, SemesterChoices, CourseOffering, Enrollment, CreditHourPolicy
)
from academics.tasks import process_batch_enrollment_csv

pytestmark = pytest.mark.django_db


def test_process_batch_enrollment_csv_task():
    uni = University.objects.create(name="Batch Uni", code="BU")
    col = College.objects.create(university=uni, name="Batch Col", code="BC")
    dept = Department.objects.create(college=col, name="Batch Dept", code="BD")
    prog = Program.objects.create(department=dept, name="Batch Prog", code="BP")

    user = User.objects.create_user(email="batch_std@aastu.edu.et", password="pass", role=RoleChoices.STUDENT)
    student = Student.objects.create(user=user, student_identifier="BATCH001", class_standing=ClassStandingChoices.FRESHMAN)

    course = Course.objects.create(program=prog, title="Batch CS", course_code="CS100", credit_hours=3, intended_class_standing=ClassStandingChoices.FRESHMAN)

    ay = AcademicYear.objects.create(display_label="2026/2027", start_boundary="2026-09-01", end_boundary="2027-06-30")
    sem = Semester.objects.create(academic_year=ay, semester_index=SemesterChoices.FIRST)

    offering = CourseOffering.objects.create(course=course, semester=sem, section="A")
    CreditHourPolicy.objects.create(class_standing=ClassStandingChoices.FRESHMAN, min_credit_hours=3, max_credit_hours=18)

    csv_data = f"student_identifier,course_code,semester_id,section\nBATCH001,CS100,{sem.id},A\n"

    result = process_batch_enrollment_csv(csv_data)

    assert result["processed"] == 1
    assert result["successful"] == 1
    assert result["failed"] == 0
    assert Enrollment.objects.filter(student=student, course_offering=offering).exists()
