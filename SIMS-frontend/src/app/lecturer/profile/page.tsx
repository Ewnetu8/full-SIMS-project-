import * as React from 'react';

import { LecturerShell, LecturerProfile } from '@/features/lecturer/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile — Lecturer Dashboard | SIMS',
  description: 'View authenticated lecturer academic profile information, department credentials, and assigned courses.',
};

export default function LecturerProfilePage() {
  return (
    <LecturerShell>
      <LecturerProfile />
    </LecturerShell>
  );
}
