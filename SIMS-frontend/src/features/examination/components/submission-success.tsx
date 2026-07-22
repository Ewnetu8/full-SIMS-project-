'use client';

import { CheckCircle2, FileCheck, ArrowRight, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { AppLayout } from '@/components/layout';
import { Button, Card, CardContent } from '@/components/ui';
import { ROUTES } from '@/constants';
import type { SubmissionReceipt } from '../types';

export interface SubmissionSuccessProps {
  receipt: SubmissionReceipt;
  onReturnToDashboard?: () => void;
}

export function SubmissionSuccess({ receipt, onReturnToDashboard }: SubmissionSuccessProps) {
  const formattedTime = new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(receipt.submittedAt));

  return (
    <AppLayout className="min-h-screen bg-muted/20 py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Card className="border-border/80 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-success/15 via-primary/10 to-background p-8 text-center border-b border-border/60">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success shadow-inner">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Examination Submitted Successfully
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your responses have been securely recorded and timestamped by the examination system.
            </p>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* Receipt Summary */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <FileCheck className="h-5 w-5 text-primary" />
                  <span>Official Submission Receipt</span>
                </div>
                <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                  {receipt.receiptId}
                </span>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Exam Title</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{receipt.examTitle}</dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">Course</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {receipt.courseCode} · {receipt.course}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">Lecturer</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{receipt.lecturer}</dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">Submission Time</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{formattedTime}</dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">Answered Questions</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {receipt.answeredCount} of {receipt.totalQuestions} questions
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">Status</dt>
                  <dd className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                    <span className="h-2 w-2 rounded-full bg-success"></span>
                    Recorded & Locked
                  </dd>
                </div>
              </dl>
            </div>

            {/* Next Steps Guidance */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">What happens next?</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Automated objective items (multiple choice, true/false) are queued for evaluation.</li>
                <li>Short answer and essay items will be reviewed by your course lecturer.</li>
                <li>Final grades and detailed feedback will be published on your Student Dashboard when grading is complete.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              {onReturnToDashboard ? (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  leftIcon={<LayoutDashboard className="h-4 w-4" />}
                  onClick={onReturnToDashboard}
                >
                  Return to Dashboard
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full sm:w-auto" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
                  <Link href={ROUTES.STUDENT.DASHBOARD}>Return to Dashboard</Link>
                </Button>
              )}
              <Button asChild className="w-full sm:w-auto" rightIcon={<ArrowRight className="h-4 w-4" />}>
                <Link href={ROUTES.STUDENT.EXAMS}>View Available Exams</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
