from django.contrib import admin

from results.models import Assessment, Mark, Result, Transcript


class MarkInline(admin.TabularInline):
    model = Mark
    extra = 0


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "assessment_type",
        "course_offering",
        "max_marks",
        "weight",
        "is_published",
        "created_by",
    )
    list_filter = ("assessment_type", "is_published")
    search_fields = ("title", "course_offering__course__course_code")
    inlines = (MarkInline,)


@admin.register(Mark)
class MarkAdmin(admin.ModelAdmin):
    list_display = ("assessment", "enrollment", "score", "entered_by")
    search_fields = (
        "assessment__title",
        "enrollment__student__student_identifier",
    )


admin.site.register(Result)
admin.site.register(Transcript)
