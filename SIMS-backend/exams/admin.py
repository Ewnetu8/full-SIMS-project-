from django.contrib import admin
from exams.models import Examination, ExamAttempt, StudentAnswer

admin.site.register(Examination)
admin.site.register(ExamAttempt)
admin.site.register(StudentAnswer)
