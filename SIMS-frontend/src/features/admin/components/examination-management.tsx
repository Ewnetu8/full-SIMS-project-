'use client';

import {
  ClipboardCheck,
  Eye,
  Archive,
  Trash2,
  Calendar,
  Clock,
  UserCheck,
  Users,
} from 'lucide-react';
import * as React from 'react';

import { ConfirmationDialog, toast } from '@/components/feedback';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Progress,
  SearchInput,
} from '@/components/ui';
import { useAdminStore } from '../store';
import type { AdminExamOverview } from '../types';

export function ExaminationManagement() {
  const {
    exams,
    examSearchQuery,
    examStatusFilter,
    archiveExam,
    deleteExam,
    setExamSearchQuery,
    setExamStatusFilter,
  } = useAdminStore();

  const [selectedExam, setSelectedExam] = React.useState<AdminExamOverview | null>(null);
  const [deletingExam, setDeletingExam] = React.useState<AdminExamOverview | null>(null);

  const handleArchive = (exam: AdminExamOverview) => {
    archiveExam(exam.id);
    toast.success('Exam archived', { description: `${exam.title} archived.` });
  };

  const handleDeleteConfirm = () => {
    if (deletingExam) {
      deleteExam(deletingExam.id);
      toast.success('Exam removed', { description: `${deletingExam.title} deleted.` });
      setDeletingExam(null);
    }
  };

  const filteredExams = exams.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(examSearchQuery.toLowerCase()) ||
      e.courseCode.toLowerCase().includes(examSearchQuery.toLowerCase()) ||
      e.lecturerName.toLowerCase().includes(examSearchQuery.toLowerCase());

    const matchesStatus = examStatusFilter === 'ALL' || e.status === examStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-sky-500" /> Institutional Examination Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor examination sessions, participation metrics, publication statuses, and archive records.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <SearchInput
              placeholder="Search exam title, course code, lecturer..."
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
              <option value="ALL">All Exam Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active / Live</option>
              <option value="completed">Completed</option>
              <option value="grading">AI Grading In Progress</option>
              <option value="published">Published Results</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredExams.map((exam) => {
          const participationPct =
            exam.totalStudents > 0
              ? Math.round((exam.participatedStudents / exam.totalStudents) * 100)
              : 0;

          return (
            <Card key={exam.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-500">{exam.courseCode}</span>
                    <h3 className="text-base font-semibold text-foreground mt-0.5">{exam.title}</h3>
                    <p className="text-xs text-muted-foreground">{exam.courseName}</p>
                  </div>
                  <Badge
                    variant={
                      exam.status === 'published'
                        ? 'success'
                        : exam.status === 'active'
                        ? 'destructive'
                        : exam.status === 'grading'
                        ? 'warning'
                        : 'secondary'
                    }
                    className="capitalize"
                  >
                    {exam.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Lecturer: <strong className="text-foreground">{exam.lecturerName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-sky-400" />
                    <span>Window: {exam.startDate} — {exam.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Duration: {exam.durationMinutes} Minutes</span>
                  </div>
                </div>

                {/* Participation Bar */}
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> Participation Rate
                    </span>
                    <span className="font-bold text-foreground">
                      {exam.participatedStudents} / {exam.totalStudents} ({participationPct}%)
                    </span>
                  </div>
                  <Progress value={participationPct} className="h-2" />
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedExam(exam)}>
                  <Eye className="h-4 w-4 mr-1" /> View Details
                </Button>
                {exam.status !== 'archived' && (
                  <Button variant="outline" size="sm" onClick={() => handleArchive(exam)}>
                    <Archive className="h-4 w-4 mr-1 text-amber-500" /> Archive
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                  onClick={() => setDeletingExam(exam)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* View Exam Details Modal */}
      {selectedExam && (
        <Dialog open={!!selectedExam} onOpenChange={() => setSelectedExam(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-sky-500" /> Examination Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs text-foreground">
              <div>
                <span className="font-mono font-bold text-emerald-500">{selectedExam.courseCode}</span>
                <h3 className="text-base font-bold text-foreground mt-0.5">{selectedExam.title}</h3>
                <p className="text-muted-foreground">{selectedExam.courseName}</p>
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{selectedExam.department}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Examiner / Lecturer:</span>
                  <span className="font-medium">{selectedExam.lecturerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Examination Status:</span>
                  <Badge variant="secondary" className="capitalize">{selectedExam.status}</Badge>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Start Window:</span>
                  <span className="font-medium">{selectedExam.startDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">End Window:</span>
                  <span className="font-medium">{selectedExam.endDate}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Student Submissions:</span>
                  <span className="font-bold text-emerald-500">
                    {selectedExam.participatedStudents} of {selectedExam.totalStudents} Students
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setSelectedExam(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Exam Confirmation */}
      {deletingExam && (
        <ConfirmationDialog
          open={!!deletingExam}
          onOpenChange={(open) => {
            if (!open) setDeletingExam(null);
          }}
          title="Remove Examination Record"
          description={`Are you sure you want to remove '${deletingExam.title}' (${deletingExam.courseCode})? This UI action will remove the record from administrative overview.`}
          confirmLabel="Remove Exam"
          destructive
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingExam(null)}
        />
      )}
    </div>
  );
}
