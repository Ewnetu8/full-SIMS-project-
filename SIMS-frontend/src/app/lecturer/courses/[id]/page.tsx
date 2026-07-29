import * as React from 'react';

import { LecturerShell, CourseDetail } from '@/features/lecturer/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Course Details — ExamSphere',
  description: 'View course details, enrolled students, and related examinations.',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <LecturerShell>
      <CourseDetail courseId={id} />
    </LecturerShell>
  );
}
