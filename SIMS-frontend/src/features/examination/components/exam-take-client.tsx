'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ExaminationRunner } from './examination-runner';
import { examinationService } from '../services';
import { LoadingSpinner, ErrorState } from '@/components/feedback';
import { ROUTES } from '@/constants';
import type { ExaminationSession } from '../types';

interface ExamTakeClientProps {
  examId: string;
}

export function ExamTakeClient({ examId }: ExamTakeClientProps) {
  const router = useRouter();
  const [session, setSession] = React.useState<ExaminationSession | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const sessionPromiseRef = React.useRef<Promise<ExaminationSession> | null>(null);

  React.useEffect(() => {
    if (!examId) return;
    console.log('[EXAM TAKE] examId:', examId);

    if (!sessionPromiseRef.current) {
      sessionPromiseRef.current = examinationService.startExamSession(examId);
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);

    sessionPromiseRef.current
      .then((data) => {
        if (!isCancelled) {
          console.log('[EXAM SESSION SUCCESS]', data);
          console.log('[EXAM SESSION ATTEMPT ID]', data?.attemptId);
          console.log('[EXAM SESSION QUESTIONS]', data?.questions);
          console.log('[EXAM SESSION QUESTION COUNT]', data?.questions?.length);
          console.log('[EXAM TIMER]', { durationSeconds: data?.durationSeconds });
          setSession(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[START EXAM ERROR]', err);
        console.error('[START EXAM ERROR DETAILS]', {
          name: err?.name,
          message: err?.message,
          code: err?.code,
          statusCode: err?.statusCode,
          errors: err?.errors,
          status: err?.response?.status,
          responseData: err?.response?.data,
          responseStatusText: err?.response?.statusText,
          responseHeaders: err?.response?.headers,
          requestUrl: err?.config?.url,
          requestMethod: err?.config?.method,
        });

        if (!isCancelled) {
          const message =
            err?.message ||
            err?.detail ||
            err?.response?.data?.detail ||
            'This exam is not currently available. Please check the exam schedule.';
          setError(message);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [examId]);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-muted-foreground">Starting examination session...</p>
      </div>
    );
  }

  if (error || !session) {
    const isAlreadyAttempted = error?.toLowerCase().includes('already attempted');
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-background">
        <ErrorState
          title={isAlreadyAttempted ? 'Exam attempt already exists' : 'Unable to start exam'}
          description={
            isAlreadyAttempted
              ? 'An attempt for this examination has already been created. The current backend API contract does not expose an endpoint to retrieve and resume in-progress attempts. If you have already submitted your exam, your results will appear once grading is finalized.'
              : error || 'The examination could not be loaded.'
          }
          onRetry={() => router.push(ROUTES.STUDENT.EXAMS)}
          retryLabel="Back to Available Exams"
        />
      </div>
    );
  }

  return <ExaminationRunner session={session} />;
}
