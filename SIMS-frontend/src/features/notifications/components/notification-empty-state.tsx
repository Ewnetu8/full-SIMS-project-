'use client';

import { Bell, CheckCircle2, Inbox } from 'lucide-react';
import * as React from 'react';

import type { NotificationFilterTab } from '../types/notification';

export interface NotificationEmptyStateProps {
  filter: NotificationFilterTab;
}

export function NotificationEmptyState({ filter }: NotificationEmptyStateProps) {
  let title = 'No notifications yet.';
  let description = 'System notifications and alerts will appear here.';
  let icon = <Inbox className="h-10 w-10 text-muted-foreground/60" />;

  if (filter === 'unread') {
    title = "You're all caught up.";
    description = 'You have no unread notifications at this time.';
    icon = <CheckCircle2 className="h-10 w-10 text-success/60" />;
  } else if (filter === 'read') {
    title = 'No read notifications.';
    description = 'Notifications you have marked as read will appear here.';
    icon = <Bell className="h-10 w-10 text-muted-foreground/60" />;
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-xl bg-card/40 my-4">
      <div className="p-3 rounded-full bg-muted/40 mb-3">{icon}</div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>
    </div>
  );
}
