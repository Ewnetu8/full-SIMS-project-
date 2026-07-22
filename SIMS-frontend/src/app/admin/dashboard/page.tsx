import type { Metadata } from 'next';
import { AdminShell, DashboardOverview } from '@/features/admin/components';

export const metadata: Metadata = {
  title: 'Administrator Dashboard — ExamSphere',
  description: 'Centralized institution management dashboard.',
};

export default function AdminDashboardPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Overview' },
      ]}
    >
      <DashboardOverview />
    </AdminShell>
  );
}
