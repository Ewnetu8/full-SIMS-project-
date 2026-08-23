from django.urls import path

from results.views import (
    AssessmentDetailView,
    AssessmentListCreateView,
    AssessmentMarksView,
    GradebookView,
    MarkDetailView,
    MyCoursesView,
    PublishCourseResultsView,
    StudentMyMarksView,
    TeachingAssignmentDetailView,
    TeachingAssignmentListCreateView,
)

urlpatterns = [
    path(
        "teaching-assignments",
        TeachingAssignmentListCreateView.as_view(),
        name="teaching_assignment_list",
    ),
    path(
        "teaching-assignments/<uuid:pk>",
        TeachingAssignmentDetailView.as_view(),
        name="teaching_assignment_detail",
    ),
    path("my-courses", MyCoursesView.as_view(), name="my_courses"),
    path(
        "course-offerings/<uuid:offering_pk>/assessments",
        AssessmentListCreateView.as_view(),
        name="assessment_list_create",
    ),
    path(
        "course-offerings/<uuid:offering_pk>/gradebook",
        GradebookView.as_view(),
        name="offering_gradebook",
    ),
    path(
        "course-offerings/<uuid:offering_pk>/publish-results",
        PublishCourseResultsView.as_view(),
        name="offering_publish_results",
    ),
    path(
        "assessments/<uuid:pk>",
        AssessmentDetailView.as_view(),
        name="assessment_detail",
    ),
    path(
        "assessments/<uuid:pk>/marks",
        AssessmentMarksView.as_view(),
        name="assessment_marks",
    ),
    path("marks/<uuid:pk>", MarkDetailView.as_view(), name="mark_detail"),
    path("my-marks", StudentMyMarksView.as_view(), name="my_marks"),
]
