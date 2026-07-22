'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Bell, Check, Clock } from 'lucide-react';
import * as React from 'react';

import { IconButton, Badge, Button } from '@/components/ui';
import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Notification {
  id:        string;
  title:     string;
  message:   string;
  time:      string;
  read:      boolean;
  type?:     'info' | 'success' | 'warning' | 'ai';
}

export interface NotificationDropdownProps {
  notifications?: Notification[];
  onMarkAllRead?: () => void;
  onViewAll?:     () => void;
  className?:     string;
}

// ─── Placeholder data ─────────────────────────────────────────────────────────

const placeholderNotifications: Notification[] = [
  {
    id: '1',
    title: 'AI Grading Complete',
    message: 'Mid-Term Mathematics exam has been auto-graded.',
    time: '2 min ago',
    read: false,
    type: 'ai',
  },
  {
    id: '2',
    title: 'New Exam Published',
    message: 'Data Structures final exam is now available.',
    time: '1 hour ago',
    read: false,
    type: 'info',
  },
  {
    id: '3',
    title: 'Grade Released',
    message: 'Your Physics quiz score has been released.',
    time: '3 hours ago',
    read: true,
    type: 'success',
  },
];

// ─── Type colours ─────────────────────────────────────────────────────────────

const typeDot: Record<string, string> = {
  info:    'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  ai:      'bg-ai-primary',
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Bell icon with notification popover.
 *
 * @example
 * <NotificationDropdown notifications={notifications} onMarkAllRead={markAll} />
 */
export function NotificationDropdown({
  notifications = placeholderNotifications,
  onMarkAllRead,
  onViewAll,
  className,
}: NotificationDropdownProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <div className="relative">
          <IconButton
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            variant="ghost"
            className={className}
          >
            <Bell className="h-5 w-5" />
          </IconButton>
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5',
                'flex h-4 w-4 items-center justify-center rounded-full',
                'bg-destructive text-[10px] font-bold text-white',
                'pointer-events-none select-none',
              )}
              aria-hidden="true"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 w-80 rounded-xl border border-border bg-popover shadow-lg',
            'data-[state=open]:animate-slide-in-top',
            'focus:outline-none',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="default" size="sm">{unreadCount}</Badge>
              )}
            </div>
            {onMarkAllRead && unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left',
                    'border-b border-border last:border-0',
                    'hover:bg-accent transition-colors',
                    !n.read && 'bg-primary/5',
                  )}
                >
                  {/* Dot */}
                  <span
                    className={cn(
                      'mt-1 h-2 w-2 shrink-0 rounded-full',
                      n.type ? typeDot[n.type] : 'bg-muted-foreground',
                      n.read && 'opacity-30',
                    )}
                  />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className={cn('text-xs font-medium truncate', n.read && 'text-muted-foreground')}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                      <Clock className="h-3 w-3" />
                      {n.time}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {onViewAll && (
            <div className="border-t border-border p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={onViewAll}
              >
                View all notifications
              </Button>
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
