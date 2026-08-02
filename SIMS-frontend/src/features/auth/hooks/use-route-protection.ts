import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store';
import { ROUTES } from '@/constants';
import type { UserRole } from '@/types';
import { getHomeByRole } from '../utils';

export function useRouteProtection(allowedRoles?: UserRole[]) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  useEffect(() => {
    // Wait until loading is finished to avoid premature redirects
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(getHomeByRole(user.role));
      return;
    }
  }, [isAuthenticated, user, isLoading, allowedRoles, router]);

  return { isAuthenticated, user, isLoading };
}
