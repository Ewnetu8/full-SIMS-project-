import type { Metadata } from 'next';
import { AdminShell, CourseManagement } from '@/features/admin/components';

export const metadata: Metadata = {
  title: 'Course Management — ExamSphere Admin',
  description: 'Manage academic courses, credit hours, and lecturer assignments.',
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
