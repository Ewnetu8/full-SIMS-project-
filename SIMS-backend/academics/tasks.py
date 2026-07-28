import csv
import io
from celery import shared_task
from django.db import transaction

from accounts.models import Student
from academics.models import Course, Semester, CourseOffering, Enrollment
from academics.services import validate_enrollment


@shared_task
def process_batch_enrollment_csv(csv_content):
    """
    Celery task to asynchronously process batch enrollment from CSV content.
    Returns a dictionary summarizing total processed, success, and error details per row.
    """
    f = io.StringIO(csv_content)
    reader = csv.DictReader(f)

    results = {
        "processed": 0,
        "successful": 0,
        "failed": 0,
        "errors": []
    }

    for idx, row in enumerate(reader, start=1):
        results["processed"] += 1
        student_id = row.get("student_identifier", "").strip()
        course_code = row.get("course_code", "").strip().upper()
        semester_id = row.get("semester_id", "").strip()
        section = row.get("section", "A").strip()

        try:
            student = Student.objects.get(student_identifier=student_id)
            course = Course.objects.get(course_code=course_code)
            semester = Semester.objects.get(id=semester_id)
            course_offering = CourseOffering.objects.get(
                course=course,
                semester=semester,
                section=section
            )

            with transaction.atomic():
                validation_result = validate_enrollment(student, course_offering)
                Enrollment.objects.create(
                    student=student,
                    course_offering=course_offering,
                    is_retake=validation_result.get("is_retake", False)
                )
                results["successful"] += 1

        except Exception as e:
            results["failed"] += 1
            results["errors"].append({
                "row": idx,
                "student_identifier": student_id,
                "course_code": course_code,
                "error": str(e)
            })

    return results
