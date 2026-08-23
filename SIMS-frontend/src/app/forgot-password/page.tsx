'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/feedback';
import { FormField, FormWrapper } from '@/components/forms';
import { Button, Input } from '@/components/ui';
import { ROUTES } from '@/constants';
import { AuthShell } from '@/features/auth/components';
import { authApi } from '@/features/auth/services';
import { handleAuthError } from '@/features/auth/utils/auth-errors';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/validation';
import { toast } from '@/components/feedback';

export default function ForgotPasswordPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string>('');

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

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

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    toast.dismiss('auth-error');
    form.clearErrors();

    try {
      const response = await authApi.forgotPassword(values);
      setSubmittedEmail(values.email);
      setSuccessMessage(response.message || 'If an account with that email exists, a password reset link has been sent.');
      toast.success('Reset link sent! Check your inbox.', { id: 'forgot-password-success' });
      form.reset({ email: '' });
    } catch (error) {
      const message = handleAuthError(error);
      setErrorMessage(message);
    }
  };

  // ── Success State ───────────────────────────────────────────────────────────
  if (successMessage) {
    return (
      <AuthShell
        title="Check your email"
        description="We've sent a password reset link to your inbox."
        footer={
          <Link href={ROUTES.LOGIN} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Return to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-foreground">
              {successMessage}
            </p>
            {submittedEmail && (
              <p className="text-sm text-muted-foreground">
                Sent to <span className="font-medium text-foreground">{submittedEmail}</span>
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/40 p-3 text-left text-sm text-muted-foreground">
            <p>Didn&apos;t receive the email? Check your spam folder or wait a few minutes before trying again.</p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSuccessMessage(null);
              setSubmittedEmail('');
            }}
          >
            Send another link
          </Button>
        </div>
      </AuthShell>
    );
  }

  // ── Form State ──────────────────────────────────────────────────────────────
  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email and we'll send a secure reset link."
      footer={
        <Link href={ROUTES.LOGIN} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Return to sign in
        </Link>
      }
    >
      {errorMessage ? (
        <Alert variant="destructive" title="Reset request failed" className="mb-4">
          {errorMessage}
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

        <Button type="submit" className="w-full" size="lg" loading={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </FormWrapper>
    </AuthShell>
  );
}
