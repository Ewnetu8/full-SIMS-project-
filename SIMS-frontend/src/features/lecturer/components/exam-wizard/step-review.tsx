'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, Save, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { toast } from '@/components/feedback';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ROUTES } from '@/constants';

import { lecturerService } from '../../services';
import { useLecturerStore } from '../../store';

interface StepReviewProps {
  onBack: () => void;
  editingExamId: string | null;
}

export function StepReview({ onBack, editingExamId }: StepReviewProps) {
  const router = useRouter();
  const { wizardData, resetWizard } = useLecturerStore();
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [scheduling, setScheduling] = React.useState(false);
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);

  const totalMarks = wizardData.questions.reduce((acc, q) => acc + q.marks, 0);
  const marksMismatch = totalMarks !== wizardData.totalMarks;

  const hasSubjectiveQuestions = wizardData.questions.some(
    (q) => q.type === 'essay' || q.type === 'short_answer'
  );

  async function handleSaveDraft() {
    setSavingDraft(true);
    try {
      const instructions = wizardData.instructions.split('\n').filter(Boolean);
      await lecturerService.saveExam({
        ...wizardData,
        id: editingExamId ?? undefined,
        instructions,
        status: 'DRAFT',
      });

      setSavedMessage('Examination saved as Draft successfully!');
      setTimeout(() => {
        resetWizard();
        router.push(ROUTES.LECTURER.EXAMS);
      }, 1200);
    } catch (err: any) {
      toast.error('Failed to save draft exam', {
        description: err?.response?.data?.detail || err?.message || 'Check your fields and try again.',
      });
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleSaveAndSchedule() {
    if (!wizardData.startDate || !wizardData.endDate) {
      toast.error('Scheduling Dates Required', {
        description: 'Please specify start and end dates/times in the basic information step before scheduling.',
      });
      return;
    }

    const start = new Date(wizardData.startDate);
    const end = new Date(wizardData.endDate);
    const now = new Date();

    if (start <= now) {
      toast.error('Invalid Start Date', {
        description: 'Start window must be in the future to schedule.',
      });
      return;
    }

    if (end <= start) {
      toast.error('Invalid Date Window', {
        description: 'End window must be after start window.',
      });
      return;
    }

    if (hasSubjectiveQuestions) {
      toast.error('Objective Questions Required for Auto-Scheduling', {
        description: 'Scheduling requires objective/auto-gradable questions (MCQ). Save as Draft first if using Essay/Short Answer questions.',
      });
      return;
    }

    setScheduling(true);
    try {
      const instructions = wizardData.instructions.split('\n').filter(Boolean);
      const exam = await lecturerService.saveExam({
        ...wizardData,
        id: editingExamId ?? undefined,
        instructions,
        status: 'DRAFT',
      });

      await lecturerService.scheduleExam(exam.id, {
        startDate: wizardData.startDate,
        endDate: wizardData.endDate,
        durationMinutes: wizardData.durationMinutes,
      });

      setSavedMessage('Examination created and scheduled successfully!');
      setTimeout(() => {
        resetWizard();
        router.push(ROUTES.LECTURER.EXAMS);
      }, 1200);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message;
      toast.error('Scheduling Failed', {
        description: detail || 'Exam was saved as Draft, but scheduling failed.',
      });
    } finally {
      setScheduling(false);
    }
  }

  if (savedMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-24 gap-4"
      >
        <CheckCircle2 className="h-16 w-16 text-success" />
        <h2 className="text-xl font-semibold text-foreground">{savedMessage}</h2>
        <p className="text-muted-foreground text-sm">Redirecting to Examination Management…</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review & Confirm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Exam Details</p>
              <p><span className="text-muted-foreground">Title: </span>{wizardData.title || '—'}</p>
              <p><span className="text-muted-foreground">Duration: </span>{wizardData.durationMinutes} minutes</p>
              <p><span className="text-muted-foreground">Total Marks: </span>{wizardData.totalMarks}</p>
              <p><span className="text-muted-foreground">Passing Score: </span>{wizardData.passingScore}</p>
              <p>
                <span className="text-muted-foreground">Initial Status: </span>
                <Badge variant="warning" className="text-xs">DRAFT</Badge>
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Scheduling Window</p>
              <p><span className="text-muted-foreground">Start: </span>{wizardData.startDate ? new Date(wizardData.startDate).toLocaleString() : '—'}</p>
              <p><span className="text-muted-foreground">End: </span>{wizardData.endDate ? new Date(wizardData.endDate).toLocaleString() : '—'}</p>
              <p><span className="text-muted-foreground">Total Questions: </span>{wizardData.questions.length}</p>
              <p>
                <span className="text-muted-foreground">Marks Allocated: </span>
                <span className={marksMismatch ? 'text-warning font-semibold' : ''}>
                  {totalMarks} / {wizardData.totalMarks}
                </span>
              </p>
            </div>
          </div>

          {/* Warnings */}
          {marksMismatch && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                The sum of question marks ({totalMarks}) differs from the Total Marks setting ({wizardData.totalMarks}). You can still save as Draft and adjust later.
              </span>
            </div>
          )}

          {/* Settings summary */}
          <div className="flex flex-wrap gap-2">
            {wizardData.randomizeQuestions && <Badge variant="info">Randomised Questions</Badge>}
            {wizardData.allowMultipleAttempts && <Badge variant="info">Multiple Attempts</Badge>}
            {wizardData.autoSubmitOnTimeout && <Badge variant="info">Auto-Submit</Badge>}
            {wizardData.showResultsAfterSubmission && <Badge variant="success">Results Shown Post-Submission</Badge>}
          </div>

          {/* Questions list summary */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Questions ({wizardData.questions.length})
            </p>
            <div className="divide-y divide-border rounded-xl border border-border text-sm overflow-hidden">
              {wizardData.questions.map((q, i) => (
                <div key={q.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">Q{i + 1}</span>
                    <span className="truncate">{q.prompt || '(no prompt)'}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-2xs uppercase">{q.type}</Badge>
                    <span>{q.marks} mk</span>
                    {q.required && <Badge variant="secondary">Required</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row justify-between border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back to Questions
        </Button>
        <div className="flex gap-3 flex-wrap">
          <Button
            type="button"
            variant="outline"
            leftIcon={<Save className="h-4 w-4" />}
            onClick={handleSaveDraft}
            loading={savingDraft}
            disabled={scheduling}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            variant="default"
            leftIcon={<Calendar className="h-4 w-4" />}
            onClick={handleSaveAndSchedule}
            loading={scheduling}
            disabled={savingDraft || wizardData.questions.length === 0}
          >
            Save & Schedule Window
          </Button>
        </div>
      </div>
    </div>
  );
}
