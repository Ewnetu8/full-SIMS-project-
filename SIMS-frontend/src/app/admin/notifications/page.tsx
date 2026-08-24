import { AdminNotifications, AdminShell } from '@/features/admin/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications — SIMS Admin',
  description: 'View your system notifications and alerts.',
};

export default function AdminNotificationsPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Notifications' },
      ]}
    >
      <AdminNotifications />
    </AdminShell>
  );
}
