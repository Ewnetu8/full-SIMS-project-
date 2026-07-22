'use client';

import {
  Bell,
  CheckCheck,
  Brain,
  UserPlus,
  ClipboardCheck,
  ShieldAlert,
  Info,
} from 'lucide-react';
import * as React from 'react';

import { toast } from '@/components/feedback';
import { Badge, Button, Card } from '@/components/ui';
import { useAdminStore } from '../store';

export function AdminNotifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAdminStore();
  const [filterCategory, setFilterCategory] = React.useState<string>('ALL');

  const filteredNotifs = notifications.filter(
    (n) => filterCategory === 'ALL' || n.category === filterCategory
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai':
        return <Brain className="h-4 w-4 text-ai-primary" />;
      case 'user':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'exam':
        return <ClipboardCheck className="h-4 w-4 text-emerald-500" />;
      case 'security':
        return <ShieldAlert className="h-4 w-4 text-rose-500" />;
      default:
        return <Info className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <Bell className="h-6 w-6 text-amber-500" /> Administrative Notification Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            System announcements, AI engine alerts, security warnings, and user registration events.
          </p>
        </div>

        <Button
          variant="outline"
          leftIcon={<CheckCheck className="h-4 w-4" />}
          onClick={() => {
            markAllNotificationsRead();
            toast.success('Marked all as read');
          }}
        >
          Mark All Read
        </Button>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'ai', 'user', 'exam', 'security', 'system'].map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={filterCategory === cat ? 'default' : 'outline'}
            className="capitalize text-xs"
            onClick={() => setFilterCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Notifications Feed */}
      <Card className="p-4">
        <div className="divide-y divide-border">
          {filteredNotifs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No administrative notifications found.
            </p>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.id}
                className={`py-4 px-3 flex items-start gap-4 transition-colors rounded-lg ${
                  !n.read ? 'bg-primary/5 font-medium' : 'hover:bg-accent/40'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-background border border-border mt-0.5">
                  {getCategoryIcon(n.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{n.title}</h3>
                    <span className="text-[11px] text-muted-foreground">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {n.category}
                    </Badge>
                    {!n.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[11px] h-6 px-2 text-primary"
                        onClick={() => markNotificationRead(n.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
