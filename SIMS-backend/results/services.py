from decimal import ROUND_HALF_UP, Decimal

from academics.models import Enrollment, EnrollmentStatusChoices
from results.models import Assessment, Mark

TWO_PLACES = Decimal('0.01')

PASS_THRESHOLD = Decimal('50.00')

LETTER_GRADE_SCALE = [
    # (minimum percent, letter)
    (Decimal('85.00'), 'A'),
    (Decimal('80.00'), 'A-'),
    (Decimal('75.00'), 'B+'),
    (Decimal('70.00'), 'B'),
    (Decimal('65.00'), 'B-'),
    (Decimal('60.00'), 'C+'),
    (Decimal('50.00'), 'C'),
    (Decimal('45.00'), 'C-'),
    (Decimal('40.00'), 'D'),
    (Decimal('0.00'), 'F'),
]


def get_letter_grade(total_percent):
    """Map a total percentage to a letter grade."""
    if total_percent is None:
        return None
    for minimum, letter in LETTER_GRADE_SCALE:
        if total_percent >= minimum:
            return letter
    return 'F'


def get_offering_totals(course_offering):
    """Compute the weighted running total for every enrolled student of an offering.

    The total is normalized over the assessments that actually have a mark for
    the student, so mid-semester totals stay meaningful before all
    assessments are graded.

    Returns {enrollment_id: {'total_percent': Decimal|None,
                             'letter_grade': str|None,
                             'graded_weight': Decimal}}.
    """
    enrollments = Enrollment.objects.filter(
        course_offering=course_offering,
    ).exclude(status=EnrollmentStatusChoices.DROPPED).values_list('id', flat=True)

    marks = (
        Mark.objects.filter(
            assessment__course_offering=course_offering,
            enrollment_id__in=list(enrollments),
        )
        .select_related('assessment')
    )

    by_enrollment = {}
    for mark in marks:
        weight = mark.assessment.weight
        ratio = (mark.score / mark.assessment.max_marks) * weight
        entry = by_enrollment.setdefault(mark.enrollment_id, {'earned': Decimal('0'), 'weight': Decimal('0')})
        entry['earned'] += ratio.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
        entry['weight'] += weight

    totals = {}
    for enrollment_id in enrollments:
        entry = by_enrollment.get(enrollment_id)
        if not entry or entry['weight'] <= 0:
            totals[enrollment_id] = {
                'total_percent': None,
                'letter_grade': None,
                'graded_weight': Decimal('0.00'),
            }
            continue
        percent = ((entry['earned'] / entry['weight']) * Decimal('100')).quantize(
            TWO_PLACES, rounding=ROUND_HALF_UP
        )
        totals[enrollment_id] = {
            'total_percent': percent,
            'letter_grade': get_letter_grade(percent),
            'graded_weight': entry['weight'].quantize(TWO_PLACES),
        }
    return totals


def get_student_total(student, course_offering, published_only=False):
    """Running total for one student in one offering. Returns the same shape as
    get_offering_totals entries."""
    enrollment_ids = list(
        Enrollment.objects.filter(
            student=student,
            course_offering=course_offering,
        ).values_list('id', flat=True)
    )
    if not enrollment_ids:
        return None

    marks = Mark.objects.filter(
        assessment__course_offering=course_offering,
        enrollment_id__in=enrollment_ids,
    ).select_related('assessment')
    if published_only:
        marks = marks.filter(assessment__is_published=True)

    earned = Decimal('0')
    weight = Decimal('0')
    for mark in marks:
        ratio = (mark.score / mark.assessment.max_marks) * mark.assessment.weight
        earned += ratio.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
        weight += mark.assessment.weight

    if weight <= 0:
        return {'total_percent': None, 'letter_grade': None, 'graded_weight': Decimal('0.00')}
    percent = ((earned / weight) * Decimal('100')).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    return {
        'total_percent': percent,
        'letter_grade': get_letter_grade(percent),
        'graded_weight': weight.quantize(TWO_PLACES),
    }


def publish_course_results(course_offering):
    """Write final letter grades and pass/fail status onto enrollments.

    Uses only PUBLISHED assessments so lecturers control what counts.
    Returns the number of enrollment rows updated.
    """
    published_assessments = Assessment.objects.filter(
        course_offering=course_offering, is_published=True
    )

    enrollments = Enrollment.objects.filter(
        course_offering=course_offering,
    ).exclude(status=EnrollmentStatusChoices.DROPPED).select_related('student')

    updated = 0
    for enrollment in enrollments:
        marks = Mark.objects.filter(
            assessment__in=published_assessments,
            enrollment=enrollment,
        ).select_related('assessment')

        earned = Decimal('0')
        weight = Decimal('0')
        for mark in marks:
            earned += ((mark.score / mark.assessment.max_marks) * mark.assessment.weight).quantize(
                TWO_PLACES, rounding=ROUND_HALF_UP
            )
            weight += mark.assessment.weight

        if weight > 0:
            percent = ((earned / weight) * Decimal('100')).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
            letter = get_letter_grade(percent)
            enrollment.grade = letter
            enrollment.status = (
                EnrollmentStatusChoices.PASSED if percent >= PASS_THRESHOLD
                else EnrollmentStatusChoices.FAILED
            )
            enrollment.save(update_fields=['grade', 'status', 'updated_at'])
            updated += 1
    return updated
