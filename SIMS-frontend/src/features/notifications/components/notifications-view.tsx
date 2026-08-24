'use client';

import { Bell, RefreshCw, AlertCircle } from 'lucide-react';
import * as React from 'react';

import { toast, Skeleton } from '@/components/feedback';
import { Button, Card } from '@/components/ui';
import { getUserFriendlyErrorMessage } from '@/lib/errors';

import { useNotifications, useMarkNotificationAsRead } from '../hooks/use-notifications';

import { NotificationEmptyState } from './notification-empty-state';
import { NotificationFilters } from './notification-filters';
import { NotificationItem } from './notification-item';

import type { NotificationFilterTab } from '../types/notification';

export function NotificationsView() {
  const [activeTab, setActiveTab] = React.useState<NotificationFilterTab>('all');

  const isReadParam = activeTab === 'unread' ? false : activeTab === 'read' ? true : undefined;

  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useNotifications(isReadParam);

  const markAsReadMutation = useMarkNotificationAsRead();

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Notification marked as read');
      },
      onError: (err) => {
        toast.error(getUserFriendlyErrorMessage(err, 'Failed to update notification status.'));
      },
    });
  };

  const unreadCount = React.useMemo(() => {
    if (activeTab === 'unread') return notifications.length;
    return notifications.filter((n) => !n.is_read).length;
  }, [activeTab, notifications]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" /> Notifications
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            View your system notifications and alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <NotificationFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadCount={unreadCount}
        totalCount={activeTab === 'all' ? notifications.length : undefined}
      />

      {/* Error State */}
      {isError && (
        <Card className="p-4 border-destructive/40 bg-destructive/10 text-destructive flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              {getUserFriendlyErrorMessage(error, 'Unable to load notifications. Please try again.')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="border-destructive/30 hover:bg-destructive/20 text-destructive shrink-0"
          >
            Retry
          </Button>
        </Card>
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <NotificationEmptyState filter={activeTab} />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              isMarkingRead={
                markAsReadMutation.isPending &&
                markAsReadMutation.variables === notification.id
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
