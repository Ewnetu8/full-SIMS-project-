from django.urls import path

from exams.views import ExaminationDetailView, ExaminationListView

urlpatterns = [
    path("exams", ExaminationListView.as_view(), name="examination_list"),
    path("exams/<uuid:pk>", ExaminationDetailView.as_view(), name="examination_detail"),
]
