import * as React from 'react';
import type { Metadata } from 'next';
import { LecturerShell, LecturerAnalyticsView } from '@/features/lecturer/components';

export const metadata: Metadata = {
  title: 'Class Analytics — ExamSphere',
  description: 'Aggregated performance metrics and insights across all active examinations.',
};

export default function LecturerAnalyticsPage() {
  return (
    <LecturerShell>
      <LecturerAnalyticsView />
    </LecturerShell>
  );
}
