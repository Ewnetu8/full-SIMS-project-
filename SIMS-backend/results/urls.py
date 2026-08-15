from django.urls import path

from results.views import (
    AdvisingReportView,
    ExamAnalyticsView,
    ExamResultsView,
    StudentResultsView,
)

urlpatterns = [
    path("analytics/exam/<uuid:pk>", ExamAnalyticsView.as_view(), name="exam_analytics"),
    path("analytics/advising", AdvisingReportView.as_view(), name="advising_report"),
    path("results/me", StudentResultsView.as_view(), name="student_results"),
    path("results/exam/<uuid:pk>", ExamResultsView.as_view(), name="exam_results"),
]
