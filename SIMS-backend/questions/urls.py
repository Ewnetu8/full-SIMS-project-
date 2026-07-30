from django.urls import path

from questions.views import (
    QuestionDetailView,
    QuestionListView,
    QuestionOptionDetailView,
    QuestionOptionListView,
    RubricCriterionDetailView,
    RubricCriterionListView,
    TagDetailView,
    TagListView,
)

urlpatterns = [
    # Question
    path("questions", QuestionListView.as_view(), name="question_list"),
    path("questions/<uuid:pk>", QuestionDetailView.as_view(), name="question_detail"),
    # Question Options
    path(
        "questions/options",
        QuestionOptionListView.as_view(),
        name="question_option_list",
    ),
    path(
        "questions/options/<uuid:pk>",
        QuestionOptionDetailView.as_view(),
        name="question_option_detail",
    ),
    # Rubric Criteria
    path(
        "questions/rubric-criteria",
        RubricCriterionListView.as_view(),
        name="rubric_criterion_list",
    ),
    path(
        "questions/rubric-criteria/<uuid:pk>",
        RubricCriterionDetailView.as_view(),
        name="rubric_criterion_detail",
    ),
    # Tags
    path("tags", TagListView.as_view(), name="tag_list"),
    path("tags/<uuid:pk>", TagDetailView.as_view(), name="tag_detail"),
]
