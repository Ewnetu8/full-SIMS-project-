'use client';

import * as React from 'react';

import { LecturerShell, ExamWizard } from '@/features/lecturer/components';
import { lecturerService } from '@/features/lecturer/services';

import type { LecturerExam } from '@/features/lecturer/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditExamPage({ params }: Props) {
  const [exam, setExam] = React.useState<LecturerExam | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);
  const [resolvedId, setResolvedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    params.then(({ id }) => {
      setResolvedId(id);
      lecturerService.getExamById(id).then((e) => {
        setExam(e);
        setLoading(false);
      });
    });
  }, [params]);

  if (loading) {
    return (
      <LecturerShell>
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </LecturerShell>
    );
  }

  return (
    <LecturerShell>
      <ExamWizard initialExam={exam} />
    </LecturerShell>
  );
}
