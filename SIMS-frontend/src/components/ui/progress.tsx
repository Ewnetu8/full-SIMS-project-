'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Value 0-100. */
  value?: number;
  /** Visual variant. */
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'ai';
  /** Height preset. */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Show percentage label. */
  showLabel?: boolean;
  /** Animate the fill with a shimmer. */
  animated?: boolean;
}

// ─── Variant colors ───────────────────────────────────────────────────────────

const indicatorClasses = {
  default:     'bg-primary',
  success:     'bg-success',
  warning:     'bg-warning',
  destructive: 'bg-destructive',
  ai:          'bg-primary',
} as const;

const sizeClasses = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Progress bar with gradient fill option (AI variant) and optional label.
 *
 * @example
 * <Progress value={65} variant="ai" showLabel />
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    {
      className,
      value = 0,
      variant = 'default',
      size = 'md',
      showLabel = false,
      animated = false,
      ...props
    },
    ref,
  ) => (
    <div className="flex flex-col gap-1 w-full">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground" aria-hidden="true">
            Progress
          </span>
          <span className="text-xs font-medium tabular-nums">{Math.round(value)}%</span>
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-secondary',
          sizeClasses[size],
          className,
        )}
        value={value}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            indicatorClasses[variant],
            animated && 'relative overflow-hidden',
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        >
          {animated && (
            <span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skeleton-shimmer"
              aria-hidden="true"
            />
          )}
        </ProgressPrimitive.Indicator>
      </ProgressPrimitive.Root>
    </div>
  ),
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
