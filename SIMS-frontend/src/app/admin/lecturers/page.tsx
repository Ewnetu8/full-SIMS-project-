import { AdminShell, LecturerManagement } from '@/features/admin/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lecturer Directory — ExamSphere Admin',
  description: 'Manage faculty members, office locations, and teaching assignments.',
};

export default function AdminLecturersPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Lecturers' },
      ]}
    >
      <LecturerManagement />
    </AdminShell>
  );
}
