import type { Metadata } from 'next';
import { AdminShell, AIGradingMonitor } from '@/features/admin/components';

export const metadata: Metadata = {
  title: 'AI Grading Monitor — ExamSphere Admin',
  description: 'Monitor real-time AI automated grading pipelines and job queues.',
};

export default function AdminAIMonitorPage() {
  return (
    <AdminShell
      breadcrumbItems={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'AI Grading Monitor' },
      ]}
    >
      <AIGradingMonitor />
    </AdminShell>
  );
}
