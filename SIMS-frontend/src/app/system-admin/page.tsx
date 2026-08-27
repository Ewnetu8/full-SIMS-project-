import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants';

export default function SystemAdminPage() {
  redirect(ROUTES.SYSTEM_ADMIN.DASHBOARD);
}
