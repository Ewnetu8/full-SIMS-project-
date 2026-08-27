import { SystemAdminShell, SystemAdminDashboard } from '@/features/system-admin';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Administrator Dashboard — ExamSphere',
  description: 'Global system administration dashboard for managing universities and platform accounts.',
};

export default function SystemAdminDashboardPage() {
  return (
    <SystemAdminShell
      breadcrumbItems={[
        { label: 'System Admin', href: '/system-admin/dashboard' },
        { label: 'Overview' },
      ]}
    >
      <SystemAdminDashboard />
    </SystemAdminShell>
  );
}
