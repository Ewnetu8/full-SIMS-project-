import { AdminShell, AuditLogs } from '@/features/admin/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audit Logs — ExamSphere Admin',
  description: 'View administrative audit logs, security events, and system activities.',
};

export default function AdminAuditLogsPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Audit Logs' },
      ]}
    >
      <AuditLogs />
    </AdminShell>
  );
}
