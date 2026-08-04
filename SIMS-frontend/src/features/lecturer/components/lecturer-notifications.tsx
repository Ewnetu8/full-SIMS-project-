'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Brain, CheckCheck, Megaphone, Send, Sparkles } from 'lucide-react';
import * as React from 'react';

import { Badge, Button, Card, CardContent } from '@/components/ui';

import { lecturerService } from '../services';

import type { LecturerNotification } from '../types';

const TYPE_CONFIG: Record<
  LecturerNotification['type'],
  { icon: React.ElementType; color: string; label: string }
> = {
  published: { icon: Send, color: 'text-primary', label: 'Published' },
  submission: { icon: Bell, color: 'text-warning', label: 'Submission' },
  ai_grading: { icon: Brain, color: 'text-ai-primary', label: 'AI Grading' },
  system: { icon: Megaphone, color: 'text-muted-foreground', label: 'System' },
};

export function LecturerNotifications() {
  const [notifications, setNotifications] = React.useState<LecturerNotification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    lecturerService.getNotifications().then((data) => {
      setNotifications(data);
      setLoading(false);
    });
  }, []);

  async function markAllRead() {
    await lecturerService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All notifications read'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" leftIcon={<CheckCheck className="h-4 w-4" />} onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {notifications.map((notif) => {
            const config = TYPE_CONFIG[notif.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className={notif.read ? 'opacity-75' : 'border-primary/20 shadow-sm'}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted ${config.color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{notif.title}</p>
                          {!notif.read && <Badge variant="info">New</Badge>}
                          <span className="text-xs text-muted-foreground ml-auto">{notif.timestamp}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                        {notif.link && (
                          <a
                            href={notif.link}
                            className="text-xs text-primary hover:underline"
                          >
                            View →
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="py-20 text-center rounded-2xl border border-dashed border-border">
            <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
