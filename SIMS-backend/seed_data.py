import os
import sys
import django
import datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.dev')
django.setup()

from accounts.models import User, RoleChoices, ClassStandingChoices, Lecturer, Student
from academics.models import (
    University, College, Department, Program, DegreeLevelChoices,
    AcademicYear, Semester, SemesterChoices, Course, CourseOffering, Enrollment, EnrollmentStatusChoices
)

def seed():
    print("[+] Seeding initial academic hierarchy & dev data...")

    # 1. University
    uni = University.objects.filter(code="AASTU").first()
    if not uni:
        uni = University.objects.create(code="AASTU", name="Addis Ababa Science and Technology University")

    # 2. College
    college = College.objects.filter(code="COEA").first()
    if not college:
        college = College.objects.create(code="COEA", university=uni, name="College of Electrical and Mechanical Engineering")

    # 3. Department
    dept = Department.objects.filter(code="SE").first()
    if not dept:
        dept = Department.objects.create(code="SE", college=college, name="Software Engineering & AI")

    # 4. Program
    program = Program.objects.filter(code="BSSE").first()
    if not program:
        program = Program.objects.create(code="BSSE", department=dept, name="B.Sc. in Software Engineering", degree_level=DegreeLevelChoices.BACHELOR)

    # 5. Academic Year & Semester
    ay = AcademicYear.objects.filter(display_label="2025/2026").first()
    if not ay:
        ay = AcademicYear.objects.create(
            display_label="2025/2026",
            start_boundary=datetime.date(2025, 9, 1),
            end_boundary=datetime.date(2026, 7, 1)
        )
    sem = Semester.objects.filter(academic_year=ay, semester_index=SemesterChoices.FIRST).first()
    if not sem:
        sem = Semester.objects.create(academic_year=ay, semester_index=SemesterChoices.FIRST)

    # 6. Courses
    c1 = Course.objects.filter(course_code="SE201").first()
    if not c1:
        c1 = Course.objects.create(course_code="SE201", program=program, title="Data Structures & Algorithms", credit_hours=4, intended_class_standing=ClassStandingChoices.SOPHOMORE)
    
    c2 = Course.objects.filter(course_code="AI301").first()
    if not c2:
        c2 = Course.objects.create(course_code="AI301", program=program, title="Artificial Intelligence Fundamentals", credit_hours=3, intended_class_standing=ClassStandingChoices.JUNIOR)
    
    c3 = Course.objects.filter(course_code="SE401").first()
    if not c3:
        c3 = Course.objects.create(course_code="SE401", program=program, title="Software Architecture & System Design", credit_hours=3, intended_class_standing=ClassStandingChoices.SENIOR)

    # 7. Course Offerings
    offering1 = CourseOffering.objects.filter(course=c1, semester=sem, section="A").first()
    if not offering1:
        offering1 = CourseOffering.objects.create(course=c1, semester=sem, section="A", capacity=60)

    offering2 = CourseOffering.objects.filter(course=c2, semester=sem, section="A").first()
    if not offering2:
        offering2 = CourseOffering.objects.create(course=c2, semester=sem, section="A", capacity=60)

    offering3 = CourseOffering.objects.filter(course=c3, semester=sem, section="A").first()
    if not offering3:
        offering3 = CourseOffering.objects.create(course=c3, semester=sem, section="A", capacity=60)

    # 8. Create or ensure Lecturer user (lecturer@sims.com)
    lecturer_user = User.objects.filter(email="lecturer@sims.com").first()
    if not lecturer_user:
        lecturer_user = User.objects.create_user(
            email="lecturer@sims.com",
            password="password123",
            role=RoleChoices.LECTURER,
            first_name="Samuel",
            last_name="Worku",
            national_id_fan="FAN-LECTURER-001"
        )
    else:
        lecturer_user.set_password("password123")
        lecturer_user.save()
    
    lecturer_profile = Lecturer.objects.filter(user=lecturer_user).first()
    if not lecturer_profile:
        lecturer_profile = Lecturer.objects.create(
            user=lecturer_user,
            department=dept,
            faculty_identifier="STF-1001"
        )

    # 9. Create Sample Student (student@sims.com) & Enrollment
    student_user = User.objects.filter(email="student@sims.com").first()
    if not student_user:
        student_user = User.objects.create_user(
            email="student@sims.com",
            password="password123",
            role=RoleChoices.STUDENT,
            first_name="Abebe",
            last_name="Bikila",
            national_id_fan="FAN-STUDENT-001"
        )
    else:
        student_user.set_password("password123")
        student_user.save()

    student_profile = Student.objects.filter(user=student_user).first()
    if not student_profile:
        student_profile = Student.objects.create(
            user=student_user,
            department=dept,
            student_identifier="ETS0001/16",
            class_standing=ClassStandingChoices.SOPHOMORE
        )

    Enrollment.objects.get_or_create(
        student=student_profile,
        course_offering=offering1,
        defaults={"status": EnrollmentStatusChoices.ENROLLED}
    )
    Enrollment.objects.get_or_create(
        student=student_profile,
        course_offering=offering2,
        defaults={"status": EnrollmentStatusChoices.ENROLLED}
    )

    print("[SUCCESS] Seeding complete!")
    print(f"   Created CourseOfferings: {[str(offering1.id), str(offering2.id), str(offering3.id)]}")

if __name__ == '__main__':
    seed()
