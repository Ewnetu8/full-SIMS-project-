'use client';

import { AdminShell } from '@/features/admin/components/admin-shell';
import { ProgramManagement } from '@/features/admin/components/program-management';
import { ROUTES } from '@/constants';

export default function ProgramsPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: ROUTES.ADMIN.DASHBOARD },
        { label: 'Programs' },
      ]}
    >
      <ProgramManagement />
    </AdminShell>
  );
}
