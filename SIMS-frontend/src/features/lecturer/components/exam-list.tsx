'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Copy,
  Eye,
  FileCheck,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { EmptyState, ErrorState, SkeletonCard, toast } from '@/components/feedback';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { ROUTES } from '@/constants';

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
    durationMinutes: string | number;
  }>({ startDate: '', endDate: '', durationMinutes: 60 });
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

  async function handleDeleteConfirm() {
    if (!deletingExam) return;
    setIsDeleting(true);
    try {
      await lecturerService.deleteExam(deletingExam.id);
      setExams((prev) => prev.filter((e) => e.id !== deletingExam.id));
      toast.success('Examination deleted', {
        description: `"${deletingExam.title}" was permanently removed.`,
      });
      setDeletingExam(null);
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail || err?.message;
      if (status === 409) {
        toast.error('Cannot Delete Examination', {
          description: 'This examination cannot be deleted because student attempts already exist.',
        });
      } else if (status === 403) {
        toast.error('Permission Denied', {
          description: 'You do not have permission to delete this examination.',
        });
      } else if (status === 404) {
        toast.error('Not Found', {
          description: 'Examination not found.',
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

    const start = new Date(scheduleForm.startDate);
    const end = new Date(scheduleForm.endDate);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setScheduleError('Please enter valid start and end dates/times.');
      return;
    }

    if (start <= now) {
      setScheduleError('Examination start window must be in the future (server clock).');
      return;
    }

    if (end <= start) {
      setScheduleError('Examination end window must be after the start window.');
      return;
    }

    const duration = scheduleForm.durationMinutes === '' ? NaN : Number(scheduleForm.durationMinutes);
    if (scheduleForm.durationMinutes === '' || isNaN(duration) || duration < 1) {
      setScheduleError('Duration must be at least 1 minute.');
      return;
    }

    setIsScheduling(true);
    try {
      const updated = await lecturerService.scheduleExam(schedulingExam.id, {
        startDate: scheduleForm.startDate,
        endDate: scheduleForm.endDate,
        durationMinutes: Number(scheduleForm.durationMinutes),
      });

      setExams((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success('Examination Scheduled', {
        description: `Examination moved from DRAFT to SCHEDULED (${updated.durationMinutes} mins window).`,
      });
      setSchedulingExam(null);
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
      const updated = await lecturerService.publishExamResults(publishingExam.id);
      setExams((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success('Results Published', {
        description: `Results for "${publishingExam.title}" are now published to students.`,
      });
      setPublishingExam(null);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message;
      toast.error('Cannot Publish Results', {
        description:
          detail || 'Publish requires all student attempts to be fully graded with Results created.',
      });
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleDuplicate(examId: string) {
    try {
      const duplicated = await lecturerService.duplicateExam(examId);
      if (duplicated) {
        setExams((prev) => [duplicated, ...prev]);
        toast.success('Exam Duplicated', {
          description: `Created new draft copy: "${duplicated.title}".`,
        });
      }
    } catch (err: any) {
      toast.error('Failed to duplicate exam', {
        description: err?.message || 'Could not duplicate exam.',
      });
    }
    setActionMenuId(null);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Examination Management</h1>
            <p className="text-sm text-muted-foreground">
              Create, manage, schedule, and publish results for your course examinations.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="min-h-[160px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Examination Management</h1>
          <p className="text-sm text-muted-foreground">
            Create, manage, schedule, and publish results for your course examinations.
          </p>
        </div>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6">
            <ErrorState
              title="Unable to load examinations"
              description={error}
              onRetry={fetchExams}
              retryLabel="Retry loading exams"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Examination Management</h1>
            <p className="text-sm text-muted-foreground">
              Create, manage, schedule, and publish results for your academic course examinations.
            </p>
          </div>
          <Button asChild leftIcon={<Plus className="h-4 w-4" />}>
            <Link href={ROUTES.LECTURER.EXAM_CREATE}>Create New Exam</Link>
          </Button>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-52">
            <Input
              placeholder="Search exams by title or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leadingIcon={<Search className="h-4 w-4" />}
              trailingIcon={
                searchQuery ? (
                  <button onClick={() => setSearchQuery('')} className="rounded-full p-0.5 hover:bg-muted">
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : undefined
              }
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ExamStatus | 'ALL')}
          >
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status" />
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
                              <Clock className="h-3 w-3" /> {exam.durationMinutes} mins
                            </span>
                            <span>·</span>
                            <span>{exam.totalMarks} total marks</span>
                            <span>·</span>
                            <span>{exam.questions.length} questions</span>
                            {exam.startDate && (
                              <>
                                <span>·</span>
                                <span>Window: {new Date(exam.startDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
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
                                onClick={() => {
                                  setSchedulingExam(exam);
                                  const now = new Date();
                                  const defaultStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                                  const defaultEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000);
                                  setScheduleForm({
                                    startDate: exam.startDate ? exam.startDate.slice(0, 16) : defaultStart.toISOString().slice(0, 16),
                                    endDate: exam.endDate ? exam.endDate.slice(0, 16) : defaultEnd.toISOString().slice(0, 16),
                                    durationMinutes: exam.durationMinutes || 60,
                                  });
                                  setScheduleError(null);
                                }}
                              >
                                Schedule
                              </Button>
                            </>
                          )}

                          {/* 3. ACTIVE / CLOSED / PUBLISHED States: Submissions & Results */}
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

                          {/* 4. CLOSED State: Publish Results Gate */}
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
                                {isDraft && (
                                  <button
                                    onClick={() => {
                                      setActionMenuId(null);
                                      setDeletingExam(exam);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-destructive rounded-b-lg border-t border-border/50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete Exam
                                  </button>
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
                          label: 'Create New Exam',
                          onClick: () => router.push(ROUTES.LECTURER.EXAM_CREATE),
                        }
                      : {
                          label: 'Clear Filters',
                          onClick: () => {
                            setSearchQuery('');
                            setStatusFilter('ALL');
                            setCourseFilter('ALL');
                          },
                        }
                  }
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ─── Confirm Delete Dialog (DRAFT only) ─────────────────────────────── */}
      <Dialog open={!!deletingExam} onOpenChange={() => setDeletingExam(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Delete Examination</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong className="text-foreground">{deletingExam?.title}</strong>? This action will permanently remove the examination and its associated question configurations.
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingExam(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              loading={isDeleting}
            >
              Delete Examination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Confirm Publish Results Dialog (CLOSED only) ───────────────────── */}
      <Dialog open={!!publishingExam} onOpenChange={() => setPublishingExam(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Publish Examination Results</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              Are you ready to publish final results for{' '}
              <strong className="text-foreground">{publishingExam?.title}</strong>?
            </DialogDescription>
            <p className="text-xs text-muted-foreground mt-3 bg-muted/40 p-3 rounded-lg border border-border/70">
              Publishing moves the exam status from <strong>CLOSED</strong> to <strong>PUBLISHED</strong>. All enrolled students will be able to view their final scores. Ensure all student submissions are fully graded.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishingExam(null)} disabled={isPublishing}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handlePublishConfirm}
              loading={isPublishing}
            >
              Publish Results Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Schedule Window Dialog (DRAFT → SCHEDULED) ──────────────────────── */}
      <Dialog open={!!schedulingExam} onOpenChange={() => setSchedulingExam(null)}>
        <DialogContent size="lg">
          <form onSubmit={handleScheduleSubmit}>
            <DialogHeader>
              <DialogTitle>Schedule Examination Window</DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <DialogDescription>
                Set the active time window and duration for{' '}
                <strong className="text-foreground">{schedulingExam?.title}</strong>.
              </DialogDescription>

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
                  <p className="text-2xs text-muted-foreground">Must be in the future.</p>
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
                <label className="text-xs font-semibold text-foreground">Duration (Minutes)</label>
                <Input
                  type="number"
                  min={1}
                  max={1440}
                  value={scheduleForm.durationMinutes === '' ? '' : scheduleForm.durationMinutes}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      durationMinutes: e.target.value,
                    }))
                  }
                  required
                />
                <p className="text-2xs text-muted-foreground">
                  Individual student attempt time limit in minutes.
                </p>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg border border-border/70 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Scheduling Gate Requirements:
                </p>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>Status will advance: <strong>DRAFT → SCHEDULED</strong></li>
                  <li>Questions must be objective/auto-gradable (no Essay/Short Answer, exactly 1 correct option per MCQ)</li>
                </ul>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSchedulingExam(null)} disabled={isScheduling}>
                Cancel
              </Button>
              <Button type="submit" loading={isScheduling}>
                Confirm & Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
