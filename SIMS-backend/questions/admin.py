from django.contrib import admin
from questions.models import Question, QuestionOption

admin.site.register(Question)
admin.site.register(QuestionOption)
