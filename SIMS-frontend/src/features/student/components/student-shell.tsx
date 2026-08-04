'use client';

import { Bell, BookOpen, ClipboardCheck, GraduationCap, LayoutDashboard, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { DashboardLayout } from '@/components/layout';
import { NotificationDropdown } from '@/components/navigation';
import { ROUTES } from '@/constants';

import { useRouteProtection } from '@/features/auth/hooks';
import { studentService } from '../services';

import type { NavItem } from '@/components/layout/sidebar';

const studentNavigation: NavItem[] = [
  { label: 'Overview', href: ROUTES.STUDENT.DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Available exams', href: ROUTES.STUDENT.EXAMS, icon: <ClipboardCheck className="h-4 w-4" /> },
  { label: 'Completed exams', href: ROUTES.STUDENT.COMPLETED_EXAMS, icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Results & feedback', href: ROUTES.STUDENT.RESULTS, icon: <GraduationCap className="h-4 w-4" /> },
  { label: 'Notifications', href: ROUTES.STUDENT.NOTIFICATIONS, icon: <Bell className="h-4 w-4" />, badge: 3 },
  { label: 'My profile', href: ROUTES.STUDENT.PROFILE, icon: <UserRound className="h-4 w-4" /> },
];

export function StudentShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(() => studentService.getNotifications());

  useRouteProtection(['student']);

  const unread = notifications.filter((notification) => !notification.read);

  return (
    <DashboardLayout
      showFooter
      sidebarProps={{ navItems: studentNavigation }}
      topNavProps={{
        notificationMenu: <NotificationDropdown notifications={notifications} onMarkAllRead={() => setNotifications((items) => items.map((item) => ({ ...item, read: true })))} onViewAll={() => router.push(ROUTES.STUDENT.NOTIFICATIONS)} />,
        actions: unread.length > 0 ? <span className="hidden text-xs text-muted-foreground sm:inline">{unread.length} unread updates</span> : undefined,
      }}
    >
      {children}
    </DashboardLayout>
  );
}