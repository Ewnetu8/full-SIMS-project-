import * as React from 'react';

import { LecturerShell, LecturerAnalyticsView } from '@/features/lecturer/components';

import type { Metadata } from 'next';

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
