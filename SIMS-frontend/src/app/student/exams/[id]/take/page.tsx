import * as React from 'react';
import type { Metadata } from 'next';
import { ExamTakeClient } from '@/features/examination/components';

export const metadata: Metadata = {
  title: 'Examination In Progress — ExamSphere',
  description: 'Examination runner session with live auto-save and timing.',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExamTakePage({ params }: Props) {
  const { id } = await params;
  return <ExamTakeClient examId={id} />;
}
