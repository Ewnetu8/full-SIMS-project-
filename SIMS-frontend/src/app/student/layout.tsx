import { StudentShell } from '@/features/student/components';

export default function StudentLayout({ children }: LayoutProps<'/student'>) {
  return <StudentShell>{children}</StudentShell>;
}