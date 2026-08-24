'use client';

import { Bell, Check, Clock, Loader2 } from 'lucide-react';
import * as React from 'react';

import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib';

import type { Notification } from '../types/notification';

export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  isMarkingRead?: boolean;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  isMarkingRead = false,
}: NotificationItemProps) {
  const formattedDate = React.useMemo(() => {
    try {
      const date = new Date(notification.created_at);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return notification.created_at;
    }
  }, [notification.created_at]);

  return (
    <div
      className={cn(
        'group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200',
        notification.is_read
          ? 'bg-card/40 border-border hover:bg-card/70'
          : 'bg-primary/5 border-primary/20 shadow-xs hover:bg-primary/[0.07]'
      )}
    >
      {/* Icon Indicator */}
      <div
        className={cn(
          'p-2.5 rounded-xl border shrink-0 mt-0.5',
          notification.is_read
            ? 'bg-muted/40 border-border text-muted-foreground'
            : 'bg-primary/10 border-primary/20 text-primary'
        )}
      >
        <Bell className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!notification.is_read && (
              <Badge variant="default" className="text-[10px] py-0 px-2 h-4 font-semibold">
                Unread
              </Badge>
            )}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {!notification.is_read && (
            <Button
              size="sm"
              variant="outline"
              disabled={isMarkingRead}
              className="h-7 px-2.5 text-xs text-primary border-primary/30 hover:bg-primary/10 gap-1"
              onClick={() => onMarkAsRead(notification.id)}
            >
              {isMarkingRead ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  <span>Mark as read</span>
                </>
              )}
            </Button>
          )}
        </div>

        <p
          className={cn(
            'mt-2 text-sm whitespace-pre-wrap leading-relaxed',
            notification.is_read ? 'text-foreground/80' : 'text-foreground font-medium'
          )}
        >
          {notification.message_body}
        </p>
      </div>
    </div>
  );
}
