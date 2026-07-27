from django.urls import path

from academics.views import UniversityDetailView, UniversityListView

urlpatterns = [
    path("universities", UniversityListView.as_view(), name="university_list"),
    path(
        "universities/<uuid:pk>",
        UniversityDetailView.as_view(),
        name="university_detail",
    ),
]
