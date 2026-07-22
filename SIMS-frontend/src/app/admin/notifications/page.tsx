import type { Metadata } from 'next';
import { AdminNotifications, AdminShell } from '@/features/admin/components';

export const metadata: Metadata = {
  title: 'Admin Notifications — ExamSphere Admin',
  description: 'View administrative alerts, AI notifications, and system security events.',
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
