'use client';

import {
  Bell,
  BookOpen,
  ChartColumn,
  ClipboardCheck,
  LayoutDashboard,
  PlusCircle,
  Settings,
  UserRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { DashboardLayout } from '@/components/layout';
import { NotificationDropdown } from '@/components/navigation';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants';

import { useRouteProtection } from '@/features/auth/hooks';
import { lecturerService } from '../services';

import type { NavItem } from '@/components/layout/sidebar';
import type { Notification } from '@/components/navigation/notification-dropdown';

const lecturerNavigation: NavItem[] = [
  { label: 'Overview', href: ROUTES.LECTURER.DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'My Courses', href: ROUTES.LECTURER.COURSES, icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Examinations', href: ROUTES.LECTURER.EXAMS, icon: <ClipboardCheck className="h-4 w-4" /> },
  { label: 'Create Exam', href: ROUTES.LECTURER.EXAM_CREATE, icon: <PlusCircle className="h-4 w-4" /> },
  { label: 'Class Analytics', href: ROUTES.LECTURER.ANALYTICS, icon: <ChartColumn className="h-4 w-4" /> },
  { label: 'Notifications', href: ROUTES.LECTURER.NOTIFICATIONS, icon: <Bell className="h-4 w-4" /> },
  { label: 'My Profile', href: ROUTES.LECTURER.PROFILE, icon: <UserRound className="h-4 w-4" /> },
  { label: 'Settings', href: ROUTES.LECTURER.SETTINGS, icon: <Settings className="h-4 w-4" /> },
];

export function LecturerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  useRouteProtection(['lecturer']);

  React.useEffect(() => {
    lecturerService.getNotifications().then((data) => {
      setNotifications(
        data.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: n.timestamp,
          read: n.read,
          type: n.type === 'ai_grading' ? 'ai' : n.type === 'submission' ? 'success' : 'info',
        }))
      );
    });
  }, []);

  const unread = notifications.filter((n) => !n.read);

  return (
    <DashboardLayout
      showFooter
      sidebarProps={{ navItems: lecturerNavigation }}
      topNavProps={{
        actions: (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              leftIcon={<PlusCircle className="h-4 w-4" />}
              onClick={() => router.push(ROUTES.LECTURER.EXAM_CREATE)}
            >
              New Exam
            </Button>
            {unread.length > 0 && (
              <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                {unread.length} unread updates
              </span>
            )}
          </div>
        ),
        notificationMenu: (
          <NotificationDropdown
            notifications={notifications}
            onMarkAllRead={() => {
              lecturerService.markAllNotificationsRead();
              setNotifications((items) => items.map((item) => ({ ...item, read: true })));
            }}
            onViewAll={() => router.push(ROUTES.LECTURER.NOTIFICATIONS)}
          />
        ),
      }}
    >
      {children}
    </DashboardLayout>
  );
}
