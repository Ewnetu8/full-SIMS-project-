import type { Metadata } from 'next';
import { AdminShell, SystemSettings } from '@/features/admin/components';

export const metadata: Metadata = {
  title: 'System Settings — ExamSphere Admin',
  description: 'Configure institutional settings, examination policies, and AI parameters.',
};

export default function AdminSettingsPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'System Settings' },
      ]}
    >
      <SystemSettings />
    </AdminShell>
  );
}
