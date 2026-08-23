'use client';

import { AdminShell } from '@/features/admin/components/admin-shell';
import { SemesterManagement } from '@/features/admin/components/semester-management';
import { ROUTES } from '@/constants';

export default function SemestersPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: ROUTES.ADMIN.DASHBOARD },
        { label: 'Semesters' },
      ]}
    >
      <SemesterManagement />
    </AdminShell>
  );
}
