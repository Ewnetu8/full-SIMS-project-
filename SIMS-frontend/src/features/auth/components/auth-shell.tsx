'use client';

import { LockKeyhole } from 'lucide-react';
import Link from 'next/link';

import { ThemeToggle } from '@/components/common/theme-toggle';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { APP_NAME, ORGANIZATION_NAME } from '@/constants';
import { cn } from '@/lib';

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthShell({ title, description, children, footer, className }: AuthShellProps) {
  return (
    <AppLayout className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(63,94,251,0.16),_transparent_35%),linear-gradient(135deg,_hsl(var(--background))_0%,_hsl(var(--muted))_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3 rounded-full px-2 py-1 transition hover:bg-accent/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">{ORGANIZATION_NAME}</p>
            </div>
          </Link>
          <ThemeToggle variant="cycle" />
        </header>

        <main className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <section className="hidden rounded-3xl border border-border/60 bg-card/70 p-8 shadow-sm backdrop-blur lg:flex lg:flex-col lg:justify-center">
              <div className="mb-6 inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                Secure access for every role
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Sign in safely and get to the right workspace.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Manage assessments, review submissions, and keep student progress organized with role-aware access and resilient session handling.
              </p>
              <div className="mt-8 space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="font-medium text-foreground">Fast role switching</p>
                  <p className="mt-1">Admin, lecturer, and student experiences stay separate and secure.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="font-medium text-foreground">Ready for backend integration</p>
                  <p className="mt-1">The auth layer is prepared for a Django REST API without reworking the UI.</p>
                </div>
              </div>
            </section>

            <Card className={cn('mx-auto w-full max-w-md border-border/60 shadow-xl', className)}>
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {children}
                {footer ? <div className="pt-2">{footer}</div> : null}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
