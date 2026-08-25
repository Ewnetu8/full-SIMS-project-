import { AdminShell, TeachingAssignmentManagement } from '@/features/admin/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teaching Assignments — ExamSphere Admin',
  description: 'Manage lecturer course offering assignments and teaching permissions.',
};

export default function AdminTeachingAssignmentsPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Teaching Assignments' },
      ]}
    >
      <TeachingAssignmentManagement />
    </AdminShell>
  );
}
