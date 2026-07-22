import type { Metadata } from 'next';
import { AdminShell, DepartmentDetail } from '@/features/admin/components';

export const metadata: Metadata = {
  title: 'Department Details — ExamSphere Admin',
  description: 'Detailed view of department courses, faculty members, and statistics.',
};

export default function AdminDepartmentDetailPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Departments', href: '/admin/departments' },
        { label: 'Department Details' },
      ]}
    >
      <DepartmentDetail />
    </AdminShell>
  );
}
