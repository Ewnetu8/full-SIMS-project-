import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Variants ─────────────────────────────────────────────────────────────────

const spinnerVariants = cva('rounded-full border-2 animate-spin', {
  variants: {
    variant: {
      default:     'border-muted border-t-primary',
      white:       'border-white/30 border-t-white',
      destructive: 'border-destructive/30 border-t-destructive',
      ai:          'border-ai-muted border-t-ai-primary',
    },
    size: {
      xs:  'h-3 w-3 border-[1.5px]',
      sm:  'h-4 w-4',
      md:  'h-6 w-6 border-[2.5px]',
      lg:  'h-8 w-8 border-[3px]',
      xl:  'h-12 w-12 border-4',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
  label?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Accessible loading spinner.
 *
 * @example
 * <LoadingSpinner size="lg" label="Loading exams..." />
 */
export function LoadingSpinner({ variant, size, label = 'Loading…', className }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('inline-flex flex-col items-center gap-2', className)}
    >
      <span className={cn(spinnerVariants({ variant, size }))} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
