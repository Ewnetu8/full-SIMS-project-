import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Variants ─────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
    'text-xs font-medium transition-colors',
    'border select-none whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        outline:
          'border-border text-foreground bg-transparent',
        success:
          'border-transparent bg-success/15 text-success dark:bg-success/20',
        warning:
          'border-transparent bg-warning/15 text-warning-foreground dark:bg-warning/20',
        destructive:
          'border-transparent bg-destructive/15 text-destructive dark:bg-destructive/20',
        info:
          'border-transparent bg-info/15 text-info dark:bg-info/20',
        ai:
          'border-transparent text-accent-foreground bg-accent',
      },
      size: {
        sm: 'px-2 py-px text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional dot indicator shown before the label. */
  dot?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Inline status/label badge. Supports 7 semantic variants + dot indicator.
 *
 * @example
 * <Badge variant="success" dot>Graded</Badge>
 * <Badge variant="ai">AI Generated</Badge>
 */
function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
