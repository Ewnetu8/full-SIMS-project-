from django.contrib import admin

from academics.models import (
    University,
    College,
    Department,
    Program,
    AcademicYear,
    Semester,
    Course,
    CoursePrerequisite,
    CourseOffering,
    CreditHourPolicy,
    EnrollmentOverride,
    Enrollment,
)

admin.site.register(University)
admin.site.register(College)
admin.site.register(Department)
admin.site.register(Program)
admin.site.register(AcademicYear)
admin.site.register(Semester)
admin.site.register(Course)
admin.site.register(CoursePrerequisite)
admin.site.register(CourseOffering)
admin.site.register(CreditHourPolicy)
admin.site.register(EnrollmentOverride)
admin.site.register(Enrollment)
