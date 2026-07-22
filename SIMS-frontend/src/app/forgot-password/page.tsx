'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/feedback';
import { FormField, FormWrapper } from '@/components/forms';
import { Button, Input } from '@/components/ui';
import { ROUTES } from '@/constants';
import { AuthShell } from '@/features/auth/components';
import { mockAuthService } from '@/features/auth/mock';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/validation';

export default function ForgotPasswordPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    form.clearErrors();

    try {
      const response = await mockAuthService.forgotPassword(values);
      setSuccessMessage(response.message);
      form.reset({ email: '' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to request a password reset.';
      setErrorMessage(message);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email and we will send a secure reset link."
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

      {successMessage ? (
        <Alert variant="success" title="Check your inbox" className="mb-4">
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

        <Button type="submit" className="w-full" size="lg" loading={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </FormWrapper>
    </AuthShell>
  );
}
