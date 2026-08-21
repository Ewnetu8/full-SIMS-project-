'use client';

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Building2,
  BookOpen,
  ClipboardCheck,
  Brain,
  BarChart3,
  Settings,
  ShieldAlert,
  Landmark,
  Layers,
  Calendar,
  Clock,
  Bell,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { DashboardLayout } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { NotificationDropdown } from '@/components/navigation';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants';

import { useAdminStore } from '../store';
import { useRouteProtection } from '@/features/auth/hooks';

import type { NavItem } from '@/components/layout/sidebar';

const adminNavigation: NavItem[] = [
  { label: 'Overview', href: ROUTES.ADMIN.DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'User Management', href: ROUTES.ADMIN.USERS, icon: <Users className="h-4 w-4" /> },
  { label: 'Student Directory', href: ROUTES.ADMIN.STUDENTS, icon: <GraduationCap className="h-4 w-4" /> },
  { label: 'Lecturer Directory', href: ROUTES.ADMIN.LECTURERS, icon: <UserCheck className="h-4 w-4" /> },
  { label: 'Colleges', href: ROUTES.ADMIN.COLLEGES, icon: <Landmark className="h-4 w-4" /> },
  { label: 'Departments', href: ROUTES.ADMIN.DEPARTMENTS, icon: <Building2 className="h-4 w-4" /> },
  { label: 'Programs', href: ROUTES.ADMIN.PROGRAMS, icon: <Layers className="h-4 w-4" /> },
  { label: 'Academic Years', href: ROUTES.ADMIN.ACADEMIC_YEARS, icon: <Calendar className="h-4 w-4" /> },
  { label: 'Semesters', href: ROUTES.ADMIN.SEMESTERS, icon: <Clock className="h-4 w-4" /> },
  { label: 'Courses', href: ROUTES.ADMIN.COURSES, icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Exams Overview', href: ROUTES.ADMIN.EXAMS, icon: <ClipboardCheck className="h-4 w-4" /> },
  { label: 'AI Grading Monitor', href: ROUTES.ADMIN.AI_MONITOR, icon: <Brain className="h-4 w-4" /> },
  { label: 'Reports & Analytics', href: ROUTES.ADMIN.REPORTS, icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'System Settings', href: ROUTES.ADMIN.SETTINGS, icon: <Settings className="h-4 w-4" /> },
  { label: 'Audit Logs', href: ROUTES.ADMIN.AUDIT_LOGS, icon: <ShieldAlert className="h-4 w-4" /> },
  { label: 'Notifications', href: ROUTES.ADMIN.NOTIFICATIONS, icon: <Bell className="h-4 w-4" /> },
];

export interface AdminShellProps {
  children: React.ReactNode;
  breadcrumbItems?: { label: string; href?: string }[];
  pageTitle?: string;
}

export function AdminShell({ children, breadcrumbItems }: AdminShellProps) {
  const router = useRouter();
  const { notifications, markAllNotificationsRead } = useAdminStore();

  useRouteProtection(['admin']);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const dynamicNavItems: NavItem[] = React.useMemo(() => {
    return adminNavigation.map((item) => {
      if (item.href === ROUTES.ADMIN.NOTIFICATIONS) {
        return {
          ...item,
          badge: unreadCount > 0 ? unreadCount : undefined,
        };
      }
      return item;
    });
  }, [unreadCount]);

  return (
    <DashboardLayout
      showFooter
      sidebarProps={{ navItems: dynamicNavItems }}
      topNavProps={{
        actions: unreadCount > 0 ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-medium text-accent sm:inline bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
              {unreadCount} admin alert{unreadCount > 1 ? 's' : ''}
            </span>
          </div>
        ) : undefined,
        notificationMenu: (
          <NotificationDropdown
            notifications={notifications.map((n) => ({
              id: n.id,
              title: n.title,
              message: n.message,
              time: n.timestamp,
              read: n.read,
              type: (n.category === 'ai' ? 'ai' : n.category === 'security' ? 'warning' : 'info') as any,
            }))}
            onMarkAllRead={markAllNotificationsRead}
            onViewAll={() => router.push(ROUTES.ADMIN.NOTIFICATIONS)}
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
