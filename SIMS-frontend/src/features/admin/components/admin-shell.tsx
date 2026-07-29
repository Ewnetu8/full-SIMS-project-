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
  Bell,
  UserPlus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { DashboardLayout } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { NotificationDropdown } from '@/components/navigation';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants';

import { useAdminStore } from '../store';

import type { NavItem } from '@/components/layout/sidebar';

const adminNavigation: NavItem[] = [
  { label: 'Overview', href: ROUTES.ADMIN.DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'User Management', href: ROUTES.ADMIN.USERS, icon: <Users className="h-4 w-4" /> },
  { label: 'Student Directory', href: ROUTES.ADMIN.STUDENTS, icon: <GraduationCap className="h-4 w-4" /> },
  { label: 'Lecturer Directory', href: ROUTES.ADMIN.LECTURERS, icon: <UserCheck className="h-4 w-4" /> },
  { label: 'Departments', href: ROUTES.ADMIN.DEPARTMENTS, icon: <Building2 className="h-4 w-4" /> },
  { label: 'Courses', href: ROUTES.ADMIN.COURSES, icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Exams Overview', href: ROUTES.ADMIN.EXAMS, icon: <ClipboardCheck className="h-4 w-4" /> },
  { label: 'AI Grading Monitor', href: ROUTES.ADMIN.AI_MONITOR, icon: <Brain className="h-4 w-4" />, badge: 'Live' },
  { label: 'Reports & Analytics', href: ROUTES.ADMIN.REPORTS, icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'System Settings', href: ROUTES.ADMIN.SETTINGS, icon: <Settings className="h-4 w-4" /> },
  { label: 'Audit Logs', href: ROUTES.ADMIN.AUDIT_LOGS, icon: <ShieldAlert className="h-4 w-4" /> },
  { label: 'Notifications', href: ROUTES.ADMIN.NOTIFICATIONS, icon: <Bell className="h-4 w-4" />, badge: 2 },
];

export interface AdminShellProps {
  children: React.ReactNode;
  breadcrumbItems?: { label: string; href?: string }[];
  pageTitle?: string;
}

export function AdminShell({ children, breadcrumbItems }: AdminShellProps) {
  const router = useRouter();
  const { notifications, markAllNotificationsRead } = useAdminStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DashboardLayout
      showFooter
      sidebarProps={{ navItems: adminNavigation }}
      topNavProps={{
        actions: (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={() => router.push(ROUTES.ADMIN.USERS)}
            >
              Add User
            </Button>
            {unreadCount > 0 && (
              <span className="hidden text-xs font-medium text-accent sm:inline bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                {unreadCount} admin alert{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        ),
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
