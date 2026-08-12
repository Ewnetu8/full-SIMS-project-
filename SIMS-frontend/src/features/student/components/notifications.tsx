'use client';

import * as React from 'react';
import { Bell, CheckCheck, Info, Sparkles } from 'lucide-react';
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback';
import { PageHeader } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { Button, Card, CardContent } from '@/components/ui';
import { ROUTES } from '@/constants';
import { useStudentStore } from '../store/student-store';

const formatTimestamp = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export function NotificationsPage() {
  const {
    notifications,
    isLoadingNotifications,
    notificationsError,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useStudentStore();

  React.useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Student portal', href: ROUTES.STUDENT.DASHBOARD },
              { label: 'Notifications' },
            ]}
          />
        }
        title="Notifications"
        description="Keep up with assessments, announcements, and system activity."
        actions={
          hasUnread ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CheckCheck className="h-4 w-4" />}
              onClick={() => void markAllNotificationsAsRead()}
            >
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {isLoadingNotifications ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : notificationsError ? (
        <ErrorState
          title="Couldn't load notifications"
          description={notificationsError}
          onRetry={() => {
            void fetchNotifications();
          }}
          retryLabel="Try again"
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-10 w-10 text-muted-foreground" />}
          title="No notifications available"
          description="No notifications are available at the moment."
        />
      ) : (
        <Card className="shadow-sm border-border/80">
          <CardContent className="p-0 divide-y divide-border">
            {notifications.map((notification) => {
              const isUnread = !notification.is_read;

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    if (isUnread) {
                      void markNotificationAsRead(notification.id);
                    }
                  }}
                  className={`flex w-full items-start gap-4 p-5 text-left transition hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                    isUnread ? 'bg-primary/[0.03]' : ''
                  }`}
                >
                  <span className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0 mt-0.5">
                    <Info className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-foreground text-sm">
                        {notification.message_body.slice(0, 60)}
                        {notification.message_body.length > 60 ? '...' : ''}
                      </span>
                      {isUnread && (
                        <span
                          className="h-2.5 w-2.5 rounded-full bg-primary shrink-0"
                          aria-label="Unread notification"
                        />
                      )}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                      {notification.message_body}
                    </span>
                    <span className="mt-2 block text-xs text-muted-foreground font-medium">
                      {formatTimestamp(notification.created_at)}
                    </span>
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}