import { AdminShell, StudentManagement } from '@/features/admin/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Directory — ExamSphere Admin',
  description: 'View student profiles, GPA standings, and academic programs.',
};

export default function AdminStudentsPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Students' },
      ]}
    >
      <StudentManagement />
    </AdminShell>
  );
}
