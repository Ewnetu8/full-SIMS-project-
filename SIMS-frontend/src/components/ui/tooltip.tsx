'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Provider ─────────────────────────────────────────────────────────────────

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot     = TooltipPrimitive.Root;
const TooltipTrigger  = TooltipPrimitive.Trigger;

// ─── Content ─────────────────────────────────────────────────────────────────

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 max-w-xs rounded-md border border-border bg-popover px-3 py-1.5',
        'text-popover-foreground text-xs shadow-md',
        'data-[state=delayed-open]:animate-zoom-in data-[state=closed]:animate-zoom-out',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// ─── Composed Tooltip ─────────────────────────────────────────────────────────

export interface TooltipProps {
  /** Content inside the tooltip. */
  content: React.ReactNode;
  /** Element that triggers the tooltip. */
  children: React.ReactNode;
  /** Side where the tooltip appears. */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Delay before tooltip opens (ms). */
  delayDuration?: number;
  className?: string;
}

/**
 * Simple tooltip wrapper — just wrap any element and supply `content`.
 *
 * @example
 * <Tooltip content="Edit this exam">
 *   <IconButton aria-label="Edit"><Pencil /></IconButton>
 * </Tooltip>
 */
function Tooltip({ content, children, side = 'top', delayDuration = 400, className }: TooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipRoot>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className={className}>
          {content}
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}

export {
  Tooltip,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
};
