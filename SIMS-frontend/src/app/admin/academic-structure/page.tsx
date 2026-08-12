import { AdminShell } from '@/features/admin/components/admin-shell';
import { AcademicStructureManagement } from '@/features/admin/components/academic-structure-management';

export default function AcademicStructurePage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Academic Structure' },
      ]}
    >
      <AcademicStructureManagement />
    </AdminShell>
  );
}
