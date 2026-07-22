'use client';

import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

import { AppLayout } from '@/components/layout';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { ROUTES } from '@/constants';

export default function AccessDeniedPage() {
  return (
    <AppLayout className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.12),_transparent_35%)] px-4 py-10">
      <Card className="w-full max-w-lg border-destructive/20 bg-card/90 shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Access denied</CardTitle>
          <CardDescription>
            You don’t have permission to view this section. Please sign in with an account that matches this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <Button asChild size="lg" className="w-full">
            <Link href={ROUTES.LOGIN}>Go to sign in</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href={ROUTES.HOME}>Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
