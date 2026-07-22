import { AlertTriangle, RefreshCw } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui';
import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ErrorStateProps {
  title?:       string;
  description?: string;
  onRetry?:     () => void;
  retryLabel?:  string;
  /** Full-page vs. inline section variant. */
  fullPage?:    boolean;
  className?:   string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Error state with retry button.
 *
 * @example
 * <ErrorState description="Failed to load exams." onRetry={refetch} />
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  fullPage = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-4 text-center px-6',
        fullPage ? 'min-h-[60vh]' : 'py-16',
        className,
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-8 w-8" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>

      {onRetry && (
        <Button
          variant="outline"
          size="md"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
