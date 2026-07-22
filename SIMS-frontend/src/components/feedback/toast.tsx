'use client';

// Re-export Sonner toast with project-specific defaults
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';

import { useTheme } from '@/providers/theme-provider';

// â”€â”€â”€ Toaster â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Mount `<Toaster />` once at the app root (inside AppProviders).
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme as 'light' | 'dark' | 'system'}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:       'rounded-xl border border-border bg-card text-card-foreground shadow-lg text-sm',
          title:       'font-semibold',
          description: 'text-muted-foreground text-xs',
          actionButton:'bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-medium',
          cancelButton:'bg-muted text-muted-foreground rounded-md px-3 py-1.5 text-xs font-medium',
        },
      }}
      richColors
      closeButton
    />
  );
}

// â”€â”€â”€ Toast helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const toast = {
  success: (message: string, opts?: Parameters<typeof sonnerToast.success>[1]) =>
    sonnerToast.success(message, opts),
  error: (message: string, opts?: Parameters<typeof sonnerToast.error>[1]) =>
    sonnerToast.error(message, opts),
  warning: (message: string, opts?: Parameters<typeof sonnerToast.warning>[1]) =>
    sonnerToast.warning(message, opts),
  info: (message: string, opts?: Parameters<typeof sonnerToast.info>[1]) =>
    sonnerToast.info(message, opts),
  loading: (message: string, opts?: Parameters<typeof sonnerToast.loading>[1]) =>
    sonnerToast.loading(message, opts),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
};
