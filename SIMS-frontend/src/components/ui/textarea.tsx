import * as React from 'react';

import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Show character counter below the textarea. */
  showCount?: boolean;
  /** Maximum characters (used with showCount). */
  maxLength?: number;
  /** Error state — red border and ring. */
  error?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Multi-line text input with optional character counter.
 *
 * @example
 * <Textarea placeholder="Question text..." maxLength={500} showCount rows={4} />
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, showCount, maxLength, error, value, onChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(
      (value as string) ?? '',
    );

    const isControlled = value !== undefined;
    const displayValue = isControlled ? (value as string) : internalValue;
    const charCount    = displayValue?.length ?? 0;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!isControlled) setInternalValue(e.target.value);
      onChange?.(e);
    };

    return (
      <div className="flex flex-col gap-1">
        <textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border bg-background px-3 py-2',
            'text-sm text-foreground placeholder:text-muted-foreground',
            'transition-all duration-200 resize-y',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-destructive focus-visible:ring-destructive'
              : 'border-input',
            className,
          )}
          {...props}
        />
        {showCount && (
          <p
            className={cn(
              'self-end text-xs text-muted-foreground tabular-nums',
              maxLength && charCount >= maxLength && 'text-destructive',
            )}
            aria-live="polite"
          >
            {charCount}
            {maxLength ? `/${maxLength}` : ''}
          </p>
        )}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
