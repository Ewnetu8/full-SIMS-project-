import * as React from 'react';
import type { Metadata } from 'next';
import { LecturerShell, ExamWizard } from '@/features/lecturer/components';

export const metadata: Metadata = {
  title: 'Create Examination — ExamSphere',
  description: 'Build a new examination using our multi-step question paper wizard.',
};

export default function CreateExamPage() {
  return (
    <LecturerShell>
      <ExamWizard />
    </LecturerShell>
  );
}
