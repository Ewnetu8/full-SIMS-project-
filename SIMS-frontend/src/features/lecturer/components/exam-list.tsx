'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive,
  Calendar,
  ChevronDown,
  Copy,
  Eye,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { toast } from '@/components/feedback';
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
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [publishingId, setPublishingId] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<LecturerExam | null>(null);
  const [confirmPublish, setConfirmPublish] = React.useState<LecturerExam | null>(null);
  const [actionMenuId, setActionMenuId] = React.useState<string | null>(null);

  const [schedulingExam, setSchedulingExam] = React.useState<LecturerExam | null>(null);
  const [scheduleForm, setScheduleForm] = React.useState({ startDate: '', endDate: '', durationMinutes: 60 });
  const [isScheduling, setIsScheduling] = React.useState(false);

  const handleScheduleSubmit = async () => {
    if (!schedulingExam) return;
    if (!scheduleForm.startDate || !scheduleForm.endDate) {
      toast.error('Missing dates', { description: 'Start and End dates are required.' });
      return;
    }
    setIsScheduling(true);
    try {
      await lecturerService.scheduleExam(schedulingExam.id, scheduleForm);
      toast.success('Exam Scheduled', { description: `Exam windows updated via DRF schedule API.` });
      setExams((prev) =>
        prev.map((e) =>
          e.id === schedulingExam.id
            ? { ...e, startDate: scheduleForm.startDate, endDate: scheduleForm.endDate, durationMinutes: scheduleForm.durationMinutes }
            : e
        )
      );
      setSchedulingExam(null);
    } catch (err: any) {
      toast.error('Schedule failed', { description: err?.message || 'Could not schedule examination.' });
    } finally {
      setIsScheduling(false);
    }
  };

  React.useEffect(() => {
    async function load() {
      const [e, c] = await Promise.all([lecturerService.getExams(), lecturerService.getCourses()]);
      setExams(e);
      setCourses(c);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = exams.filter((exam) => {
    const matchesSearch =
      !searchQuery ||
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.courseCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || exam.status === statusFilter;
    const matchesCourse = courseFilter === 'ALL' || exam.courseId === courseFilter;
    return matchesSearch && matchesStatus && matchesCourse;
  });

  async function handleDelete(exam: LecturerExam) {
    setDeletingId(exam.id);
    await lecturerService.deleteExam(exam.id);
    setExams((prev) => prev.filter((e) => e.id !== exam.id));
    setConfirmDelete(null);
    setDeletingId(null);
  }

  async function handleTogglePublish(exam: LecturerExam) {
    setPublishingId(exam.id);
    const updated = await lecturerService.togglePublishExam(exam.id);
    if (updated) {
      setExams((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    }
    setConfirmPublish(null);
    setPublishingId(null);
  }

  async function handleDuplicate(examId: string) {
    const copy = await lecturerService.duplicateExam(examId);
    if (copy) {
      setExams((prev) => [copy, ...prev]);
    }
    setActionMenuId(null);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
              Create, manage, publish, and monitor all your academic examinations.
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
              placeholder="Search exams..."
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
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={courseFilter} onValueChange={(v) => setCourseFilter(v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Exams count */}
        <p className="text-xs text-muted-foreground">
          {filtered.length} exam{filtered.length !== 1 ? 's' : ''} found
        </p>

        {/* Exam cards */}
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((exam) => (
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
                              exam.status === 'PUBLISHED'
                                ? 'success'
                                : exam.status === 'DRAFT'
                                ? 'warning'
                                : 'secondary'
                            }
                          >
                            {exam.status}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-foreground leading-snug">{exam.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{exam.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-0.5">
                          <span>{exam.durationMinutes} mins</span>
                          <span>·</span>
                          <span>{exam.totalMarks} marks</span>
                          <span>·</span>
                          <span>{exam.questions.length} questions</span>
                          <span>·</span>
                          <span>Start: {new Date(exam.startDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye className="h-3.5 w-3.5" />}
                        >
                          <Link href={ROUTES.LECTURER.EXAM_PREVIEW(exam.id)}>Preview</Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          leftIcon={<Users className="h-3.5 w-3.5" />}
                        >
                          <Link href={ROUTES.LECTURER.EXAM_SUBMISSIONS(exam.id)}>Submissions</Link>
                        </Button>

                        {/* Publish/Unpublish */}
                        <Button
                          variant={exam.status === 'PUBLISHED' ? 'outline' : 'default'}
                          size="sm"
                          leftIcon={<Upload className="h-3.5 w-3.5" />}
                          onClick={() => setConfirmPublish(exam)}
                          disabled={exam.status === 'CLOSED'}
                        >
                          {exam.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                        </Button>

                        {/* More actions dropdown */}
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
                                onClick={() => {
                                  setActionMenuId(null);
                                  router.push(ROUTES.LECTURER.EXAM_EDIT(exam.id));
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-t-lg"
                              >
                                <Pencil className="h-3.5 w-3.5" /> Edit Exam
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuId(null);
                                  setSchedulingExam(exam);
                                  setScheduleForm({
                                    startDate: exam.startDate ? exam.startDate.slice(0, 16) : '',
                                    endDate: exam.endDate ? exam.endDate.slice(0, 16) : '',
                                    durationMinutes: exam.durationMinutes || 60,
                                  });
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-primary"
                              >
                                <Calendar className="h-3.5 w-3.5" /> Schedule Window
                              </button>
                              <button
                                onClick={() => handleDuplicate(exam.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                              >
                                <Copy className="h-3.5 w-3.5" /> Duplicate
                              </button>
                              <button
                                onClick={() => setActionMenuId(null)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-muted-foreground"
                              >
                                <Archive className="h-3.5 w-3.5" /> Archive (UI only)
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuId(null);
                                  setConfirmDelete(exam);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-destructive rounded-b-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete Exam
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="py-16 text-center rounded-2xl border border-dashed border-border">
              <p className="text-muted-foreground">No exams match your current filters.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setCourseFilter('ALL');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Delete Examination</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              Are you sure you want to permanently delete{' '}
              <strong className="text-foreground">&quot;{confirmDelete?.title}&quot;</strong>? This action will remove the examination and cannot be undone.
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deletingId === confirmDelete?.id}
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              Delete Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Publish/Unpublish Dialog */}
      <Dialog open={!!confirmPublish} onOpenChange={() => setConfirmPublish(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>
              {confirmPublish?.status === 'PUBLISHED' ? 'Unpublish Examination' : 'Publish Examination'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              {confirmPublish?.status === 'PUBLISHED'
                ? `Unpublishing "${confirmPublish?.title}" will prevent students from starting new attempts. Existing student submissions will remain saved.`
                : `Publishing "${confirmPublish?.title}" will make it live and accessible to enrolled students according to the scheduled start time.`}
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPublish(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmPublish?.status === 'PUBLISHED' ? 'destructive' : 'default'}
              loading={publishingId === confirmPublish?.id}
              onClick={() => confirmPublish && handleTogglePublish(confirmPublish)}
            >
              {confirmPublish?.status === 'PUBLISHED' ? 'Unpublish Exam' : 'Publish Exam'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Exam Window Dialog */}
      <Dialog open={!!schedulingExam} onOpenChange={() => setSchedulingExam(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Schedule Examination Window</DialogTitle>
            <DialogDescription>
              Set the active start/end availability windows and duration for &quot;{schedulingExam?.title}&quot;.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 py-3">
            <div>
              <label htmlFor="schedStart" className="text-xs font-medium mb-1.5 block text-foreground">
                Start Window (Date &amp; Time)
              </label>
              <Input
                id="schedStart"
                type="datetime-local"
                value={scheduleForm.startDate}
                onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="schedEnd" className="text-xs font-medium mb-1.5 block text-foreground">
                End Window (Date &amp; Time)
              </label>
              <Input
                id="schedEnd"
                type="datetime-local"
                value={scheduleForm.endDate}
                onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="schedDur" className="text-xs font-medium mb-1.5 block text-foreground">
                Duration (Minutes)
              </label>
              <Input
                id="schedDur"
                type="number"
                value={scheduleForm.durationMinutes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, durationMinutes: Number(e.target.value) })}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSchedulingExam(null)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleSubmit} disabled={isScheduling}>
              {isScheduling ? 'Scheduling...' : 'Save Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
