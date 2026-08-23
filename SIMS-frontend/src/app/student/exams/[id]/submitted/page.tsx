'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { ROUTES } from '@/constants/routes';
import { SubmissionSuccess } from '@/features/examination/components';
import { examinationService } from '@/features/examination/services';
import { useExaminationStore } from '@/features/examination/store/examination-store';
import { type SubmissionReceipt } from '@/features/examination/types/examination.types';

export default function ExamSubmittedPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
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
