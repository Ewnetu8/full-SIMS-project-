import { AdminShell, CourseManagement } from '@/features/admin/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Course Management — ExamSphere Admin',
  description: 'Manage academic course definitions, curriculum subjects, and degree programs.',
};

export default function AdminCoursesPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Courses' },
      ]}
    >
      <CourseManagement />
    </AdminShell>
  );
}
