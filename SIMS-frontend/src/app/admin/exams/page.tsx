import type { Metadata } from 'next';
import { AdminShell, ExaminationManagement } from '@/features/admin/components';

export const metadata: Metadata = {
  title: 'Exams Overview — ExamSphere Admin',
  description: 'Administrative overview of all institution examinations.',
};

export default function AdminExamsPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Exams Overview' },
      ]}
    >
      <ExaminationManagement />
    </AdminShell>
  );
}
