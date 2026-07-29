'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

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
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

  async function handleSaveDraft() {
    setSaving(true);
    const instructions = wizardData.instructions.split('\n').filter(Boolean);
    await lecturerService.saveExam({
      ...wizardData,
      id: editingExamId ?? undefined,
      instructions,
      status: 'DRAFT',
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      resetWizard();
      router.push(ROUTES.LECTURER.EXAMS);
    }, 1200);
  }

  async function handlePublish() {
    setPublishing(true);
    const instructions = wizardData.instructions.split('\n').filter(Boolean);
    const exam = await lecturerService.saveExam({
      ...wizardData,
      id: editingExamId ?? undefined,
      instructions,
      status: 'DRAFT',
    });
    await lecturerService.togglePublishExam(exam.id);
    setPublishing(false);
    setSaved(true);
    setTimeout(() => {
      resetWizard();
      router.push(ROUTES.LECTURER.EXAMS);
    }, 1200);
  }

  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-24 gap-4"
      >
        <CheckCircle2 className="h-16 w-16 text-success" />
        <h2 className="text-xl font-semibold text-foreground">Exam saved successfully!</h2>
        <p className="text-muted-foreground text-sm">Redirecting to your exam list…</p>
      </motion.div>
    );
  }

  const totalMarks = wizardData.questions.reduce((acc, q) => acc + q.marks, 0);
  const marksMismatch = totalMarks !== wizardData.totalMarks;

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
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Scheduling</p>
              <p><span className="text-muted-foreground">Start: </span>{wizardData.startDate ? new Date(wizardData.startDate).toLocaleString() : '—'}</p>
              <p><span className="text-muted-foreground">End: </span>{wizardData.endDate ? new Date(wizardData.endDate).toLocaleString() : '—'}</p>
              <p><span className="text-muted-foreground">Questions: </span>{wizardData.questions.length}</p>
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
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
              ⚠ The sum of question marks ({totalMarks}) differs from the Total Marks setting ({wizardData.totalMarks}).
              Consider adjusting before publishing.
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
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Questions</p>
            <div className="divide-y divide-border rounded-xl border border-border text-sm overflow-hidden">
              {wizardData.questions.map((q, i) => (
                <div key={q.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">Q{i + 1}</span>
                    <span className="truncate">{q.prompt || '(no text)'}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
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
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            loading={saving}
            disabled={publishing}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={handlePublish}
            loading={publishing}
            disabled={saving || wizardData.questions.length === 0}
          >
            Publish Exam
          </Button>
        </div>
      </div>
    </div>
  );
}
