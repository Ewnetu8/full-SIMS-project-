import * as React from 'react';
import type { Metadata } from 'next';
import { LecturerShell, ExamList } from '@/features/lecturer/components';

export const metadata: Metadata = {
  title: 'Examinations — ExamSphere',
  description: 'Create, manage, publish, and monitor all your academic examinations.',
};

export default function LecturerExamsPage() {
  return (
    <LecturerShell>
      <ExamList />
    </LecturerShell>
  );
}
