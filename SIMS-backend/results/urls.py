from django.urls import path

from results.views import (
    AdvisingReportView,
    AssessmentDetailView,
    AssessmentListCreateView,
    AssessmentMarksView,
    ExamAnalyticsView,
    ExamResultsView,
    GradebookView,
    MarkDetailView,
    MyCoursesView,
    PublishCourseResultsView,
    StudentMyMarksView,
    StudentResultsView,
    TeachingAssignmentDetailView,
    TeachingAssignmentListCreateView,
)

urlpatterns = [
    # ── Exam analytics & results (exams pipeline) ──────────────────────
    path("analytics/exam/<uuid:pk>", ExamAnalyticsView.as_view(), name="exam_analytics"),
    path("analytics/advising", AdvisingReportView.as_view(), name="advising_report"),
    path("results/me", StudentResultsView.as_view(), name="student_results"),
    path("results/exam/<uuid:pk>", ExamResultsView.as_view(), name="exam_results"),
    # ── Continuous assessment marks (tests / assignments / other) ─────
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
