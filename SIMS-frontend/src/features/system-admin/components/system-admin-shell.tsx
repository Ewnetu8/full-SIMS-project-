'use client';

import {
  LayoutDashboard,
  Users,
  School,
  Bell,
  Building2,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { DashboardLayout } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { NotificationDropdown } from '@/components/navigation';
import { ROUTES } from '@/constants';
import { useRouteProtection } from '@/features/auth/hooks';
import { useNotifications, useMarkNotificationAsRead } from '@/features/notifications';

import type { NavItem } from '@/components/layout/sidebar';

const systemAdminNavigation: NavItem[] = [
  { label: 'Overview', href: ROUTES.SYSTEM_ADMIN.DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Universities', href: ROUTES.SYSTEM_ADMIN.UNIVERSITIES, icon: <School className="h-4 w-4" /> },
  { label: 'University Admins', href: ROUTES.SYSTEM_ADMIN.USERS, icon: <Shield className="h-4 w-4" /> },
  { label: 'Notifications', href: ROUTES.SYSTEM_ADMIN.NOTIFICATIONS, icon: <Bell className="h-4 w-4" /> },
];

export interface SystemAdminShellProps {
  children: React.ReactNode;
  breadcrumbItems?: { label: string; href?: string }[];
  pageTitle?: string;
}

export function SystemAdminShell({ children, breadcrumbItems }: SystemAdminShellProps) {
  const router = useRouter();
  const { data: notifications = [] } = useNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();

  useRouteProtection(['system_admin']);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const dynamicNavItems: NavItem[] = React.useMemo(() => {
    return systemAdminNavigation.map((item) => {
      if (item.href === ROUTES.SYSTEM_ADMIN.NOTIFICATIONS) {
        return {
          ...item,
          badge: unreadCount > 0 ? unreadCount : undefined,
        };
      }
      return item;
    });
  }, [unreadCount]);

  const handleMarkAllRead = React.useCallback(() => {
    const unread = notifications.filter((n) => !n.is_read);
    unread.forEach((n) => {
      markAsReadMutation.mutate(n.id);
    });
  }, [notifications, markAsReadMutation]);

  return (
    <DashboardLayout
      showFooter
      sidebarProps={{ navItems: dynamicNavItems }}
      topNavProps={{
        actions: (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
              <Shield className="h-3 w-3" /> System Admin Scope
            </span>
            {unreadCount > 0 && (
              <span className="hidden text-xs font-medium text-accent sm:inline bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                {unreadCount} alert{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        ),
        notificationMenu: (
          <NotificationDropdown
            notifications={notifications.map((n) => {
              let formattedTime = n.created_at;
              try {
                formattedTime = new Date(n.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
              } catch {
                formattedTime = n.created_at;
              }
              return {
                id: n.id,
                title: 'System Notification',
                message: n.message_body,
                time: formattedTime,
                read: n.is_read,
                type: 'info' as const,
              };
            })}
            onMarkAllRead={handleMarkAllRead}
            onViewAll={() => router.push(ROUTES.SYSTEM_ADMIN.NOTIFICATIONS)}
          />
        ),
      }}
    >
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      )}
      {children}
    </DashboardLayout>
  );
}
