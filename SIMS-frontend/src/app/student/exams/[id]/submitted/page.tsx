import * as React from 'react';
import type { Metadata } from 'next';
import { ExamSubmittedClient } from '@/features/examination/components';

export const metadata: Metadata = {
  title: 'Examination Submitted — ExamSphere',
  description: 'Examination submission confirmation and receipt.',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExamSubmittedPage({ params }: Props) {
  const { id } = await params;
  return <ExamSubmittedClient examId={id} />;
}
