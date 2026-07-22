'use client';

import * as React from 'react';
import { LecturerShell, SubmissionsList } from '@/features/lecturer/components';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ExamSubmissionsPage({ params }: Props) {
  const [id, setId] = React.useState<string | null>(null);

  React.useEffect(() => {
    params.then(({ id: resolvedId }) => setId(resolvedId));
  }, [params]);

  if (!id) return null;

  return (
    <LecturerShell>
      <SubmissionsList examId={id} />
    </LecturerShell>
  );
}
