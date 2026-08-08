'use client';

import { AdminShell } from '@/features/admin/components/admin-shell';
import { AcademicYearManagement } from '@/features/admin/components/academic-year-management';
import { ROUTES } from '@/constants';

export default function AcademicYearsPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: ROUTES.ADMIN.DASHBOARD },
        { label: 'Academic Years' },
      ]}
    >
      <AcademicYearManagement />
    </AdminShell>
  );
}
