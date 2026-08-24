'use client';

import { ROUTES } from '@/constants';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { TagManagement } from '@/features/admin/components/tag-management';

export default function TagsPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: ROUTES.ADMIN.DASHBOARD },
        { label: 'Tags Management' },
      ]}
    >
      <TagManagement />
    </AdminShell>
  );
}
