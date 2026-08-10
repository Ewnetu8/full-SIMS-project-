from django.urls import path

from exams.views import (
    AutoSaveAnswerView,
    ExaminationDetailView,
    ExaminationListView,
    PublishExaminationView,
    ScheduleExaminationView,
    StartExamView,
    StudentActiveExamsView,
    SubmitExamView,
)

urlpatterns = [
    path("exams", ExaminationListView.as_view(), name="examination_list"),
    path("exams/<uuid:pk>", ExaminationDetailView.as_view(), name="examination_detail"),
    path(
        "exams/<uuid:pk>/schedule",
        ScheduleExaminationView.as_view(),
        name="examination_schedule",
    ),
    path(
        "exams/<uuid:pk>/start",
        StartExamView.as_view(),
        name="exam_start",
    ),
    path(
        "exams/<uuid:pk>/submit",
        SubmitExamView.as_view(),
        name="exam_submit",
    ),
    path(
        "exams/<uuid:pk>/publish",
        PublishExaminationView.as_view(),
        name="examination_publish",
    ),
    path(
        "exams/active",
        StudentActiveExamsView.as_view(),
        name="student_active_exams",
    ),
    path(
        "attempts/<uuid:attempt_pk>/answers/<uuid:question_pk>",
        AutoSaveAnswerView.as_view(),
        name="answer_upsert",
    ),
]
