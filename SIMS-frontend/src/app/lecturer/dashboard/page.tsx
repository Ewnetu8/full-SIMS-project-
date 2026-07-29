import * as React from 'react';

import { LecturerShell, LecturerDashboardOverview } from '@/features/lecturer/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lecturer Dashboard — ExamSphere',
  description: 'Manage your courses, examinations, and student submissions from one place.',
};

export default function LecturerDashboardPage() {
  return (
    <LecturerShell>
      <LecturerDashboardOverview />
    </LecturerShell>
  );
}
