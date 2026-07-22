import { Check } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgressStep {
  label:       string;
  description?: string;
}

export interface ProgressIndicatorProps {
  steps:        ProgressStep[];
  currentStep:  number; // 0-indexed
  orientation?: 'horizontal' | 'vertical';
  className?:   string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Multi-step progress indicator (step wizard).
 *
 * @example
 * <ProgressIndicator
 *   steps={[{ label: 'Details' }, { label: 'Questions' }, { label: 'Review' }]}
 *   currentStep={1}
 * />
 */
export function ProgressIndicator({
  steps,
  currentStep,
  orientation = 'horizontal',
  className,
}: ProgressIndicatorProps) {
  if (orientation === 'vertical') {
    return (
      <ol
        className={cn('flex flex-col gap-0', className)}
        aria-label="Progress"
      >
        {steps.map((step, i) => {
          const done    = i < currentStep;
          const current = i === currentStep;
          return (
            <li key={i} className="flex gap-4">
              {/* Line + circle */}
              <div className="flex flex-col items-center">
                <StepCircle index={i} done={done} current={current} />
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-px flex-1 min-h-6',
                      done ? 'bg-primary' : 'bg-border',
                    )}
                  />
                )}
              </div>
              {/* Text */}
              <div className={cn('pb-6', i === steps.length - 1 && 'pb-0')}>
                <p className={cn(
                  'text-sm font-medium',
                  current ? 'text-foreground' : done ? 'text-muted-foreground' : 'text-muted-foreground/60',
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <nav aria-label="Progress" className={cn('flex items-center', className)}>
      <ol className="flex w-full items-center">
        {steps.map((step, i) => {
          const done    = i < currentStep;
          const current = i === currentStep;
          const isLast  = i === steps.length - 1;

          return (
            <li
              key={i}
              className={cn('flex items-center', !isLast && 'flex-1')}
              aria-current={current ? 'step' : undefined}
            >
              <div className="flex flex-col items-center gap-1.5">
                <StepCircle index={i} done={done} current={current} />
                <span className={cn(
                  'text-[11px] font-medium whitespace-nowrap',
                  current ? 'text-primary' : done ? 'text-muted-foreground' : 'text-muted-foreground/50',
                )}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'h-px flex-1 mx-2 mb-4',
                    done ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Step Circle ─────────────────────────────────────────────────────────────

function StepCircle({
  index,
  done,
  current,
}: {
  index:   number;
  done:    boolean;
  current: boolean;
}) {
  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold',
        'transition-all duration-300',
        done
          ? 'border-primary bg-primary text-white'
          : current
          ? 'border-primary bg-background text-primary'
          : 'border-border bg-background text-muted-foreground/50',
      )}
    >
      {done ? (
        <Check className="h-4 w-4" strokeWidth={3} />
      ) : (
        <span>{index + 1}</span>
      )}
    </span>
  );
}
