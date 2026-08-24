import { AdminShell } from '@/features/admin/components';
import { AdminResultsPage } from '@/features/results';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Results & Grades — ExamSphere Admin',
  description: 'View examination results and grading status across the university.',
};

export default function AdminResultsRoute() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Results & Grades' },
      ]}
    >
      <AdminResultsPage />
    </AdminShell>
  );
}
