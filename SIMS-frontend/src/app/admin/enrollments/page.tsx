import { AdminShell, EnrollmentManagement } from '@/features/admin/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enrollment Management — ExamSphere Admin',
  description: 'Manage student course enrollments, grade outcomes, and batch imports.',
};

export default function AdminEnrollmentsPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Enrollments' },
      ]}
    >
      <EnrollmentManagement />
    </AdminShell>
  );
}
