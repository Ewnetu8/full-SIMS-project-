import { UniversityManagement } from '@/features/admin/components';
import { SystemAdminShell } from '@/features/system-admin';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'University Management — System Administrator',
  description: 'Manage educational institutions and universities across the SIMS platform.',
};

export default function SystemAdminUniversitiesPage() {
  return (
    <SystemAdminShell
      breadcrumbItems={[
        { label: 'System Admin', href: '/system-admin/dashboard' },
        { label: 'Universities' },
      ]}
    >
      <UniversityManagement />
    </SystemAdminShell>
  );
}
