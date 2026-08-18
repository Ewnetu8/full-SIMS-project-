'use client';

import {
  Settings,
  Shield,
  Palette,
  Bell,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import * as React from 'react';

import { PageHeader } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { Badge, Card, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { ROUTES } from '@/constants';
import { useAuthStore } from '@/features/auth/store';
import { useTheme } from '@/providers/theme-provider';
import type { ThemeMode } from '@/types';

export function LecturerSettings() {
  const user = useAuthStore((state) => state.user);
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: ROUTES.LECTURER.DASHBOARD },
              { label: 'Settings' },
            ]}
          />
        }
        title="Account & Portal Settings"
        description="Manage portal appearance preferences, session security, and notification settings."
      />

      {/* Tabs Container */}
      <Tabs defaultValue="appearance" className="w-full space-y-6">
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 w-full max-w-xl">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" /> Appearance & Theme
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Account & Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Appearance (Theme Settings) */}
        <TabsContent value="appearance">
          <Card className="p-6 space-y-6">
            <div className="border-b border-border pb-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" /> Display & Theme Preferences
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customize your visual interface mode across light, dark, or system preference.
              </p>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-foreground block">Select Theme</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Light Option */}
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center justify-between p-4 rounded-xl border text-left transition-all ${
                    theme === 'light'
                      ? 'border-[#102A7A] bg-[#102A7A]/5 ring-2 ring-[#102A7A]/20 dark:border-blue-500 dark:bg-blue-950/40'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                      <Sun className="h-5 w-5" />
                    </div>
                    {theme === 'light' && (
                      <CheckCircle2 className="h-5 w-5 text-[#102A7A] dark:text-blue-400" />
                    )}
                  </div>
                  <div className="w-full">
                    <p className="font-semibold text-sm text-foreground">Light Mode</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Clean high-contrast theme for daylight use.</p>
                  </div>
                </button>

                {/* Dark Option */}
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center justify-between p-4 rounded-xl border text-left transition-all ${
                    theme === 'dark'
                      ? 'border-[#102A7A] bg-[#102A7A]/5 ring-2 ring-[#102A7A]/20 dark:border-blue-500 dark:bg-blue-950/40'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      <Moon className="h-5 w-5" />
                    </div>
                    {theme === 'dark' && (
                      <CheckCircle2 className="h-5 w-5 text-[#102A7A] dark:text-blue-400" />
                    )}
                  </div>
                  <div className="w-full">
                    <p className="font-semibold text-sm text-foreground">Dark Mode</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sleek dark palette for reduced eye strain.</p>
                  </div>
                </button>

                {/* System Option */}
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center justify-between p-4 rounded-xl border text-left transition-all ${
                    theme === 'system'
                      ? 'border-[#102A7A] bg-[#102A7A]/5 ring-2 ring-[#102A7A]/20 dark:border-blue-500 dark:bg-blue-950/40'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <Laptop className="h-5 w-5" />
                    </div>
                    {theme === 'system' && (
                      <CheckCircle2 className="h-5 w-5 text-[#102A7A] dark:text-blue-400" />
                    )}
                  </div>
                  <div className="w-full">
                    <p className="font-semibold text-sm text-foreground">System Preference</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Match operating system color scheme.</p>
                  </div>
                </button>
              </div>

              <div className="p-4 rounded-lg border border-border bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
                <span>Active Theme Mode: <strong className="text-foreground capitalize">{theme}</strong> (Resolved: <strong className="text-foreground capitalize">{resolvedTheme}</strong>)</span>
                <Badge variant="outline" className="text-[10px]">Persisted Locally</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Security & Account */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card className="p-6 space-y-5">
              <div className="border-b border-border pb-3">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" /> Active Account Session
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Authenticated session information for your lecturer account.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg border border-border bg-muted/20">
                  <span className="text-muted-foreground block font-medium">Logged In As</span>
                  <span className="text-sm font-semibold text-foreground mt-0.5 block">{user?.email || 'N/A'}</span>
                </div>
                <div className="p-3.5 rounded-lg border border-border bg-muted/20">
                  <span className="text-muted-foreground block font-medium">Assigned Role</span>
                  <span className="text-sm font-semibold text-[#102A7A] dark:text-blue-400 mt-0.5 block capitalize">{user?.role || 'Lecturer'}</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Notifications */}
        <TabsContent value="notifications">
          <Card className="p-6 space-y-6">
            <div className="border-b border-border pb-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" /> Notification Center Preferences
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Overview of real-time alerts dispatched by the examination platform.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Exam Publication Dispatches</p>
                  <Badge variant="success" className="text-[10px]">Active System Trigger</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatic system notification created whenever an examination is scheduled or published for your course offerings.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Student Answer Submissions</p>
                  <Badge variant="success" className="text-[10px]">Active System Trigger</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  In-app notifications when students complete and submit examination attempts.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">AI Auto-Grading Stream Updates</p>
                  <Badge variant="success" className="text-[10px]">Active System Trigger</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Alerts delivered upon completion of automated essay & short-answer evaluation jobs.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
