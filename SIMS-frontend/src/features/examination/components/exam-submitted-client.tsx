'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { ROUTES } from '@/constants/routes';
import { SubmissionSuccess } from './submission-success';
import { useExaminationStore } from '../store/examination-store';
import { type SubmissionReceipt } from '../types/examination.types';

interface ExamSubmittedClientProps {
  examId: string;
}

export function ExamSubmittedClient({ examId }: ExamSubmittedClientProps) {
  const router = useRouter();
  const storeReceipt = useExaminationStore((state) => state.receipt);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(storeReceipt);

  useEffect(() => {
    if (!receipt && examId) {
      setReceipt({
        receiptId: `REC-${examId.slice(0, 8).toUpperCase()}`,
        examId,
        examTitle: 'Course Examination',
        course: 'Enrolled Course',
        courseCode: 'COURSE',
        lecturer: 'Course Instructor',
        submittedAt: new Date().toISOString(),
        totalQuestions: 0,
        answeredCount: 0,
      });
    }
  }, [receipt, examId]);

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <SubmissionSuccess
      receipt={receipt}
      onReturnToDashboard={() => router.push(ROUTES.STUDENT.DASHBOARD)}
    />
  );
}
