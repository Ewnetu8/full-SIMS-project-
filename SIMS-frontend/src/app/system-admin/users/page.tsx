import { UserManagement } from '@/features/admin/components';
import { SystemAdminShell } from '@/features/system-admin';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'University Administrators — System Administrator',
  description: 'Create, provision, and manage institutional administrators assigned across all universities.',
};

export default function SystemAdminUsersPage() {
  return (
    <SystemAdminShell
      breadcrumbItems={[
        { label: 'System Admin', href: '/system-admin/dashboard' },
        { label: 'University Administrators' },
      ]}
    >
      <UserManagement />
    </SystemAdminShell>
  );
}
