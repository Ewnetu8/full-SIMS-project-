'use client';

import {
  ClipboardCheck,
  Eye,
  Trash2,
  Calendar,
  Clock,
  UserCheck,
  Plus,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Send,
  Edit2,
  FileSpreadsheet,
  BarChart3,
  Layers,
  HelpCircle,
} from 'lucide-react';
import * as React from 'react';

import { ConfirmationDialog, toast } from '@/components/feedback';
import { Label } from '@/components/forms';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  SearchInput,
} from '@/components/ui';
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';
import { ExamAnalyticsView } from '@/features/analytics/components/exam-analytics-view';

import { useAdminStore } from '../store';
import type { AdminExamOverview, ExaminationStatus } from '../types';

// Helpers to handle HTML datetime-local inputs
function toDatetimeLocalValue(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
}

function toIsoStringFromDatetimeLocal(localString: string): string {
  if (!localString) return '';
  try {
    return new Date(localString).toISOString();
  } catch {
    return '';
  }
}

function getStatusBadgeVariant(status: ExaminationStatus): 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'outline' {
  switch (status) {
    case 'DRAFT':
      return 'secondary';
    case 'SCHEDULED':
      return 'default';
    case 'ACTIVE':
      return 'destructive';
    case 'CLOSED':
      return 'warning';
    case 'PUBLISHED':
      return 'success';
    default:
      return 'secondary';
  }
}

export function ExaminationManagement() {
  const {
    exams,
    isLoadingExams,
    examsError,
    examSearchQuery,
    examStatusFilter,
    examCourseOfferingFilter,
    courseOfferings,
    fetchExams,
    fetchCourseOfferings,
    createExam,
    updateExam,
    scheduleExam,
    publishExam,
    deleteExam,
    setExamSearchQuery,
    setExamStatusFilter,
    setExamCourseOfferingFilter,
  } = useAdminStore();

  // Dialog / Modal States
  const [selectedExam, setSelectedExam] = React.useState<AdminExamOverview | null>(null);
  const [detailTab, setDetailTab] = React.useState<'overview' | 'results' | 'analytics'>('overview');
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [editingExam, setEditingExam] = React.useState<AdminExamOverview | null>(null);
  const [schedulingExam, setSchedulingExam] = React.useState<AdminExamOverview | null>(null);
  const [publishingExam, setPublishingExam] = React.useState<AdminExamOverview | null>(null);
  const [deletingExam, setDeletingExam] = React.useState<AdminExamOverview | null>(null);

  // Form State
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const [formData, setFormData] = React.useState<{
    course_offering: string;
    title: string;
    start_window: string;
    end_window: string;
    duration_minutes: string | number;
  }>({
    course_offering: '',
    title: '',
    start_window: '',
    end_window: '',
    duration_minutes: 60,
  });

  // Initial Data Fetch
  React.useEffect(() => {
    fetchExams();
    if (courseOfferings.length === 0) {
      fetchCourseOfferings();
    }
  }, [fetchExams, fetchCourseOfferings, courseOfferings.length]);

  // Open Handlers
  const handleOpenCreateModal = () => {
    setFormError(null);
    setFieldErrors({});
    const now = new Date();
    const futureStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // tomorrow
    const futureEnd = new Date(futureStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

    setFormData({
      course_offering: courseOfferings[0]?.id || '',
      title: '',
      start_window: toDatetimeLocalValue(futureStart.toISOString()),
      end_window: toDatetimeLocalValue(futureEnd.toISOString()),
      duration_minutes: 60,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (exam: AdminExamOverview) => {
    setFormError(null);
    setFieldErrors({});
    setEditingExam(exam);
    setFormData({
      course_offering: exam.course_offering || exam.course_offering_detail?.id || '',
      title: exam.title,
      start_window: toDatetimeLocalValue(exam.start_window),
      end_window: toDatetimeLocalValue(exam.end_window),
      duration_minutes: exam.duration_minutes || exam.durationMinutes || 60,
    });
  };

  const handleOpenScheduleModal = (exam: AdminExamOverview) => {
    setFormError(null);
    setFieldErrors({});
    setSchedulingExam(exam);
    const now = new Date();
    const defaultStart = exam.start_window ? new Date(exam.start_window) : new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const defaultEnd = exam.end_window ? new Date(exam.end_window) : new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000);

    setFormData({
      course_offering: exam.course_offering || '',
      title: exam.title,
      start_window: toDatetimeLocalValue(defaultStart.toISOString()),
      end_window: toDatetimeLocalValue(defaultEnd.toISOString()),
      duration_minutes: exam.duration_minutes || 60,
    });
  };

  // Validations
  const validateForm = (isScheduling = false) => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim() && !isScheduling) {
      errors.title = 'Examination title is required.';
    }
    if (!formData.course_offering && !isScheduling) {
      errors.course_offering = 'Please select a course offering.';
    }
    if (!formData.start_window) {
      errors.start_window = 'Start window date & time is required.';
    }
    if (!formData.end_window) {
      errors.end_window = 'End window date & time is required.';
    }
    if (formData.start_window && formData.end_window) {
      const start = new Date(formData.start_window).getTime();
      const end = new Date(formData.end_window).getTime();
      if (end <= start) {
        errors.end_window = 'End window must be after the start window.';
      }
    }
    const duration = formData.duration_minutes === '' ? NaN : Number(formData.duration_minutes);
    if (formData.duration_minutes === '' || isNaN(duration) || duration <= 0) {
      errors.duration_minutes = 'Duration must be at least 1 minute.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handlers
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      await createExam({
        course_offering: formData.course_offering,
        title: formData.title.trim(),
        start_window: toIsoStringFromDatetimeLocal(formData.start_window),
        end_window: toIsoStringFromDatetimeLocal(formData.end_window),
        duration_minutes: Number(formData.duration_minutes),
      });
      toast.success('Examination created successfully in DRAFT status.');
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      const parsed = parseFieldErrors(err);
      if (Object.keys(parsed).length > 0) {
        setFieldErrors(parsed);
      } else {
        setFormError(getUserFriendlyErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam || !validateForm()) return;

    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const updated = await updateExam(editingExam.id, {
        course_offering: formData.course_offering || undefined,
        title: formData.title.trim(),
        start_window: formData.start_window ? toIsoStringFromDatetimeLocal(formData.start_window) : undefined,
        end_window: formData.end_window ? toIsoStringFromDatetimeLocal(formData.end_window) : undefined,
        duration_minutes: Number(formData.duration_minutes),
      });
      toast.success('Examination updated successfully.');
      if (selectedExam && selectedExam.id === updated.id) {
        setSelectedExam(updated);
      }
      setEditingExam(null);
    } catch (err: unknown) {
      const parsed = parseFieldErrors(err);
      if (Object.keys(parsed).length > 0) {
        setFieldErrors(parsed);
      } else {
        setFormError(getUserFriendlyErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingExam || !validateForm(true)) return;

    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const updated = await scheduleExam(schedulingExam.id, {
        start_window: toIsoStringFromDatetimeLocal(formData.start_window),
        end_window: toIsoStringFromDatetimeLocal(formData.end_window),
        duration_minutes: Number(formData.duration_minutes),
      });
      toast.success('Examination scheduled successfully.');
      if (selectedExam && selectedExam.id === updated.id) {
        setSelectedExam(updated);
      }
      setSchedulingExam(null);
    } catch (err: unknown) {
      setFormError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishConfirm = async () => {
    if (!publishingExam) return;

    setIsSubmitting(true);
    try {
      const published = await publishExam(publishingExam.id);
      toast.success('Examination results published successfully.');
      if (selectedExam && selectedExam.id === published.id) {
        setSelectedExam(published);
      }
      setPublishingExam(null);
    } catch (err: unknown) {
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExam) return;

    setIsSubmitting(true);
    try {
      await deleteExam(deletingExam.id);
      toast.success('Examination deleted successfully.');
      if (selectedExam && selectedExam.id === deletingExam.id) {
        setSelectedExam(null);
      }
      setDeletingExam(null);
    } catch (err: unknown) {
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Exams
  const filteredExams = React.useMemo(() => {
    return exams.filter((e) => {
      const query = examSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        e.title.toLowerCase().includes(query) ||
        (e.courseCode || '').toLowerCase().includes(query) ||
        (e.courseName || '').toLowerCase().includes(query) ||
        (e.course_offering_detail?.course_code || '').toLowerCase().includes(query) ||
        (e.course_offering_detail?.course_title || '').toLowerCase().includes(query) ||
        (e.lecturerName || '').toLowerCase().includes(query) ||
        (e.id || '').toLowerCase().includes(query);

      const matchesStatus =
        examStatusFilter === 'ALL' || e.status.toUpperCase() === examStatusFilter.toUpperCase();

      const matchesOffering =
        examCourseOfferingFilter === 'ALL' ||
        e.course_offering === examCourseOfferingFilter ||
        e.course_offering_detail?.id === examCourseOfferingFilter;

      return matchesSearch && matchesStatus && matchesOffering;
    });
  }, [exams, examSearchQuery, examStatusFilter, examCourseOfferingFilter]);

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" /> Institutional Examination Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Oversee examination lifecycles, schedule test windows, inspect student results, and publish grades institution-wide.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchExams()}
            disabled={isLoadingExams}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingExams ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 font-semibold"
          >
            <Plus className="h-4 w-4" /> Create Examination
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border border-border bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Examinations</p>
          <p className="text-2xl font-bold text-foreground mt-1">{exams.length}</p>
        </Card>

        <Card className="p-4 border border-border bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Draft & Scheduled</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {exams.filter((e) => e.status === 'DRAFT' || e.status === 'SCHEDULED').length}
          </p>
        </Card>

        <Card className="p-4 border border-border bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active / Live</p>
          <p className="text-2xl font-bold text-destructive mt-1">
            {exams.filter((e) => e.status === 'ACTIVE').length}
          </p>
        </Card>

        <Card className="p-4 border border-border bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Closed & Published</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {exams.filter((e) => e.status === 'CLOSED' || e.status === 'PUBLISHED').length}
          </p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <SearchInput
              placeholder="Search title, course, lecturer..."
              value={examSearchQuery}
              onChange={(e) => setExamSearchQuery(e.target.value)}
              onClear={() => setExamSearchQuery('')}
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={examStatusFilter}
              onChange={(e) => setExamStatusFilter(e.target.value)}
            >
              <option value="ALL">All Lifecycle Statuses</option>
              <option value="DRAFT">DRAFT (Editable / Schedulable)</option>
              <option value="SCHEDULED">SCHEDULED (Upcoming)</option>
              <option value="ACTIVE">ACTIVE (In Progress)</option>
              <option value="CLOSED">CLOSED (Ready to Publish)</option>
              <option value="PUBLISHED">PUBLISHED (Results Released)</option>
            </select>
          </div>

          <div>
            <select
              className={selectClass}
              value={examCourseOfferingFilter}
              onChange={(e) => setExamCourseOfferingFilter(e.target.value)}
            >
              <option value="ALL">All Course Offerings</option>
              {courseOfferings.map((co) => {
                const cCode = co.course_detail?.course_code || co.course_detail?.code || co.course_code || 'Offering';
                const term = co.semester_detail?.academic_year_detail?.display_label || co.semester_detail?.academicYearDetail?.displayLabel || 'Term';
                const section = co.section ? `Sec ${co.section}` : '';
                return (
                  <option key={co.id} value={co.id}>
                    {cCode} {section ? `- ${section}` : ''} ({term})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {examsError && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load examinations</p>
              <p className="text-xs text-destructive/90">{examsError}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchExams()}
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" /> Retry
          </Button>
        </div>
      )}

      {/* Exams Grid */}
      {isLoadingExams ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={`skeleton-${i}`} className="p-5 animate-pulse space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-5 w-48 bg-muted rounded" />
                </div>
                <div className="h-6 w-20 bg-muted rounded-full" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-3 w-36 bg-muted rounded" />
                <div className="h-3 w-56 bg-muted rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredExams.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground mx-auto">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <p className="font-semibold text-foreground text-base">
              {examSearchQuery || examStatusFilter !== 'ALL' || examCourseOfferingFilter !== 'ALL'
                ? 'No matching examinations found.'
                : 'No examinations created yet.'}
            </p>
            <p className="text-xs text-muted-foreground">
              {examSearchQuery || examStatusFilter !== 'ALL' || examCourseOfferingFilter !== 'ALL'
                ? 'Try adjusting your search keywords or filter criteria.'
                : 'Create your first institutional examination to configure course assessments.'}
            </p>
            {!examSearchQuery && examStatusFilter === 'ALL' && (
              <div className="pt-2">
                <Button size="sm" onClick={handleOpenCreateModal}>
                  <Plus className="h-4 w-4 mr-1.5" /> Create Examination
                </Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredExams.map((exam) => {
            const courseCode =
              exam.course_offering_detail?.course_code || exam.courseCode || 'General';
            const courseTitle =
              exam.course_offering_detail?.course_title || exam.courseName || 'Course Assessment';

            return (
              <Card key={exam.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                          {courseCode}
                        </span>
                        {exam.course_offering_detail?.section && (
                          <span className="text-[11px] text-muted-foreground font-medium">
                            Sec {exam.course_offering_detail.section}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-foreground mt-1 truncate" title={exam.title}>
                        {exam.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{courseTitle}</p>
                    </div>

                    <Badge variant={getStatusBadgeVariant(exam.status)} className="font-semibold text-xs shrink-0">
                      {exam.status}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">Lecturer: <strong className="text-foreground">{exam.lecturerName || exam.lecturer || 'Faculty'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">
                        Window: {exam.start_window ? new Date(exam.start_window).toLocaleDateString() : 'Unscheduled'}
                        {' — '}
                        {exam.end_window ? new Date(exam.end_window).toLocaleDateString() : 'Unscheduled'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>Duration: {exam.duration_minutes || exam.durationMinutes || 60} Minutes</span>
                    </div>
                  </div>
                </div>

                {/* Contextual Action Bar */}
                <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedExam(exam);
                      setDetailTab('overview');
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1 text-muted-foreground" /> View Details
                  </Button>

                  {/* DRAFT Actions: Schedule, Edit, Delete */}
                  {exam.status === 'DRAFT' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenScheduleModal(exam)}
                        className="text-primary hover:text-primary"
                      >
                        <Calendar className="h-3.5 w-3.5 mr-1" /> Schedule
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(exam)}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingExam(exam)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </>
                  )}

                  {/* SCHEDULED Actions: Edit */}
                  {exam.status === 'SCHEDULED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(exam)}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  )}

                  {/* CLOSED Action: Publish Results */}
                  {exam.status === 'CLOSED' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setPublishingExam(exam)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      <Send className="h-3.5 w-3.5 mr-1" /> Publish Results
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Exam Details Modal (Overview, Results, Analytics) */}
      {selectedExam && (
        <Dialog open={!!selectedExam} onOpenChange={() => setSelectedExam(null)}>
          <DialogContent size="lg" className="max-w-3xl p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary text-xs px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                      {selectedExam.course_offering_detail?.course_code || selectedExam.courseCode || 'EXAM'}
                    </span>
                    <Badge variant={getStatusBadgeVariant(selectedExam.status)} className="text-xs">
                      {selectedExam.status}
                    </Badge>
                  </div>
                  <DialogTitle className="text-lg font-bold text-foreground mt-1">
                    {selectedExam.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {selectedExam.course_offering_detail?.course_title || selectedExam.courseName || 'Examination Overview'}
                  </DialogDescription>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 mt-4 border-b border-border -mb-3">
                <button
                  type="button"
                  onClick={() => setDetailTab('overview')}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                    detailTab === 'overview'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5 inline mr-1.5" />
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('results')}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                    detailTab === 'results'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 inline mr-1.5" />
                  Student Results
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('analytics')}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                    detailTab === 'analytics'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5 inline mr-1.5" />
                  Exam Analytics
                </button>
              </div>
            </DialogHeader>

            <DialogBody className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {detailTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-lg border border-border bg-card space-y-1">
                      <span className="text-muted-foreground uppercase text-[10px] font-medium tracking-wider">Exam Title</span>
                      <p className="font-semibold text-foreground text-sm">{selectedExam.title}</p>
                    </div>

                    <div className="p-3.5 rounded-lg border border-border bg-card space-y-1">
                      <span className="text-muted-foreground uppercase text-[10px] font-medium tracking-wider">Course & Offering</span>
                      <p className="font-semibold text-foreground text-sm">
                        {selectedExam.course_offering_detail?.course_code || selectedExam.courseCode} - {selectedExam.course_offering_detail?.course_title || selectedExam.courseName}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg border border-border bg-card space-y-1">
                      <span className="text-muted-foreground uppercase text-[10px] font-medium tracking-wider">Examiner / Lecturer</span>
                      <p className="font-semibold text-foreground">{selectedExam.lecturerName || selectedExam.lecturer || 'Faculty Staff'}</p>
                    </div>

                    <div className="p-3.5 rounded-lg border border-border bg-card space-y-1">
                      <span className="text-muted-foreground uppercase text-[10px] font-medium tracking-wider">Examination Status</span>
                      <div>
                        <Badge variant={getStatusBadgeVariant(selectedExam.status)}>{selectedExam.status}</Badge>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg border border-border bg-card space-y-1">
                      <span className="text-muted-foreground uppercase text-[10px] font-medium tracking-wider flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Start Window
                      </span>
                      <p className="font-semibold text-foreground">
                        {selectedExam.start_window ? new Date(selectedExam.start_window).toLocaleString() : 'Not Set'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg border border-border bg-card space-y-1">
                      <span className="text-muted-foreground uppercase text-[10px] font-medium tracking-wider flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> End Window
                      </span>
                      <p className="font-semibold text-foreground">
                        {selectedExam.end_window ? new Date(selectedExam.end_window).toLocaleString() : 'Not Set'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg border border-border bg-card space-y-1">
                      <span className="text-muted-foreground uppercase text-[10px] font-medium tracking-wider flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Duration
                      </span>
                      <p className="font-semibold text-foreground">
                        {selectedExam.duration_minutes || selectedExam.durationMinutes || 60} Minutes
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg border border-border bg-card space-y-1">
                      <span className="text-muted-foreground uppercase text-[10px] font-medium tracking-wider flex items-center gap-1">
                        <Layers className="h-3 w-3" /> Questions Configured
                      </span>
                      <p className="font-semibold text-foreground">
                        {selectedExam.questions?.length || 0} Questions
                      </p>
                    </div>
                  </div>

                  {/* Contextual Banner */}
                  {selectedExam.status === 'CLOSED' && (
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm text-foreground">Ready for Results Publication</p>
                        <p className="text-xs text-muted-foreground">
                          This examination is CLOSED. Once all student attempts are fully graded, publish the results to release grades.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          const toPublish = selectedExam;
                          setSelectedExam(null);
                          setPublishingExam(toPublish);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shrink-0"
                      >
                        <Send className="h-3.5 w-3.5 mr-1" /> Publish Results
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Student Results Tab */}
              {detailTab === 'results' && (
                <div className="space-y-4">
                  <ExamAnalyticsView examId={selectedExam.id} examTitle={selectedExam.title} />
                </div>
              )}

              {/* Exam Analytics Tab */}
              {detailTab === 'analytics' && (
                <div className="space-y-4">
                  <ExamAnalyticsView examId={selectedExam.id} examTitle={selectedExam.title} />
                </div>
              )}
            </DialogBody>

            <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                {selectedExam.status === 'DRAFT' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const toSchedule = selectedExam;
                        setSelectedExam(null);
                        handleOpenScheduleModal(toSchedule);
                      }}
                    >
                      <Calendar className="h-3.5 w-3.5 mr-1 text-primary" /> Schedule
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const toEdit = selectedExam;
                        setSelectedExam(null);
                        handleOpenEditModal(toEdit);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  </>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedExam(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Examination Modal (POST /api/v1/exams) */}
      {isCreateModalOpen && (
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent size="md" className="sm:max-w-lg p-0 overflow-hidden">
            <form onSubmit={handleCreateSubmit}>
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Plus className="h-4 w-4" />
                  </div>
                  Create Examination
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Create a new institutional examination record in DRAFT status.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-4 px-6 py-4">
                {formError && (
                  <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="create-exam-offering" required>
                    Course Offering
                  </Label>
                  <select
                    id="create-exam-offering"
                    className={selectClass}
                    value={formData.course_offering}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, course_offering: e.target.value }));
                      if (fieldErrors.course_offering) setFieldErrors((p) => ({ ...p, course_offering: '' }));
                    }}
                  >
                    <option value="">Select Course Offering...</option>
                    {courseOfferings.map((co) => {
                      const cCode = co.course_detail?.course_code || co.course_detail?.code || co.course_code || 'Course';
                      const cTitle = co.course_detail?.title || co.course_detail?.name || co.course_title || '';
                      const label = [cCode, cTitle].filter(Boolean).join(' - ');
                      return (
                        <option key={co.id} value={co.id}>
                          {label || 'Course Offering'} {co.section ? `(Sec ${co.section})` : ''}
                        </option>
                      );
                    })}
                  </select>
                  {fieldErrors.course_offering && (
                    <p className="text-xs text-destructive font-medium">{fieldErrors.course_offering}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="create-exam-title" required>
                    Examination Title
                  </Label>
                  <Input
                    id="create-exam-title"
                    placeholder="e.g. Midterm Assessment - Fall 2026"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, title: e.target.value }));
                      if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: '' }));
                    }}
                    error={!!fieldErrors.title}
                  />
                  {fieldErrors.title && (
                    <p className="text-xs text-destructive font-medium">{fieldErrors.title}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="create-exam-start" required>
                      Start Window
                    </Label>
                    <Input
                      id="create-exam-start"
                      type="datetime-local"
                      value={formData.start_window}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, start_window: e.target.value }));
                        if (fieldErrors.start_window) setFieldErrors((p) => ({ ...p, start_window: '' }));
                      }}
                      error={!!fieldErrors.start_window}
                    />
                    {fieldErrors.start_window && (
                      <p className="text-xs text-destructive font-medium">{fieldErrors.start_window}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="create-exam-end" required>
                      End Window
                    </Label>
                    <Input
                      id="create-exam-end"
                      type="datetime-local"
                      value={formData.end_window}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, end_window: e.target.value }));
                        if (fieldErrors.end_window) setFieldErrors((p) => ({ ...p, end_window: '' }));
                      }}
                      error={!!fieldErrors.end_window}
                    />
                    {fieldErrors.end_window && (
                      <p className="text-xs text-destructive font-medium">{fieldErrors.end_window}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="create-exam-duration" required>
                    Duration (Minutes)
                  </Label>
                  <Input
                    id="create-exam-duration"
                    type="number"
                    min={1}
                    max={1440}
                    value={formData.duration_minutes === '' ? '' : formData.duration_minutes}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, duration_minutes: e.target.value }));
                      if (fieldErrors.duration_minutes) setFieldErrors((p) => ({ ...p, duration_minutes: '' }));
                    }}
                    error={!!fieldErrors.duration_minutes}
                  />
                  {fieldErrors.duration_minutes && (
                    <p className="text-xs text-destructive font-medium">{fieldErrors.duration_minutes}</p>
                  )}
                </div>
              </DialogBody>

              <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Examination'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Examination Modal (PATCH /api/v1/exams/{id}) */}
      {editingExam && (
        <Dialog open={!!editingExam} onOpenChange={() => setEditingExam(null)}>
          <DialogContent size="md" className="sm:max-w-lg p-0 overflow-hidden">
            <form onSubmit={handleUpdateSubmit}>
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Edit2 className="h-4 w-4" />
                  </div>
                  Edit Examination
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update examination parameters for &ldquo;{editingExam.title}&rdquo;.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-4 px-6 py-4">
                {formError && (
                  <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="edit-exam-title" required>
                    Examination Title
                  </Label>
                  <Input
                    id="edit-exam-title"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, title: e.target.value }));
                      if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: '' }));
                    }}
                    error={!!fieldErrors.title}
                  />
                  {fieldErrors.title && (
                    <p className="text-xs text-destructive font-medium">{fieldErrors.title}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-exam-start" required>
                      Start Window
                    </Label>
                    <Input
                      id="edit-exam-start"
                      type="datetime-local"
                      value={formData.start_window}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, start_window: e.target.value }));
                        if (fieldErrors.start_window) setFieldErrors((p) => ({ ...p, start_window: '' }));
                      }}
                      error={!!fieldErrors.start_window}
                    />
                    {fieldErrors.start_window && (
                      <p className="text-xs text-destructive font-medium">{fieldErrors.start_window}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-exam-end" required>
                      End Window
                    </Label>
                    <Input
                      id="edit-exam-end"
                      type="datetime-local"
                      value={formData.end_window}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, end_window: e.target.value }));
                        if (fieldErrors.end_window) setFieldErrors((p) => ({ ...p, end_window: '' }));
                      }}
                      error={!!fieldErrors.end_window}
                    />
                    {fieldErrors.end_window && (
                      <p className="text-xs text-destructive font-medium">{fieldErrors.end_window}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-exam-duration" required>
                    Duration (Minutes)
                  </Label>
                  <Input
                    id="edit-exam-duration"
                    type="number"
                    min={1}
                    max={1440}
                    value={formData.duration_minutes === '' ? '' : formData.duration_minutes}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, duration_minutes: e.target.value }));
                      if (fieldErrors.duration_minutes) setFieldErrors((p) => ({ ...p, duration_minutes: '' }));
                    }}
                    error={!!fieldErrors.duration_minutes}
                  />
                  {fieldErrors.duration_minutes && (
                    <p className="text-xs text-destructive font-medium">{fieldErrors.duration_minutes}</p>
                  )}
                </div>
              </DialogBody>

              <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingExam(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Schedule Examination Modal (POST /api/v1/exams/{id}/schedule) */}
      {schedulingExam && (
        <Dialog open={!!schedulingExam} onOpenChange={() => setSchedulingExam(null)}>
          <DialogContent size="md" className="sm:max-w-lg p-0 overflow-hidden">
            <form onSubmit={handleScheduleSubmit}>
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  Schedule Examination
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Set active time window to transition &ldquo;{schedulingExam.title}&rdquo; from DRAFT to SCHEDULED.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-4 px-6 py-4">
                {formError && (
                  <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-muted/40 border border-border/70 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-primary" /> Scheduling Requirements
                  </p>
                  <p>Start window must be in the future. End window must follow start window. Questions must be auto-gradable.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sched-exam-start" required>
                      Start Window (Future)
                    </Label>
                    <Input
                      id="sched-exam-start"
                      type="datetime-local"
                      value={formData.start_window}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, start_window: e.target.value }));
                        if (fieldErrors.start_window) setFieldErrors((p) => ({ ...p, start_window: '' }));
                      }}
                      error={!!fieldErrors.start_window}
                    />
                    {fieldErrors.start_window && (
                      <p className="text-xs text-destructive font-medium">{fieldErrors.start_window}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sched-exam-end" required>
                      End Window
                    </Label>
                    <Input
                      id="sched-exam-end"
                      type="datetime-local"
                      value={formData.end_window}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, end_window: e.target.value }));
                        if (fieldErrors.end_window) setFieldErrors((p) => ({ ...p, end_window: '' }));
                      }}
                      error={!!fieldErrors.end_window}
                    />
                    {fieldErrors.end_window && (
                      <p className="text-xs text-destructive font-medium">{fieldErrors.end_window}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sched-exam-duration" required>
                    Duration (Minutes)
                  </Label>
                  <Input
                    id="sched-exam-duration"
                    type="number"
                    min={1}
                    max={1440}
                    value={formData.duration_minutes === '' ? '' : formData.duration_minutes}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, duration_minutes: e.target.value }));
                      if (fieldErrors.duration_minutes) setFieldErrors((p) => ({ ...p, duration_minutes: '' }));
                    }}
                    error={!!fieldErrors.duration_minutes}
                  />
                  {fieldErrors.duration_minutes && (
                    <p className="text-xs text-destructive font-medium">{fieldErrors.duration_minutes}</p>
                  )}
                </div>
              </DialogBody>

              <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSchedulingExam(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Scheduling...' : 'Schedule Exam'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Publish Results Confirmation Dialog (POST /api/v1/exams/{id}/publish) */}
      {publishingExam && (
        <ConfirmationDialog
          open={!!publishingExam}
          onOpenChange={(open) => {
            if (!open) setPublishingExam(null);
          }}
          title="Publish Examination Results?"
          description={`Are you sure you want to publish final results for "${publishingExam.title}" (${publishingExam.courseCode || 'Exam'})? This will finalize scores and release official results to all enrolled students.`}
          confirmLabel="Publish Results"
          onConfirm={handlePublishConfirm}
          loading={isSubmitting}
        />
      )}

      {/* Delete Exam Confirmation Dialog (DELETE /api/v1/exams/{id}) */}
      {deletingExam && (
        <ConfirmationDialog
          open={!!deletingExam}
          onOpenChange={(open) => {
            if (!open) setDeletingExam(null);
          }}
          title="Delete Draft Examination"
          description={`Are you sure you want to delete the draft examination "${deletingExam.title}"? This action cannot be undone.`}
          confirmLabel="Delete Examination"
          destructive
          onConfirm={handleDeleteConfirm}
          loading={isSubmitting}
        />
      )}
    </div>
  );
}
