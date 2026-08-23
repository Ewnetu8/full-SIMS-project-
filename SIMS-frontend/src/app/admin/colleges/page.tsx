'use client';

import { AdminShell } from '@/features/admin/components/admin-shell';
import { CollegeManagement } from '@/features/admin/components/college-management';
import { ROUTES } from '@/constants';

export default function CollegesPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: ROUTES.ADMIN.DASHBOARD },
        { label: 'Colleges' },
      ]}
    >
      <CollegeManagement />
    </AdminShell>
  );
}
