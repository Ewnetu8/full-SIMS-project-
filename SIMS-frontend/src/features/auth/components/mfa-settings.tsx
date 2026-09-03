'use client';

import * as React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  Key,
  Lock,
  QrCode,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Smartphone,
} from 'lucide-react';

import { Alert, Skeleton } from '@/components/feedback';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  PasswordInput,
  QRCodeImage,
} from '@/components/ui';
import { authApi } from '@/features/auth/services';
import { useAuthStore } from '@/features/auth/store';
import { isApiError } from '@/lib/errors';
import { toast } from '@/components/feedback';

interface MfaSettingsProps {
  className?: string;
}

type MfaFlowState = 'idle' | 'setting_up' | 'showing_backup_codes';

export function MfaSettings({ className }: MfaSettingsProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const mfaEnabled = useAuthStore((state) => state.mfaEnabled);
  const isMfaLoading = useAuthStore((state) => state.isMfaLoading);
  const setMfaEnabled = useAuthStore((state) => state.setMfaEnabled);
  const fetchMfaStatus = useAuthStore((state) => state.fetchMfaStatus);

  const [flowState, setFlowState] = React.useState<MfaFlowState>('idle');

  // Trigger authoritative status fetch if unknown and authenticated
  const hasRequestedRef = React.useRef(false);
  React.useEffect(() => {
    if (mfaEnabled === null && !isMfaLoading && isAuthenticated && !hasRequestedRef.current) {
      hasRequestedRef.current = true;
      fetchMfaStatus();
    }
  }, [mfaEnabled, isMfaLoading, isAuthenticated, fetchMfaStatus]);

  // Setup data
  const [setupData, setSetupData] = React.useState<{ otpauth_uri: string; secret: string } | null>(null);
  const [setupCode, setSetupCode] = React.useState('');
  const [isSettingUp, setIsSettingUp] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [setupError, setSetupError] = React.useState<string | null>(null);

  // Backup codes
  const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = React.useState(false);
  const [copiedSecret, setCopiedSecret] = React.useState(false);

  // Disable Dialog state
  const [isDisableOpen, setIsDisableOpen] = React.useState(false);
  const [disablePassword, setDisablePassword] = React.useState('');
  const [disableCode, setDisableCode] = React.useState('');
  const [isDisabling, setIsDisabling] = React.useState(false);
  const [disableError, setDisableError] = React.useState<string | null>(null);

  // Start MFA Setup
  const handleStartSetup = async () => {
    setIsSettingUp(true);
    setSetupError(null);
    setSetupCode('');
    try {
      const data = await authApi.setupMfa();
      setSetupData(data);
      setFlowState('setting_up');
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.statusCode === 400 && (err.message || '').toLowerCase().includes('already enabled')) {
          setMfaEnabled(true);
          setSetupError('MFA is already enabled on your account.');
        } else {
          setSetupError(err.message || 'Failed to initiate MFA setup.');
        }
      } else {
        setSetupError('Failed to initiate MFA setup. Please try again.');
      }
    } finally {
      setIsSettingUp(false);
    }
  };

  // Verify initial TOTP & enable MFA
  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = setupCode.trim();
    if (trimmed.length !== 6) {
      setSetupError('Please enter a valid 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setSetupError(null);

    try {
      const result = await authApi.verifyMfa({ totp_code: trimmed });
      setBackupCodes(result.backup_codes || []);
      setMfaEnabled(true);
      setFlowState('showing_backup_codes');
      toast.success('Two-factor authentication enabled successfully!');
    } catch (err: unknown) {
      if (isApiError(err)) {
        setSetupError(
          err.statusCode === 400
            ? 'The verification code is invalid. Please check your authenticator app and try again.'
            : err.message || 'Failed to verify code.'
        );
      } else {
        setSetupError('Failed to verify code. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Copy secret key
  const handleCopySecret = () => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopiedSecret(true);
    toast.success('Setup key copied to clipboard');
    setTimeout(() => setCopiedSecret(false), 2500);
  };

  // Copy all backup codes
  const handleCopyBackupCodes = () => {
    if (backupCodes.length === 0) return;
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    toast.success('Backup codes copied to clipboard');
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  // Download backup codes as text file
  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return;
    const content = [
      'SIMS — Examination & Grading System',
      'Two-Factor Authentication Backup Codes',
      `Account: ${user?.email || 'User'}`,
      `Generated on: ${new Date().toLocaleString()}`,
      '----------------------------------------',
      ...backupCodes.map((c, i) => `${i + 1}. ${c}`),
      '----------------------------------------',
      'NOTE: Each backup code can be used once if you lose access to your authenticator application.',
      'Keep this file in a secure location.',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sims-mfa-backup-codes.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  // Finish setup flow
  const handleFinishSetup = () => {
    setFlowState('idle');
    setSetupData(null);
    setBackupCodes([]);
  };

  // Cancel setup flow
  const handleCancelSetup = () => {
    setFlowState('idle');
    setSetupData(null);
    setSetupCode('');
    setSetupError(null);
  };

  // Open Disable Dialog
  const handleOpenDisable = () => {
    setDisablePassword('');
    setDisableCode('');
    setDisableError(null);
    setIsDisableOpen(true);
  };

  // Confirm Disable MFA
  const handleConfirmDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      setDisableError('Please enter your account password.');
      return;
    }
    if (disableCode.trim().length !== 6) {
      setDisableError('Please enter the 6-digit authenticator code.');
      return;
    }

    setIsDisabling(true);
    setDisableError(null);

    try {
      await authApi.disableMfa({
        password: disablePassword,
        totp_code: disableCode.trim(),
      });

      setMfaEnabled(false);
      setIsDisableOpen(false);
      setFlowState('idle');
      toast.success('MFA has been disabled successfully.');
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.statusCode === 400) {
          const msg = (err.message || '').toLowerCase();
          if (msg.includes('password')) {
            setDisableError('Incorrect password. Please try again.');
          } else if (msg.includes('totp') || msg.includes('code')) {
            setDisableError('Invalid verification code. Please check your authenticator app.');
          } else {
            setDisableError(err.message || 'Failed to disable MFA.');
          }
        } else {
          setDisableError(err.message || 'Failed to disable MFA.');
        }
      } else {
        setDisableError('Failed to disable MFA. Please try again.');
      }
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
            </div>
            <CardDescription>
              Protect your account with an authenticator app.
            </CardDescription>
          </div>

          <Badge
            variant={mfaEnabled === true ? 'default' : 'secondary'}
            className="w-fit px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          >
            {mfaEnabled === null ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Skeleton className="h-3 w-16" />
              </span>
            ) : mfaEnabled ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Status: Enabled
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                Status: Disabled
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* VIEW 0: Loading / Unknown State */}
        {mfaEnabled === null && flowState === 'idle' ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="pt-2">
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>
        ) : null}

        {/* VIEW 1: Idle - Enabled */}
        {mfaEnabled === true && flowState === 'idle' ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-950 dark:text-emerald-200">
                    Two-Factor Authentication is Active
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Your SIMS examination account is secured. When you sign in, you will be required to enter a 6-digit TOTP code from your authenticator device or an 8-digit backup code.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                To turn off two-factor authentication, verify your password and current authenticator code.
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleOpenDisable}
                leftIcon={<ShieldOff className="h-4 w-4" />}
              >
                Disable MFA
              </Button>
            </div>
          </div>
        ) : null}

        {/* VIEW 2: Idle - Disabled */}
        {mfaEnabled === false && flowState === 'idle' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Two-factor authentication adds an extra layer of security to your account. In addition to your password, you will need a 6-digit verification code from an authenticator app (such as Google Authenticator, Microsoft Authenticator, or Authy) to sign in.
            </p>

            {setupError ? (
              <Alert variant="destructive" title="Error">
                {setupError}
              </Alert>
            ) : null}

            <div className="pt-2">
              <Button
                onClick={handleStartSetup}
                loading={isSettingUp}
                leftIcon={<Smartphone className="h-4 w-4" />}
              >
                Enable MFA
              </Button>
            </div>
          </div>
        ) : null}

        {/* VIEW 3: Setting Up (QR Code + Verification Form) */}
        {flowState === 'setting_up' && setupData ? (
          <div className="space-y-6">
            {setupError ? (
              <Alert variant="destructive" title="Setup Verification Failed">
                {setupError}
              </Alert>
            ) : null}

            <div className="grid gap-6 md:grid-cols-2 items-center">
              {/* Left: QR Code */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border/80 bg-muted/30 text-center space-y-3">
                <QRCodeImage value={setupData.otpauth_uri} size={190} />
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Scan this QR code using Google Authenticator, Microsoft Authenticator, Authy, or another compatible TOTP authenticator application.
                </p>
              </div>

              {/* Right: Manual Secret & Verification Form */}
              <div className="space-y-4">
                <div className="rounded-xl border border-border/70 bg-background/80 p-3.5 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Can&apos;t scan the QR code?</p>
                  <p className="text-xs text-muted-foreground">Use this setup key manually:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted px-2.5 py-1.5 font-mono text-xs font-semibold text-foreground select-all break-all">
                      {setupData.secret}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopySecret}
                      className="shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      {copiedSecret ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>

                <form onSubmit={handleVerifySetup} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="verify-totp-code" className="text-xs font-semibold text-foreground">
                      Enter the 6-digit code generated by your authenticator app.
                    </label>
                    <Input
                      id="verify-totp-code"
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      maxLength={6}
                      value={setupCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setSetupCode(val);
                        if (setupError) setSetupError(null);
                      }}
                      className="text-center font-mono text-lg tracking-[0.25em]"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="submit"
                      loading={isVerifying}
                      disabled={setupCode.length !== 6}
                      className="flex-1"
                    >
                      Verify & Activate MFA
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelSetup}
                      disabled={isVerifying}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : null}

        {/* VIEW 4: Showing Backup Codes */}
        {flowState === 'showing_backup_codes' ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-base">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                MFA Enabled Successfully
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Save these backup codes somewhere secure. Each code can be used once if you lose access to your authenticator device.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Important:</strong> These codes are displayed only once and cannot be retrieved later. Copy or download them immediately before closing this view.
              </span>
            </div>

            {/* 8 Backup codes grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 rounded-2xl bg-muted/40 border border-border">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center p-2.5 rounded-xl bg-background border border-border/80 font-mono text-sm font-semibold tracking-wider text-foreground shadow-sm"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyBackupCodes}
                  leftIcon={<Copy className="h-3.5 w-3.5" />}
                >
                  {copiedCodes ? 'Codes Copied!' : 'Copy Codes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadBackupCodes}
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                >
                  Download Codes
                </Button>
              </div>

              <Button type="button" onClick={handleFinishSetup}>
                I Have Saved My Codes
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>

      {/* Disable MFA Confirmation Dialog */}
      <Dialog open={isDisableOpen} onOpenChange={setIsDisableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              To disable MFA on your account, please verify your account password and the current 6-digit code from your authenticator app.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmDisable} className="space-y-4 py-2">
            {disableError ? (
              <Alert variant="destructive" title="Action failed">
                {disableError}
              </Alert>
            ) : null}

            <div className="space-y-1.5">
              <label htmlFor="disable-password" className="text-xs font-semibold text-foreground">
                Account Password
              </label>
              <PasswordInput
                id="disable-password"
                placeholder="Enter your current password"
                value={disablePassword}
                onChange={(e) => {
                  setDisablePassword(e.target.value);
                  if (disableError) setDisableError(null);
                }}
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="disable-totp-code" className="text-xs font-semibold text-foreground">
                Current Authenticator TOTP Code
              </label>
              <Input
                id="disable-totp-code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={disableCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setDisableCode(val);
                  if (disableError) setDisableError(null);
                }}
                className="text-center font-mono text-base tracking-[0.25em]"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDisableOpen(false)}
                disabled={isDisabling}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                loading={isDisabling}
                disabled={!disablePassword || disableCode.length !== 6}
              >
                Confirm & Disable MFA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
