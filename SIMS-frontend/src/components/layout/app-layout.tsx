import { cn } from '@/lib';

import type React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppLayoutProps {
  children:   React.ReactNode;
  /** Full-width, no sidebar — for auth / public pages. */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Minimal full-screen app layout for public/auth pages (no sidebar).
 *
 * @example
 * <AppLayout>
 *   <LoginPage />
 * </AppLayout>
 */
export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-background text-foreground',
        className,
      )}
    >
      {children}
    </div>
  );
}
