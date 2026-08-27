import { NotificationsView } from '@/features/notifications';
import { SystemAdminShell } from '@/features/system-admin';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications — System Administrator',
  description: 'View system administrator notifications and alerts.',
};

export default function SystemAdminNotificationsPage() {
  return (
    <SystemAdminShell
      breadcrumbItems={[
        { label: 'System Admin', href: '/system-admin/dashboard' },
        { label: 'Notifications' },
      ]}
    >
      <NotificationsView />
    </SystemAdminShell>
  );
}
