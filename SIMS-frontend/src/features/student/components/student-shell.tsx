'use client';

import { Bell, BookOpen, ClipboardCheck, GraduationCap, LayoutDashboard, UserRound } from 'lucide-react';
import * as React from 'react';

import { DashboardLayout } from '@/components/layout';
import { ROUTES } from '@/constants';
import { useRouteProtection } from '@/features/auth/hooks';

import type { NavItem } from '@/components/layout/sidebar';

const studentNavigation: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.STUDENT.DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'My Courses', href: ROUTES.STUDENT.COURSES, icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Active Exams', href: ROUTES.STUDENT.EXAMS, icon: <ClipboardCheck className="h-4 w-4" /> },
  { label: 'Results & Status', href: ROUTES.STUDENT.RESULTS, icon: <GraduationCap className="h-4 w-4" /> },
  { label: 'Notifications', href: ROUTES.STUDENT.NOTIFICATIONS, icon: <Bell className="h-4 w-4" /> },
  { label: 'My Profile', href: ROUTES.STUDENT.PROFILE, icon: <UserRound className="h-4 w-4" /> },
];

export function StudentShell({ children }: { children: React.ReactNode }) {
  useRouteProtection(['student']);

  return (
    <DashboardLayout
      showFooter
      sidebarProps={{ navItems: studentNavigation }}
    >
      {children}
    </DashboardLayout>
  );
}