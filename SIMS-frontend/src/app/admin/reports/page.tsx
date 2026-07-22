import type { Metadata } from 'next';
import { AdminShell, ReportsAnalytics } from '@/features/admin/components';

export const metadata: Metadata = {
  title: 'Reports & Analytics — ExamSphere Admin',
  description: 'Institutional academic performance analytics and system usage charts.',
};

export default function AdminReportsPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Reports & Analytics' },
      ]}
    >
      <ReportsAnalytics />
    </AdminShell>
  );
}
