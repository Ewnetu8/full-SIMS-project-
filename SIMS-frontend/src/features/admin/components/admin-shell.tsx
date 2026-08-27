'use client';

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Building2,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Landmark,
  Layers,
  Calendar,
  Clock,
  Bell,
  UserPlus,
  Tag,
  Layers3,
  GitFork,
  Scale,
  ShieldCheck,
  Award,
  School,
  BookCheck,
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

const adminNavigation: NavItem[] = [
  { label: 'Overview', href: ROUTES.ADMIN.DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'User Management', href: ROUTES.ADMIN.USERS, icon: <Users className="h-4 w-4" /> },
  { label: 'Student Directory', href: ROUTES.ADMIN.STUDENTS, icon: <GraduationCap className="h-4 w-4" /> },
  { label: 'Enrollment Management', href: ROUTES.ADMIN.ENROLLMENTS, icon: <UserPlus className="h-4 w-4" /> },
  { label: 'Lecturer Directory', href: ROUTES.ADMIN.LECTURERS, icon: <UserCheck className="h-4 w-4" /> },
  { label: 'Teaching Assignments', href: ROUTES.ADMIN.TEACHING_ASSIGNMENTS, icon: <BookCheck className="h-4 w-4" /> },
  { label: 'Universities', href: ROUTES.ADMIN.UNIVERSITIES, icon: <School className="h-4 w-4" /> },
  { label: 'Colleges', href: ROUTES.ADMIN.COLLEGES, icon: <Landmark className="h-4 w-4" /> },
  { label: 'Departments', href: ROUTES.ADMIN.DEPARTMENTS, icon: <Building2 className="h-4 w-4" /> },
  { label: 'Programs', href: ROUTES.ADMIN.PROGRAMS, icon: <Layers className="h-4 w-4" /> },
  { label: 'Academic Years', href: ROUTES.ADMIN.ACADEMIC_YEARS, icon: <Calendar className="h-4 w-4" /> },
  { label: 'Semesters', href: ROUTES.ADMIN.SEMESTERS, icon: <Clock className="h-4 w-4" /> },
  { label: 'Courses', href: ROUTES.ADMIN.COURSES, icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Course Offerings', href: ROUTES.ADMIN.COURSE_OFFERINGS, icon: <Layers3 className="h-4 w-4" /> },
  { label: 'Course Prerequisites', href: ROUTES.ADMIN.COURSE_PREREQUISITES, icon: <GitFork className="h-4 w-4" /> },
  { label: 'Credit Hour Policies', href: ROUTES.ADMIN.CREDIT_HOUR_POLICIES, icon: <Scale className="h-4 w-4" /> },
  { label: 'Enrollment Overrides', href: ROUTES.ADMIN.ENROLLMENT_OVERRIDES, icon: <ShieldCheck className="h-4 w-4" /> },
  { label: 'Tags Management', href: ROUTES.ADMIN.TAGS, icon: <Tag className="h-4 w-4" /> },
  { label: 'Exams Overview', href: ROUTES.ADMIN.EXAMS, icon: <ClipboardCheck className="h-4 w-4" /> },
  { label: 'Results & Grades', href: ROUTES.ADMIN.RESULTS, icon: <Award className="h-4 w-4" /> },
  { label: 'Reports & Analytics', href: ROUTES.ADMIN.REPORTS, icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'Notifications', href: ROUTES.ADMIN.NOTIFICATIONS, icon: <Bell className="h-4 w-4" /> },
];

export interface AdminShellProps {
  children: React.ReactNode;
  breadcrumbItems?: { label: string; href?: string }[];
  pageTitle?: string;
}

export function AdminShell({ children, breadcrumbItems }: AdminShellProps) {
  const router = useRouter();
  const { data: notifications = [] } = useNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();

  useRouteProtection(['admin']);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
        actions: unreadCount > 0 ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-medium text-accent sm:inline bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
              {unreadCount} admin alert{unreadCount > 1 ? 's' : ''}
            </span>
          </div>
        ) : undefined,
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
