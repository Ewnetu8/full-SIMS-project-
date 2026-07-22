import type { Metadata } from 'next';
import { AdminShell, UserManagement } from '@/features/admin/components';

export const metadata: Metadata = {
  title: 'User Management — ExamSphere Admin',
  description: 'Manage users, assign roles, and configure system permissions.',
};

export default function AdminUsersPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'User Management' },
      ]}
    >
      <UserManagement />
    </AdminShell>
  );
}
