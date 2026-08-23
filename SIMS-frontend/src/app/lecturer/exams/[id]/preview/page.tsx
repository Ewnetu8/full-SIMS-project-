'use client';

import * as React from 'react';

import { LecturerShell, ExamPreview } from '@/features/lecturer/components';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ExamPreviewPage({ params }: Props) {
  const [id, setId] = React.useState<string | null>(null);

  React.useEffect(() => {
    params.then(({ id: resolvedId }) => setId(resolvedId));
  }, [params]);

  if (!id) return null;

  return (
    <LecturerShell>
      <ExamPreview examId={id} />
    </LecturerShell>
  );
}
