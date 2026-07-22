import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Variants ─────────────────────────────────────────────────────────────────

const iconButtonVariants = cva(
  [
    'inline-flex items-center justify-center rounded-lg',
    'transition-all duration-200 select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-95',
  ],
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-accent',
        ghost:
          'text-foreground/70 hover:text-foreground hover:bg-accent',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        xs: 'h-6 w-6 [&>svg]:h-3 [&>svg]:w-3',
        sm: 'h-8 w-8 [&>svg]:h-4 [&>svg]:w-4',
        md: 'h-9 w-9 [&>svg]:h-4 [&>svg]:w-4',
        lg: 'h-10 w-10 [&>svg]:h-5 [&>svg]:w-5',
        xl: 'h-12 w-12 [&>svg]:h-6 [&>svg]:w-6',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  },
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /** Accessible label — required for icon-only buttons. */
  'aria-label': string;
  loading?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Square icon-only button.
 *
 * @example
 * <IconButton aria-label="Close panel" onClick={onClose}>
 *   <X />
 * </IconButton>
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(iconButtonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        children
      )}
    </button>
  ),
);
IconButton.displayName = 'IconButton';

export { IconButton, iconButtonVariants };
