from django.contrib import admin

from questions.models import Question, QuestionOption, RubricCriterion, Tag

admin.site.register(Question)
admin.site.register(QuestionOption)
admin.site.register(RubricCriterion)
admin.site.register(Tag)
