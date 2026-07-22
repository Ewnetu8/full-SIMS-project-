'use client';

import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Separator ────────────────────────────────────────────────────────────────

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className,
    )}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

// ─── Divider (with optional label) ───────────────────────────────────────────

export interface DividerProps {
  /** Text label in the center of the divider line. */
  label?: string;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Decorative divider, optionally with a centered text label.
 *
 * @example
 * <Divider label="or continue with" />
 */
function Divider({ label, className, orientation = 'horizontal' }: DividerProps) {
  if (!label) {
    return (
      <Separator
        orientation={orientation}
        className={className}
        decorative
      />
    );
  }

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 text-xs text-muted-foreground',
        className,
      )}
      role="separator"
      aria-hidden="true"
    >
      <Separator className="flex-1" />
      <span className="shrink-0 select-none">{label}</span>
      <Separator className="flex-1" />
    </div>
  );
}

export { Separator, Divider };
