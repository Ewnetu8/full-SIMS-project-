import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants';

export default function AdminRootPage() {
  redirect(ROUTES.ADMIN.DASHBOARD);
}
