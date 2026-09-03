'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, KeyRound, ShieldAlert, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { Alert, Skeleton } from '@/components/feedback';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui';
import { ROUTES } from '@/constants';
import { AuthShell } from '@/features/auth/components';
import { authApi } from '@/features/auth/services';
import { useAuthStore } from '@/features/auth/store';
import { getHomeByRole } from '@/features/auth/utils';
import { isApiError } from '@/lib/errors';
import { toast } from '@/components/feedback';

function MfaLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? null;

  const {
    mfaToken,
    mfaEmail,
    mfaRememberMe,
    login: storeLogin,
    clearMfaPending,
    isAuthenticated,
    user,
  } = useAuthStore();

  const [useBackupCode, setUseBackupCode] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isExpired, setIsExpired] = React.useState(false);

  // If already authenticated, redirect to appropriate home
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const home = getHomeByRole(user.role);
      router.replace(redirectTo ?? home);
    }
  }, [isAuthenticated, user, router, redirectTo]);

  // If there's no active mfa_token in memory, redirect back to login
  React.useEffect(() => {
    if (!isAuthenticated && !mfaToken) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isAuthenticated, mfaToken, router]);

  // Focus input automatically
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    inputRef.current?.focus();
  }, [useBackupCode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\s+/g, '');
    const maxLength = useBackupCode ? 8 : 6;
    const formatted = raw.slice(0, maxLength);
    setCode(formatted);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaToken) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    const trimmedCode = code.trim();
    const expectedLength = useBackupCode ? 8 : 6;

    if (trimmedCode.length !== expectedLength) {
      setError(
        useBackupCode
          ? 'Please enter an 8-character backup code.'
          : 'Please enter a 6-digit verification code.'
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setIsExpired(false);

    try {
      const response = await authApi.loginWithMfa({
        mfa_token: mfaToken,
        totp_code: trimmedCode,
      });

      storeLogin(
        { user: response.user, tokens: response.tokens },
        mfaRememberMe
      );

      toast.success(`Welcome back, ${response.user.firstName}!`, { id: 'auth-success' });

      const homeUrl = redirectTo ?? getHomeByRole(response.user.role);
      router.replace(homeUrl);
    } catch (err: unknown) {
      console.error('MFA login verification error:', err);

      if (isApiError(err)) {
        const detailMsg = (err.message || '').toLowerCase();
        if (
          err.statusCode === 401 &&
          (detailMsg.includes('expired') || detailMsg.includes('invalid mfa token'))
        ) {
          setIsExpired(true);
          setError('Your MFA login session has expired. Please sign in again.');
        } else if (err.statusCode === 401 || err.statusCode === 400) {
          if (useBackupCode) {
            setError('The backup code is invalid or has already been used.');
          } else {
            setError(
              'The verification code is invalid. Please check your authenticator app and try again.'
            );
          }
        } else {
          setError(err.message || 'Verification failed. Please try again.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    clearMfaPending();
    router.push(ROUTES.LOGIN);
  };

  const toggleMode = () => {
    setUseBackupCode((prev) => !prev);
    setCode('');
    setError(null);
  };

  if (!mfaToken) {
    return (
      <div className="space-y-4 text-center">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error ? (
        <Alert variant="destructive" title="Verification failed">
          {error}
        </Alert>
      ) : null}

      {isExpired ? (
        <div className="pt-2">
          <Button
            type="button"
            variant="default"
            className="w-full"
            onClick={handleBackToLogin}
          >
            Return to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="mfa-code-input"
              className="text-sm font-medium text-foreground"
            >
              {useBackupCode ? '8-digit backup code' : '6-digit verification code'}
            </label>
            <Input
              ref={inputRef}
              id="mfa-code-input"
              type="text"
              inputMode={useBackupCode ? 'text' : 'numeric'}
              autoComplete="one-time-code"
              placeholder={useBackupCode ? 'e.g. 1a2b3c4d' : '000000'}
              value={code}
              onChange={handleCodeChange}
              maxLength={useBackupCode ? 8 : 6}
              className="text-center font-mono text-xl tracking-[0.3em]"
              disabled={isSubmitting}
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              {useBackupCode
                ? 'Enter one of your 8-digit backup codes.'
                : 'Enter the 6-digit code from your authenticator app.'}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={isSubmitting}
            disabled={code.length !== (useBackupCode ? 8 : 6)}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            {useBackupCode ? 'Verify Backup Code' : 'Verify & Continue'}
          </Button>

          <div className="flex flex-col space-y-2 pt-1 text-center text-sm">
            <button
              type="button"
              onClick={toggleMode}
              className="font-medium text-primary hover:underline focus:outline-none"
            >
              {useBackupCode
                ? 'Use authenticator app code instead'
                : 'Use a backup code instead'}
            </button>

            <button
              type="button"
              onClick={handleBackToLogin}
              className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground focus:outline-none pt-2"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Login
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function MfaLoginPage() {
  return (
    <AuthShell
      title="Verify Your Identity"
      description="Two-factor authentication is enabled for your account."
      footer={
        <p className="text-xs text-muted-foreground text-center">
          Open your authenticator app (Google Authenticator, Authy, Microsoft Authenticator) to view your verification code.
        </p>
      }
    >
      <React.Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        }
      >
        <MfaLoginForm />
      </React.Suspense>
    </AuthShell>
  );
}
