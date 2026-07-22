import type { Metadata } from 'next';
import { AdminShell, DepartmentManagement } from '@/features/admin/components';

export const metadata: Metadata = {
  title: 'Department Management — ExamSphere Admin',
  description: 'Manage academic departments, Heads of Department, and course allocations.',
};

export default function AdminDepartmentsPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Departments' },
      ]}
    >
      <DepartmentManagement />
    </AdminShell>
  );
}
