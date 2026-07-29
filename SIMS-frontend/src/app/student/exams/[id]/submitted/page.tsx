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
      // Fallback mock receipt if store was reset or accessed directly
      const session = examinationService.getSession(examId);
      const examTitle = session ? session.examTitle : 'Course Examination';
      const courseCode = session ? session.courseCode : 'COURSE';

      setReceipt({
        receiptId: `RCP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        examId,
        examTitle,
        course: session ? session.course : 'General Course',
        courseCode,
        lecturer: session ? session.lecturer : 'Course Lecturer',
        submittedAt: new Date().toISOString(),
        totalQuestions: session ? session.questions.length : 0,
        answeredCount: session ? session.questions.length : 0,
      });
    }
  }, [receipt, examId]);

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
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
