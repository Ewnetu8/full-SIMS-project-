from django.contrib import admin

from academics.models import (
    AcademicYear,
    Course,
    Department,
    Enrollment,
    Semester,
    University,
)

admin.site.register(University)
admin.site.register(Department)
admin.site.register(Course)
admin.site.register(AcademicYear)
admin.site.register(Semester)
admin.site.register(Enrollment)
