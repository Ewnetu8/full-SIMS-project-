from django.core.exceptions import ValidationError
from django.db.models import Sum

from accounts.models import ClassStandingChoices, Student


def check_prerequisite_cycle(course, prerequisite_course):
    """
    Checks if adding `prerequisite_course` as a prerequisite for `course` creates a cycle.
    Course A requiring Course B means edge A -> B.
    A cycle occurs if `course` is reachable starting from `prerequisite_course` following prerequisite links.
    """
    if course.id == prerequisite_course.id:
        raise ValidationError("A course cannot be a prerequisite of itself.")

    from academics.models import CoursePrerequisite

    visited = set()
    stack = [prerequisite_course.id]

    while stack:
        current_id = stack.pop()
        if current_id == course.id:
            raise ValidationError(
                f"Adding prerequisite {prerequisite_course.course_code} to {course.course_code} creates a circular dependency."
            )
        if current_id not in visited:
            visited.add(current_id)
            prereq_ids = CoursePrerequisite.objects.filter(
                course_id=current_id
            ).values_list('prerequisite_course_id', flat=True)
            for p_id in prereq_ids:
                if p_id not in visited:
                    stack.append(p_id)


def validate_enrollment(student: Student, course_offering):
    """
    Validates enrollment against the 4 rules:
    1. Duplicate rule: Student cannot enroll in the same CourseOffering or same Course in the same Semester.
    2. Prerequisite rule: Student must have passed all prerequisites for course, unless overridden.
    3. Standing rule: Student class standing must match or satisfy course intended class standing, unless overridden.
    4. Credit limit rule: Total enrolled credit hours for semester cannot exceed policy max, unless overridden.

    Returns dict: {'is_retake': bool} or raises ValidationError.
    """
    from academics.models import (
        CoursePrerequisite,
        CreditHourPolicy,
        Enrollment,
        EnrollmentOverride,
        EnrollmentStatusChoices,
        OverrideTypeChoices,
    )

    course = course_offering.course
    semester = course_offering.semester

    # Fetch active overrides for student and semester
    overrides = EnrollmentOverride.objects.filter(
        student=student,
        semester=semester,
        is_active=True
    ).values_list('override_type', flat=True)

    has_all_override = OverrideTypeChoices.ALL in overrides

    # Rule 1: Duplicate check
    has_duplicate_override = has_all_override or (OverrideTypeChoices.DUPLICATE in overrides)
    if not has_duplicate_override:
        # Check active enrollment in same course offering or same course in same semester
        existing_same_offering = Enrollment.objects.filter(
            student=student,
            course_offering=course_offering,
            status=EnrollmentStatusChoices.ENROLLED
        ).exists()

        existing_same_semester = Enrollment.objects.filter(
            student=student,
            course_offering__semester=semester,
            course_offering__course=course,
            status=EnrollmentStatusChoices.ENROLLED
        ).exists()

        if existing_same_offering or existing_same_semester:
            raise ValidationError("Student is already enrolled in this course for the selected semester.")

    # Rule 2: Prerequisite check
    has_prereq_override = has_all_override or (OverrideTypeChoices.PREREQUISITE in overrides)
    if not has_prereq_override:
        prereqs = CoursePrerequisite.objects.filter(course=course).select_related('prerequisite_course')
        for p in prereqs:
            passed = Enrollment.objects.filter(
                student=student,
                course_offering__course=p.prerequisite_course,
                status=EnrollmentStatusChoices.PASSED
            ).exists()
            if not passed:
                raise ValidationError(
                    f"Prerequisite missing: Student has not passed prerequisite course '{p.prerequisite_course.course_code}'."
                )

    # Rule 3: Standing check
    has_standing_override = has_all_override or (OverrideTypeChoices.STANDING in overrides)
    if not has_standing_override and course.intended_class_standing:
        standing_order = {
            ClassStandingChoices.FRESHMAN: 1,
            ClassStandingChoices.SOPHOMORE: 2,
            ClassStandingChoices.JUNIOR: 3,
            ClassStandingChoices.SENIOR: 4,
            ClassStandingChoices.GRADUATE: 5,
        }
        student_rank = standing_order.get(student.class_standing, 0)
        course_rank = standing_order.get(course.intended_class_standing, 0)

        if student_rank < course_rank:
            raise ValidationError(
                f"Class standing requirement not met: Student is {student.class_standing}, but course requires {course.intended_class_standing}."
            )

    # Rule 4: Credit limit check
    has_credit_override = has_all_override or (OverrideTypeChoices.CREDIT_LIMIT in overrides)
    if not has_credit_override:
        policy = CreditHourPolicy.objects.filter(class_standing=student.class_standing).first()
        if policy:
            # Sum current active enrolled credit hours in semester
            current_credits = Enrollment.objects.filter(
                student=student,
                course_offering__semester=semester,
                status=EnrollmentStatusChoices.ENROLLED
            ).aggregate(total=Sum('course_offering__course__credit_hours'))['total'] or 0

            new_total = current_credits + course.credit_hours
            if new_total > policy.max_credit_hours:
                raise ValidationError(
                    f"Credit hour limit exceeded: Enrolling in {course.credit_hours} hrs brings total to {new_total} hrs, exceeding maximum allowed of {policy.max_credit_hours} hrs for {student.class_standing} standing."
                )

    # Automatic Retake Detection
    prior_enrollment = Enrollment.objects.filter(
        student=student,
        course_offering__course=course
    ).exclude(course_offering=course_offering).exists()

    return {'is_retake': prior_enrollment}
