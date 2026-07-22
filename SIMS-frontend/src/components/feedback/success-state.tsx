'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui';
import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SuccessStateProps {
  title?:       string;
  description?: string;
  /** Primary CTA button */
  action?:      { label: string; onClick: () => void };
  /** Secondary link/action */
  secondaryAction?: { label: string; onClick: () => void };
  /** Full-page vs. inline section variant. */
  fullPage?:    boolean;
  className?:   string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Success state with animated check icon.
 *
 * @example
 * <SuccessState
 *   title="Exam submitted!"
 *   description="Your answers have been saved and are being graded."
 *   action={{ label: 'View Results', onClick: () => router.push('/results') }}
 * />
 */
export function SuccessState({
  title       = 'Success!',
  description,
  action,
  secondaryAction,
  fullPage    = false,
  className,
}: SuccessStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-4 text-center px-6',
        fullPage ? 'min-h-[60vh]' : 'py-16',
        className,
      )}
    >
      {/* Animated check icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success"
      >
        <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col gap-1.5"
      >
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </motion.div>

      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex items-center gap-3"
        >
          {action && (
            <Button variant="default" size="md" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" size="md" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}
