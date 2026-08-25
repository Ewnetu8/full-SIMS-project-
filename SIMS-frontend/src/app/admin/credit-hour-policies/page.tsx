'use client';

import { ROUTES } from '@/constants';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { CreditHourPolicyManagement } from '@/features/admin/components/credit-hour-policy-management';

export default function CreditHourPoliciesPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: ROUTES.ADMIN.DASHBOARD },
        { label: 'Courses', href: ROUTES.ADMIN.COURSES },
        { label: 'Credit Hour Policies' },
      ]}
    >
      <CreditHourPolicyManagement />
    </AdminShell>
  );
}
