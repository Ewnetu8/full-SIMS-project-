'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ExaminationRunner } from '@/features/examination/components';
import { examinationService } from '@/features/examination/services';
import { LoadingSpinner, ErrorState } from '@/components/feedback';
import { ROUTES } from '@/constants';
import type { ExaminationSession } from '@/features/examination/types';

export default function ExamTakePage() {
  const params = useParams();
  const router = useRouter();

  const [session, setSession] = React.useState<ExaminationSession | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const examId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  React.useEffect(() => {
    if (!examId) return;
    let isMounted = true;

    async function loadSession() {
      try {
        setLoading(true);
        setError(null);
        const data = await examinationService.startExamSession(examId!);
        if (isMounted) {
          setSession(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          const message =
            err?.message ||
            err?.detail ||
            'This exam is not currently available. Please check the exam schedule.';
          setError(message);
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      isMounted = false;
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
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-background">
        <ErrorState
          title="Unable to start exam"
          description={error || 'The examination could not be loaded.'}
          onRetry={() => router.push(ROUTES.STUDENT.EXAMS)}
          retryLabel="Back to Available Exams"
        />
      </div>
    );
  }

  return <ExaminationRunner session={session} />;
}
