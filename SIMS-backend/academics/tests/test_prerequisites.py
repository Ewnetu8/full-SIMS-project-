import pytest
from django.core.exceptions import ValidationError
from academics.models import Course, CoursePrerequisite, Program, Department, College, University
from academics.services import check_prerequisite_cycle

pytestmark = pytest.mark.django_db


def setup_courses():
    uni = University.objects.create(name="Uni Cycle", code="UC")
    col = College.objects.create(university=uni, name="Col Cycle", code="CC")
    dept = Department.objects.create(college=col, name="Dept Cycle", code="DC")
    prog = Program.objects.create(department=dept, name="Prog Cycle", code="PC")

    c1 = Course.objects.create(program=prog, title="CS101 Intro", course_code="CS101")
    c2 = Course.objects.create(program=prog, title="CS102 Data Struct", course_code="CS102")
    c3 = Course.objects.create(program=prog, title="CS201 Algo", course_code="CS201")
    return c1, c2, c3


def test_self_prerequisite_rejected():
    c1, _, _ = setup_courses()
    with pytest.raises(ValidationError) as exc:
        check_prerequisite_cycle(c1, c1)
    assert "prerequisite of itself" in str(exc.value)


def test_direct_cycle_rejected():
    c1, c2, _ = setup_courses()
    # c2 requires c1
    CoursePrerequisite.objects.create(course=c2, prerequisite_course=c1)

    # Now trying to add c1 requires c2 should raise ValidationError
    prereq = CoursePrerequisite(course=c1, prerequisite_course=c2)
    with pytest.raises(ValidationError) as exc:
        prereq.clean()
    assert "circular dependency" in str(exc.value)


def test_transitive_cycle_rejected():
    c1, c2, c3 = setup_courses()
    # c2 requires c1
    CoursePrerequisite.objects.create(course=c2, prerequisite_course=c1)
    # c3 requires c2
    CoursePrerequisite.objects.create(course=c3, prerequisite_course=c2)

    # Now trying to add c1 requires c3 (c1 -> c3 -> c2 -> c1) should raise ValidationError
    prereq = CoursePrerequisite(course=c1, prerequisite_course=c3)
    with pytest.raises(ValidationError) as exc:
        prereq.clean()
    assert "circular dependency" in str(exc.value)
