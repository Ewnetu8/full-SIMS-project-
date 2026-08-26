import * as React from 'react';
import type { Metadata } from 'next';

import { CourseDetails } from '@/features/student/components';

export const metadata: Metadata = {
  title: 'Course Details — ExamSphere',
  description: 'View enrolled course details, credit hours, offering section, and academic status.',
};

export default async function StudentCourseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CourseDetails courseId={id} />;
}
