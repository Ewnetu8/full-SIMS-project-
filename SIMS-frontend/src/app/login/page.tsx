'use client';

export const dynamic = 'force-dynamic';

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
import { authApi } from '@/features/auth/services';
import { useAuthStore } from '@/features/auth/store';
import { loginSchema, type LoginFormValues } from '@/features/auth/validation';
import { handleAuthError } from '@/features/auth/utils/auth-errors';
import { getHomeByRole } from '@/features/auth/utils';
import { toast } from '@/components/feedback';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? null;
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    user,
    isAuthenticated,
    isLoading,
    setError,
    setLoading,
    login: storeLogin,
    setMfaPending,
    clearSession,
  } = useAuthStore();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      const home = getHomeByRole(user.role);
      if (home === ROUTES.HOME) {
        clearSession();
      } else {
        router.replace(redirectTo ?? home);
      }
    }
  }, [isAuthenticated, isLoading, redirectTo, router, user, clearSession]);

  // Clear errors when user types
  useEffect(() => {
    const subscription = form.watch(() => {
      if (formError) {
        setFormError(null);
        setError(null);
        toast.dismiss('auth-error');
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, formError, setError]);

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    setSuccessMessage(null);
    toast.dismiss('auth-error');
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login(values);

      if (response.mfaRequired) {
        setMfaPending(response.mfaToken, values.email, values.rememberMe);
        const mfaUrl = redirectTo
          ? `${ROUTES.MFA_LOGIN}?redirectTo=${encodeURIComponent(redirectTo)}`
          : ROUTES.MFA_LOGIN;
        router.push(mfaUrl);
        return;
      }

      storeLogin(
        { user: response.session.user, tokens: response.session.tokens },
        values.rememberMe
      );

      const homeUrl = redirectTo ?? getHomeByRole(response.session.user.role);
      toast.success(`Welcome back, ${response.session.user.firstName}!`, { id: 'auth-success' });
      router.replace(homeUrl);
    } catch (error) {
      const message = handleAuthError(error);
      setFormError(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {formError ? (
        <Alert variant="destructive" title="Sign in failed" className="mb-4">
          {formError}
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
          Accounts are created and managed by Addis Ababa Science and Technology University. If you do not have an account, please contact your department or the system administrator.
        </p>
      }
    >
      <Suspense fallback={<LoginFormFallback />}>
        <LoginFormContent />
      </Suspense>
    </AuthShell>
  );
}
