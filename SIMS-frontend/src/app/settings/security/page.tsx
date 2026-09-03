'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';

import { AppLayout, PageHeader } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { Button, Card, CardContent } from '@/components/ui';
import { ROUTES } from '@/constants';
import { MfaSettings } from '@/features/auth/components';
import { useAuthStore } from '@/features/auth/store';
import { getHomeByRole } from '@/features/auth/utils';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isAuthenticated, isLoading, router]);

  const dashboardHome = user ? getHomeByRole(user.role) : ROUTES.HOME;

  return (
    <AppLayout className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={[
                { label: 'Dashboard', href: dashboardHome },
                { label: 'Settings' },
                { label: 'Security & Two-Factor Authentication' },
              ]}
            />
          }
          title="Account Security"
          description="Manage two-factor authentication and security credentials for your SIMS account."
        />

        <div className="space-y-6">
          <MfaSettings />

          <div className="flex justify-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(dashboardHome)}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
