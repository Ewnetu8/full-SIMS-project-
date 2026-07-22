'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Alert, Skeleton } from '@/components/feedback';
import { FormField, FormWrapper } from '@/components/forms';
import { Button, Checkbox, Input, PasswordInput } from '@/components/ui';
import { ROUTES } from '@/constants';
import { AuthShell } from '@/features/auth/components';
import { mockAuthService } from '@/features/auth/mock';
import { useAuthStore } from '@/features/auth/store';
import { getHomeByRole } from '@/features/auth/utils';
import { loginSchema, type LoginFormValues } from '@/features/auth/validation';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? null;
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { user, isAuthenticated, isLoading, setError, setLoading, login: storeLogin } = useAuthStore();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(redirectTo ?? getHomeByRole(user.role));
    }
  }, [isAuthenticated, redirectTo, router, user]);

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    setSuccessMessage(null);
    setLoading(true);
    setError(null);

    try {
      const response = await mockAuthService.login(values);
      storeLogin({ user: response.user, tokens: response.tokens }, values.rememberMe);
      setSuccessMessage(response.message);
      router.replace(redirectTo ?? getHomeByRole(response.user.role));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in right now.';
      setFormError(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {formError ? (
        <Alert variant="destructive" title="Unable to sign in" className="mb-4">
          {formError}
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert variant="success" title="Signed in" className="mb-4">
          {successMessage}
        </Alert>
      ) : null}

      <FormWrapper form={form} onSubmit={onSubmit} className="space-y-5">
        <FormField
          name="email"
          label="Email address"
          required
          render={({ field, error }) => (
            <Input
              {...field}
              id={field.id}
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              leadingIcon={<Mail className="h-4 w-4" />}
              error={Boolean(error)}
            />
          )}
        />

        <FormField
          name="password"
          label="Password"
          required
          render={({ field, error }) => (
            <PasswordInput
              {...field}
              id={field.id}
              autoComplete="current-password"
              placeholder="Enter your password"
              error={Boolean(error)}
            />
          )}
        />

        <div className="flex items-center justify-between gap-4">
          <Controller
            name="rememberMe"
            control={form.control}
            render={({ field }) => (
              <Checkbox
                checked={Boolean(field.value)}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                label="Remember me"
              />
            )}
          />
          <Link href={ROUTES.FORGOT_PASSWORD} className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isLoading} rightIcon={<ArrowRight className="h-4 w-4" />}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
      </FormWrapper>

      <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Demo credentials
        </div>
        <p className="mt-2">Admin: admin@example.com / Admin123!</p>
        <p>Lecturer: lecturer@example.com / Lecturer123!</p>
        <p>Student: student@example.com / Student123!</p>
      </div>
    </>
  );
}

function LoginFormFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue to your workspace."
      footer={
        <p className="text-sm text-muted-foreground">
          New here?{' '}
          <Link href={ROUTES.HOME} className="font-medium text-primary hover:underline">
            Explore the platform
          </Link>
        </p>
      }
    >
      <Suspense fallback={<LoginFormFallback />}>
        <LoginFormContent />
      </Suspense>
    </AuthShell>
  );
}
