import * as React from 'react';

import { LecturerShell, LecturerSettings } from '@/features/lecturer/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings — Lecturer Dashboard | SIMS',
  description: 'Manage portal appearance preferences, session security, and notification settings for your lecturer account.',
};

export default function LecturerSettingsPage() {
  return (
    <LecturerShell>
      <LecturerSettings />
    </LecturerShell>
  );
}
