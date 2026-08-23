import { AdminProfile, AdminShell } from '@/features/admin/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administrator Profile — ExamSphere Admin',
  description: 'View and update system administrator profile details.',
};

export default function AdminProfilePage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Administrator Profile' },
      ]}
    >
      <AdminProfile />
    </AdminShell>
  );
}
