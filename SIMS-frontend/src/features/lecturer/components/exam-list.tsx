'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  FileQuestion,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { EmptyState, toast } from '@/components/feedback';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { ROUTES } from '@/constants';
import {
  calculateDurationMinutes,
  formatDurationMinutes,
  toDatetimeLocalValue,
} from '@/utils/date';

import { lecturerService } from '../services';
import { useLecturerStore } from '../store';

import type { Course, ExamStatus, LecturerExam } from '../types';

export function ExamList() {
  const router = useRouter();
  const { searchQuery, statusFilter, courseFilter, setSearchQuery, setStatusFilter, setCourseFilter } =
    useLecturerStore();

  const [exams, setExams] = React.useState<LecturerExam[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [deletingExam, setDeletingExam] = React.useState<LecturerExam | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [publishingExam, setPublishingExam] = React.useState<LecturerExam | null>(null);
  const [isPublishing, setIsPublishing] = React.useState(false);

  const [schedulingExam, setSchedulingExam] = React.useState<LecturerExam | null>(null);
  const [scheduleForm, setScheduleForm] = React.useState<{
    startDate: string;
    endDate: string;
  }>({ startDate: '', endDate: '' });
  const [scheduleError, setScheduleError] = React.useState<string | null>(null);
  const [isScheduling, setIsScheduling] = React.useState(false);

  const [actionMenuId, setActionMenuId] = React.useState<string | null>(null);

  const fetchExams = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const backendParams: import('@/types/lecturer').ListExaminationsParams = {};
      if (statusFilter !== 'ALL') {
        backendParams.status = statusFilter;
      }
      if (courseFilter !== 'ALL') {
        backendParams.course_offering = courseFilter;
      }

      const [loadedExams, loadedCourses] = await Promise.all([
        lecturerService.getExams(backendParams),
        lecturerService.getCourses(),
      ]);

      setExams(loadedExams);
      setCourses(loadedCourses);
    } catch (err: any) {
      console.error('Failed to load exams:', err);
      const status = err?.response?.status;
      if (status === 401) {
        setError('Unauthorized. Please sign in to view your examinations.');
      } else if (status === 403) {
        setError('You do not have permission to view examinations.');
      } else {
        setError(err?.message || 'Failed to load examinations. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, courseFilter]);

  React.useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // Lightweight polling for dynamic status updates (SCHEDULED/ACTIVE exams)
  React.useEffect(() => {
    const hasDynamicExams = exams.some(
      (e) => e.status === 'SCHEDULED' || e.status === 'ACTIVE'
    );
    if (!hasDynamicExams) return;

    const interval = setInterval(() => {
      fetchExams();
    }, 30000);

    return () => clearInterval(interval);
  }, [exams, fetchExams]);

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return exams;
    return exams.filter(
      (exam) =>
        exam.title.toLowerCase().includes(q) ||
        exam.courseCode.toLowerCase().includes(q) ||
        exam.courseName.toLowerCase().includes(q),
    );
  }, [exams, searchQuery]);

  function handleOpenScheduleModal(exam: LecturerExam) {
    console.log('[SCHEDULE DEBUG] Selected exam', exam);
    const startDate = exam.startDate ? toDatetimeLocalValue(exam.startDate) : '';
    const endDate = exam.endDate ? toDatetimeLocalValue(exam.endDate) : '';
    console.log('[SCHEDULE DEBUG] Schedule form', { startDate, endDate });

    setSchedulingExam(exam);
    setScheduleForm({
      startDate,
      endDate,
    });
    setScheduleError(null);
  }

  const calculatedDuration = calculateDurationMinutes(scheduleForm.startDate, scheduleForm.endDate);

  async function handleDeleteConfirm() {
    if (!deletingExam) return;

    if (deletingExam.status !== 'DRAFT') {
      toast.error('Cannot Delete Examination', {
        description: `${deletingExam.status} examinations cannot be deleted. Only DRAFT examinations can be deleted.`,
      });
      setDeletingExam(null);
      return;
    }

    setIsDeleting(true);
    try {
      await lecturerService.deleteExam(deletingExam.id);
      setExams((prev) => prev.filter((e) => e.id !== deletingExam.id));
      toast.success('Examination deleted', {
        description: `"${deletingExam.title}" was permanently removed.`,
      });
      setDeletingExam(null);
    } catch (err: any) {
      console.error('[DELETE EXAM ERROR]', {
        status: err?.response?.status,
        data: err?.response?.data,
      });
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail || err?.message;
      if (status === 409) {
        toast.error('Cannot Delete Examination', {
          description: detail || 'This examination cannot be deleted because student attempts already exist.',
        });
      } else if (status === 403) {
        toast.error('Permission Denied', {
          description: detail || 'You do not have permission to delete this examination.',
        });
      } else if (status === 404) {
        toast.error('Not Found', {
          description: 'Examination not found or already deleted.',
        });
      } else if (status === 400) {
        toast.error('Cannot Delete Examination', {
          description: detail || 'Validation error while attempting deletion.',
        });
      } else {
        toast.error('Delete Failed', {
          description: detail || 'Could not delete examination.',
        });
      }
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleScheduleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!schedulingExam) return;
    setScheduleError(null);

    if (!scheduleForm.startDate || !scheduleForm.endDate) {
      setScheduleError('Please enter both start and end dates/times.');
      return;
    }

    const start = new Date(scheduleForm.startDate);
    const end = new Date(scheduleForm.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setScheduleError('Please enter valid start and end dates/times.');
      return;
    }

    if (end <= start) {
      setScheduleError('End time must be after start time.');
      return;
    }

    if (!calculatedDuration || calculatedDuration <= 0) {
      setScheduleError('Duration must be greater than 0 minutes.');
      return;
    }

    setIsScheduling(true);
    try {
      const schedulePayload = {
        startDate: scheduleForm.startDate,
        endDate: scheduleForm.endDate,
        durationMinutes: calculatedDuration,
      };
      console.log('[SCHEDULE DEBUG] Schedule payload', schedulePayload);
      const updated = await lecturerService.scheduleExam(schedulingExam.id, schedulePayload);
      console.log('[SCHEDULE DEBUG] Updated exam', updated);

      setExams((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(schedulingExam.status === 'SCHEDULED' ? 'Schedule Updated' : 'Examination Scheduled', {
        description: `Examination window set to ${formatDurationMinutes(updated.durationMinutes)}.`,
      });
      setSchedulingExam(null);
      fetchExams();
    } catch (err: any) {
      const responseData = err?.response?.data;
      const detail =
        responseData?.detail ||
        (Array.isArray(responseData?.errors) ? responseData.errors.join('. ') : undefined) ||
        err?.message;
      setScheduleError(detail || 'Failed to schedule exam. Ensure all questions are objective/auto-gradable.');
      toast.error('Scheduling Failed', {
        description: detail || 'Validation error while scheduling.',
      });
    } finally {
      setIsScheduling(false);
    }
  }

  async function handlePublishConfirm() {
    if (!publishingExam) return;
    setIsPublishing(true);
    try {
      const published = await lecturerService.publishExam(publishingExam.id);
      setExams((prev) => prev.map((item) => (item.id === published.id ? published : item)));
      toast.success('Examination Published', {
        description: 'Grades released and enrolled students notified.',
      });
      setPublishingExam(null);
    } catch (err: any) {
      console.error('[PUBLISH EXAM ERROR]', {
        status: err?.response?.status,
        data: err?.response?.data,
      });
      const backendErrors = err?.response?.data?.errors;
      const backendDetail = err?.response?.data?.detail;
      const formattedErrors = Array.isArray(backendErrors) && backendErrors.length > 0
        ? backendErrors.join(' ')
        : undefined;

      const detail = formattedErrors || backendDetail || err?.message;
      toast.error('Cannot Publish Examination', {
        description: detail || 'All student attempts must be fully graded with results generated before publishing.',
      });
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleDuplicate(examId: string) {
    setActionMenuId(null);
    try {
      const dup = await lecturerService.duplicateExam(examId);
      if (dup) {
        setExams((prev) => [dup, ...prev]);
        toast.success('Exam duplicated', {
          description: `Created "${dup.title}". Saved as Draft.`,
        });
      }
    } catch (err: any) {
      toast.error('Failed to duplicate exam', {
        description: err?.message || 'Please check backend logs.',
      });
    }
  }

  if (loading && exams.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground">Could not load examinations</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">{error}</p>
        <Button onClick={() => fetchExams()} variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Examination Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Author, schedule, manage, and publish course examinations across their lifecycle.
            </p>
          </div>
          <Button asChild size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            <Link href={ROUTES.LECTURER.EXAM_CREATE}>Create New Exam</Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by title, code, or course name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ExamStatus | 'ALL')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
            </SelectContent>
          </Select>

          <Select value={courseFilter} onValueChange={(v) => setCourseFilter(v)}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Course Offerings</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code} {c.section ? `(Sec ${c.section})` : ''} - {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Exams count */}
        <p className="text-xs text-muted-foreground">
          {filtered.length} examination{filtered.length !== 1 ? 's' : ''} found
        </p>

        {/* Exam cards */}
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((exam) => {
              const isDraft = exam.status === 'DRAFT';
              const isScheduled = exam.status === 'SCHEDULED';
              const isActive = exam.status === 'ACTIVE';
              const isClosed = exam.status === 'CLOSED';
              const isPublished = exam.status === 'PUBLISHED';

              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card hoverable className="overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Exam info */}
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {exam.courseCode}
                            </span>
                            <Badge
                              variant={
                                isPublished || isActive
                                    ? 'success'
                                    : isScheduled
                                    ? 'info'
                                    : isDraft
                                    ? 'warning'
                                    : 'secondary'
                              }
                            >
                              {exam.status}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-foreground leading-snug">{exam.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {exam.courseName || exam.description}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {formatDurationMinutes(exam.durationMinutes)}
                            </span>
                            <span>·</span>
                            <span>{exam.totalMarks} total marks</span>
                            <span>·</span>
                            <span>{exam.questions.length} questions</span>
                            {exam.startDate ? (
                              <>
                                <span>·</span>
                                <span>
                                  Window: {new Date(exam.startDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                  {exam.endDate ? ` — ${new Date(exam.endDate).toLocaleTimeString([], { timeStyle: 'short' })}` : ''}
                                </span>
                              </>
                            ) : (
                              <>
                                <span>·</span>
                                <span className="italic">Not Scheduled</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions strictly gated by status */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {/* 1. Preview: Available in all states */}
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            leftIcon={<Eye className="h-3.5 w-3.5" />}
                          >
                            <Link href={ROUTES.LECTURER.EXAM_PREVIEW(exam.id)}>Preview</Link>
                          </Button>

                          {/* 2. DRAFT State: Edit, Schedule, Delete */}
                          {isDraft && (
                            <>
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                leftIcon={<Pencil className="h-3.5 w-3.5" />}
                              >
                                <Link href={ROUTES.LECTURER.EXAM_EDIT(exam.id)}>Edit</Link>
                              </Button>

                              <Button
                                variant="default"
                                size="sm"
                                leftIcon={<Calendar className="h-3.5 w-3.5" />}
                                onClick={() => handleOpenScheduleModal(exam)}
                              >
                                Schedule
                              </Button>
                            </>
                          )}

                          {/* 3. SCHEDULED State: Edit, Edit Schedule */}
                          {isScheduled && (
                            <>
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                leftIcon={<Pencil className="h-3.5 w-3.5" />}
                              >
                                <Link href={ROUTES.LECTURER.EXAM_EDIT(exam.id)}>Edit</Link>
                              </Button>

                              <Button
                                variant="default"
                                size="sm"
                                leftIcon={<Calendar className="h-3.5 w-3.5" />}
                                onClick={() => handleOpenScheduleModal(exam)}
                              >
                                Edit Schedule
                              </Button>
                            </>
                          )}

                          {/* 4. ACTIVE / CLOSED / PUBLISHED States: Submissions & Results */}
                          {(isActive || isClosed || isPublished) && (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              leftIcon={<Users className="h-3.5 w-3.5" />}
                            >
                              <Link href={ROUTES.LECTURER.EXAM_SUBMISSIONS(exam.id)}>
                                {isPublished ? 'Results' : 'Submissions'}
                              </Link>
                            </Button>
                          )}

                          {/* 5. CLOSED State: Publish Results Gate */}
                          {isClosed && (
                            <Button
                              variant="default"
                              size="sm"
                              leftIcon={<Upload className="h-3.5 w-3.5" />}
                              onClick={() => setPublishingExam(exam)}
                            >
                              Publish Results
                            </Button>
                          )}

                          {/* More dropdown (for duplicate or delete when DRAFT) */}
                          <div className="relative">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() =>
                                setActionMenuId((prev) => (prev === exam.id ? null : exam.id))
                              }
                              aria-label="More actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            {actionMenuId === exam.id && (
                              <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-border bg-popover shadow-xl">
                                <button
                                  onClick={() => handleDuplicate(exam.id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-t-lg"
                                >
                                  <Copy className="h-3.5 w-3.5" /> Duplicate
                                </button>
                                {isDraft ? (
                                  <button
                                    onClick={() => {
                                      setActionMenuId(null);
                                      setDeletingExam(exam);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-destructive rounded-b-lg border-t border-border/50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete Exam
                                  </button>
                                ) : (
                                  <div
                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground/80 bg-muted/30 cursor-not-allowed rounded-b-lg border-t border-border/50"
                                    title={
                                      isScheduled
                                        ? 'Scheduled examinations cannot be deleted.'
                                        : isActive
                                        ? 'Active examinations cannot be deleted.'
                                        : isClosed
                                        ? 'Closed examinations cannot be deleted.'
                                        : 'Published examinations cannot be deleted.'
                                    }
                                  >
                                    <Trash2 className="h-3.5 w-3.5 opacity-40 shrink-0" />
                                    <span className="truncate">
                                      {isScheduled
                                        ? 'Scheduled exam cannot be deleted'
                                        : isActive
                                        ? 'Active exam cannot be deleted'
                                        : isClosed
                                        ? 'Closed exam cannot be deleted'
                                        : 'Published exam cannot be deleted'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <Card className="border-dashed border-border/80">
              <CardContent className="p-12">
                <EmptyState
                  title={exams.length === 0 ? 'No examinations created' : 'No matching exams found'}
                  description={
                    exams.length === 0
                      ? 'You have not created any examinations yet. Click "Create New Exam" to get started.'
                      : 'No examinations match your current search and filter settings.'
                  }
                  action={
                    exams.length === 0
                      ? {
                          label: 'Create First Exam',
                          onClick: () => router.push(ROUTES.LECTURER.EXAM_CREATE),
                        }
                      : undefined
                  }
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Exam Confirmation Dialog */}
      <Dialog open={!!deletingExam} onOpenChange={(open) => !open && setDeletingExam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Examination?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong className="text-foreground">{deletingExam?.title}</strong>?
              This action cannot be undone. Examinations with student attempts cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingExam(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} loading={isDeleting}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Results Confirmation Dialog */}
      <Dialog open={!!publishingExam} onOpenChange={(open) => !open && setPublishingExam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Examination Results?</DialogTitle>
            <DialogDescription>
              Publishing will make graded results visible to all enrolled students for{' '}
              <strong className="text-foreground">{publishingExam?.title}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 bg-muted/40 rounded-lg border border-border/70 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Publish Gate Requirements:
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Status must be <strong>CLOSED</strong></li>
              <li>Every student attempt must be in <strong>GRADED</strong> state</li>
              <li>Status transitions: <strong>CLOSED → PUBLISHED</strong></li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishingExam(null)} disabled={isPublishing}>
              Cancel
            </Button>
            <Button onClick={handlePublishConfirm} loading={isPublishing}>
              Confirm & Publish Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Window Dialog */}
      <Dialog open={!!schedulingExam} onOpenChange={(open) => !open && setSchedulingExam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {schedulingExam?.status === 'SCHEDULED' ? 'Edit Examination Schedule' : 'Schedule Examination'}
            </DialogTitle>
            <DialogDescription>
              Set the active time window for <strong className="text-foreground">{schedulingExam?.title}</strong>.
              Duration is calculated automatically from the start and end times.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <DialogBody className="space-y-4">
              {scheduleError && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{scheduleError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Start Window (Local Time)</label>
                  <Input
                    type="datetime-local"
                    value={scheduleForm.startDate}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    required
                  />
                  <p className="text-2xs text-muted-foreground">Select start date & time.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">End Window (Local Time)</label>
                  <Input
                    type="datetime-local"
                    value={scheduleForm.endDate}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    required
                  />
                  <p className="text-2xs text-muted-foreground">Must be after start window.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Duration (Calculated Automatically)</label>
                <Input
                  type="text"
                  readOnly
                  disabled
                  value={formatDurationMinutes(calculatedDuration)}
                  className="bg-muted/50 font-medium cursor-not-allowed"
                />
                <p className="text-2xs text-muted-foreground">
                  Individual student attempt time limit: {calculatedDuration ? `${calculatedDuration} minutes` : 'select start & end window above'}.
                </p>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg border border-border/70 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Scheduling Gate Requirements:
                </p>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>Status: <strong>{schedulingExam?.status === 'SCHEDULED' ? 'SCHEDULED (Updating Schedule)' : 'DRAFT → SCHEDULED'}</strong></li>
                  <li>Questions must be objective/auto-gradable (no Essay/Short Answer, exactly 1 correct option per MCQ)</li>
                </ul>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSchedulingExam(null)} disabled={isScheduling}>
                Cancel
              </Button>
              <Button type="submit" loading={isScheduling}>
                {schedulingExam?.status === 'SCHEDULED' ? 'Save Schedule Changes' : 'Confirm & Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
