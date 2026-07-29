import * as React from 'react';

import { LecturerShell, LecturerCourseList } from '@/features/lecturer/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Courses — ExamSphere',
  description: 'Browse your assigned courses, enrolled students, and associated examinations.',
};

export default function LecturerCoursesPage() {
  return (
    <LecturerShell>
      <LecturerCourseList />
    </LecturerShell>
  );
}
