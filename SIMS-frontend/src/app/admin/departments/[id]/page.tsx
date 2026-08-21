import { AdminShell, DepartmentDetail } from '@/features/admin/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Department Details — ExamSphere Admin',
  description: 'Detailed view of department courses, faculty members, and statistics.',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminDepartmentDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Departments', href: '/admin/departments' },
        { label: 'Department Details' },
      ]}
    >
      <DepartmentDetail departmentId={id} />
    </AdminShell>
  );
}
