import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Variants ─────────────────────────────────────────────────────────────────

const inputVariants = cva(
  [
    'flex w-full rounded-lg border bg-background',
    'text-sm text-foreground placeholder:text-muted-foreground',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:border-[#102A7A] focus-visible:ring-2 focus-visible:ring-[#B08A00] focus-visible:ring-offset-0 dark:focus-visible:border-primary dark:focus-visible:ring-ring',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
  ],
  {
    variants: {
      variant: {
        default: 'border-input hover:border-border/80',
        error:   'border-destructive focus-visible:ring-destructive',
        success: 'border-success focus-visible:ring-success',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-3 text-sm',
        lg: 'h-11 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Icon or element rendered on the left inside the input. */
  leadingIcon?: React.ReactNode;
  /** Icon or element rendered on the right inside the input. */
  trailingIcon?: React.ReactNode;
  /** Error state — also changes border color. Use alongside `variant="error"`. */
  error?: boolean;
  /** Wrapper className for when icons are used. */
  wrapperClassName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Text input with optional leading/trailing icon slots.
 *
 * @example
 * <Input leadingIcon={<Mail className="h-4 w-4" />} placeholder="Email" />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      leadingIcon,
      trailingIcon,
      error,
      wrapperClassName,
      type = 'text',
      ...props
    },
    ref,
  ) => {
    const resolvedVariant = error ? 'error' : variant;
    const hasLeading  = Boolean(leadingIcon);
    const hasTrailing = Boolean(trailingIcon);

    if (!hasLeading && !hasTrailing) {
      return (
        <input
          ref={ref}
          type={type}
          className={cn(inputVariants({ variant: resolvedVariant, size }), className)}
          {...props}
        />
      );
    }

    return (
      <div className={cn('relative flex items-center', wrapperClassName)}>
        {hasLeading && (
          <span
            className="absolute left-3 flex items-center text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            inputVariants({ variant: resolvedVariant, size }),
            hasLeading  && 'pl-9',
            hasTrailing && 'pr-9',
            className,
          )}
          {...props}
        />
        {hasTrailing && (
          <span className="absolute right-3 flex items-center text-muted-foreground">
            {trailingIcon}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input, inputVariants };
