'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Alert, Skeleton } from '@/components/feedback';
import { FormField, FormWrapper } from '@/components/forms';
import { Button, PasswordInput } from '@/components/ui';
import { ROUTES } from '@/constants';
import { AuthShell } from '@/features/auth/components';
import { authApi } from '@/features/auth/services';
import { getPasswordStrength } from '@/features/auth/utils';
import { handleAuthError } from '@/features/auth/utils/auth-errors';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/features/auth/validation';
import { toast } from '@/components/feedback';

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const token = searchParams.get('token') ?? '';

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = form.watch('password');
  const passwordStrength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);

  useEffect(() => {
    if (!token) {
      setErrorMessage('The reset link is missing a token. Please request a new link.');
    }
  }, [token]);

  // Clear errors when user types
  useEffect(() => {
    const subscription = form.watch(() => {
      if (errorMessage) {
        setErrorMessage(null);
        toast.dismiss('auth-error');
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, errorMessage]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    toast.dismiss('auth-error');

    try {
      await authApi.resetPassword({
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      toast.success('Your password has been updated successfully.', { id: 'password-reset-success' });
      window.setTimeout(() => router.replace(ROUTES.LOGIN), 1200);
    } catch (error) {
      const message = handleAuthError(error);
      setErrorMessage(message);
    }
  };

  return (
    <>
      {errorMessage ? (
        <Alert variant="destructive" title="Password reset failed" className="mb-4">
          {errorMessage}
        </Alert>
      ) : null}

      <FormWrapper form={form} onSubmit={onSubmit} className="space-y-5">
        <FormField
          name="password"
          label="New password"
          required
          render={({ field, error }) => (
            <div className="space-y-2">
              <PasswordInput
                {...field}
                id={field.id}
                autoComplete="new-password"
                placeholder="Create a strong password"
                error={Boolean(error)}
                leadingIcon={<KeyRound className="h-4 w-4" />}
              />
              <div className="space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${passwordStrength.color} ${passwordStrength.width}`} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Strength: <span className="font-medium text-foreground">{passwordStrength.label || 'Enter a password'}</span>
                </p>
              </div>
            </div>
          )}
        />

        <FormField
          name="confirmPassword"
          label="Confirm password"
          required
          render={({ field, error }) => (
            <PasswordInput
              {...field}
              id={field.id}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              error={Boolean(error)}
            />
          )}
        />

        <Button type="submit" className="w-full" size="lg" loading={form.formState.isSubmitting} rightIcon={<ArrowRight className="h-4 w-4" />}>
          {form.formState.isSubmitting ? 'Updating…' : 'Reset password'}
        </Button>
      </FormWrapper>

      <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/40 p-3 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-success" />
        Use at least 8 characters with uppercase, lowercase, a number, and a symbol.
      </div>
    </>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Create a new password"
      description="Choose a strong password to secure your account."
      footer={
        <p className="text-sm text-muted-foreground">
          Remembered it?{' '}
          <a href={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
            Sign in now
          </a>
        </p>
      }
    >
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordFormContent />
      </Suspense>
    </AuthShell>
  );
}
