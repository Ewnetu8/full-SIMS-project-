from django.urls import path

from results.views import AdvisingReportView, ExamAnalyticsView

urlpatterns = [
    path("analytics/exam/<uuid:pk>", ExamAnalyticsView.as_view(), name="exam_analytics"),
    path("analytics/advising", AdvisingReportView.as_view(), name="advising_report"),
]
