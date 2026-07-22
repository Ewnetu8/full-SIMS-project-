import * as React from 'react';
import type { Metadata } from 'next';
import { LecturerShell, LecturerNotifications } from '@/features/lecturer/components';

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
