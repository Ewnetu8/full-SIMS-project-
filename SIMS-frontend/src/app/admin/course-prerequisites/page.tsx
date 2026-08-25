'use client';

import { ROUTES } from '@/constants';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { CoursePrerequisiteManagement } from '@/features/admin/components/course-prerequisite-management';

export default function CoursePrerequisitesPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: ROUTES.ADMIN.DASHBOARD },
        { label: 'Courses', href: ROUTES.ADMIN.COURSES },
        { label: 'Course Prerequisites' },
      ]}
    >
      <CoursePrerequisiteManagement />
    </AdminShell>
  );
}
