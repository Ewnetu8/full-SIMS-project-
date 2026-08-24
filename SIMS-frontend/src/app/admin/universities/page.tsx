import { AdminShell, UniversityManagement } from '@/features/admin/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'University Management — SIMS Admin',
  description: 'Manage higher education institutions and university entities.',
};

export default function AdminUniversitiesPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Universities' },
      ]}
    >
      <UniversityManagement />
    </AdminShell>
  );
}
