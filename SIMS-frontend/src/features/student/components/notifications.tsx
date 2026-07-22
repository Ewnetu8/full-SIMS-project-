'use client';

import { Bell, CheckCheck, Info, Sparkles } from 'lucide-react';
import * as React from 'react';

import { Breadcrumb } from '@/components/navigation';
import { PageHeader } from '@/components/layout';
import { Button, Card, CardContent } from '@/components/ui';
import { EmptyState } from '@/components/feedback';
import { ROUTES } from '@/constants';
import { studentService } from '../services';
import type { StudentNotification } from '../types';

const icons = { info: <Info className="h-5 w-5" />, success: <CheckCheck className="h-5 w-5" />, warning: <Bell className="h-5 w-5" />, ai: <Sparkles className="h-5 w-5" /> };
export function NotificationsPage() { const [notifications, setNotifications] = React.useState<StudentNotification[]>(() => studentService.getNotifications()); const unread = notifications.some((notification) => !notification.read); return <div className="space-y-6"><PageHeader breadcrumb={<Breadcrumb items={[{ label: 'Student portal', href: ROUTES.STUDENT.DASHBOARD }, { label: 'Notifications' }]} />} title="Notifications" description="Keep up with assessments, results, and account activity." actions={unread ? <Button variant="outline" size="sm" leftIcon={<CheckCheck className="h-4 w-4" />} onClick={() => setNotifications((items) => items.map((item) => ({ ...item, read: true })))}>Mark all as read</Button> : undefined} />{notifications.length === 0 ? <EmptyState icon={<Bell />} title="You're all caught up" description="New academic updates and reminders will appear here." /> : <Card><CardContent className="p-0">{notifications.map((notification) => <button key={notification.id} type="button" onClick={() => setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item))} className={`flex w-full items-start gap-4 border-b border-border p-5 text-left transition hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring last:border-b-0 ${notification.read ? '' : 'bg-primary/[0.03]'}`}><span className="rounded-lg bg-primary/10 p-2 text-primary">{icons[notification.type]}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-4"><span className="font-medium">{notification.title}</span>{!notification.read && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />}</span><span className="mt-1 block text-sm text-muted-foreground">{notification.message}</span><span className="mt-2 block text-xs text-muted-foreground">{notification.time}</span></span></button>)}</CardContent></Card>}</div>; }