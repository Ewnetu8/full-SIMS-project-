'use client';

import { ROUTES } from '@/constants';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { EnrollmentOverrideManagement } from '@/features/admin/components/enrollment-override-management';

export default function EnrollmentOverridesPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: ROUTES.ADMIN.DASHBOARD },
        { label: 'Courses', href: ROUTES.ADMIN.COURSES },
        { label: 'Enrollment Overrides' },
      ]}
    >
      <EnrollmentOverrideManagement />
    </AdminShell>
  );
}
