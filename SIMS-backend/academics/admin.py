from django.contrib import admin
from academics.models import Department, Course, AcademicYear, Semester, Enrollment

admin.site.register(Department)
admin.site.register(Course)
admin.site.register(AcademicYear)
admin.site.register(Semester)
admin.site.register(Enrollment)
