import * as React from 'react';

import { LecturerShell, LecturerNotifications } from '@/features/lecturer/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications — ExamSphere',
  description: 'Stay informed about exam publications, student submissions, and AI grading updates.',
};

export default function LecturerNotificationsPage() {
  return (
    <LecturerShell>
      <LecturerNotifications />
    </LecturerShell>
  );
}
