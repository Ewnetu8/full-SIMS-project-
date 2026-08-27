import { AdminShell, CourseOfferingManagement } from '@/features/admin/components';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Course Offering Management — ExamSphere Admin',
  description: 'Create and manage specific semester and section offerings of existing courses.',
};

export default function AdminCourseOfferingsPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Course Offerings' },
      ]}
    >
      <CourseOfferingManagement />
    </AdminShell>
  );
}
