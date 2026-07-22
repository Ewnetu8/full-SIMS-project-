'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib';
import type { ExamWizardStep } from '../../types';

const STEPS: { key: ExamWizardStep; label: string; description: string }[] = [
  { key: 'basic_info', label: 'Basic Info', description: 'Title, course & marks' },
  { key: 'settings', label: 'Settings', description: 'Dates & access options' },
  { key: 'questions', label: 'Questions', description: 'Build question paper' },
  { key: 'review', label: 'Review', description: 'Preview & publish' },
];

interface WizardNavigationProps {
  currentStep: ExamWizardStep;
  completedSteps: Set<ExamWizardStep>;
  onStepClick?: (step: ExamWizardStep) => void;
}

export function WizardNavigation({ currentStep, completedSteps, onStepClick }: WizardNavigationProps) {
  return (
    <nav aria-label="Exam creation steps" className="mb-8">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, index) => {
          const isCurrent = step.key === currentStep;
          const isCompleted = completedSteps.has(step.key);
          const isClickable = isCompleted && onStepClick;

          return (
            <li key={step.key} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.key)}
                disabled={!isClickable}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1.5 w-full group',
                  isClickable ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                {/* Circle indicator */}
                <div
                  className={cn(
                    'relative flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200',
                    isCurrent
                      ? 'border-primary bg-primary text-white shadow-md shadow-primary/30'
                      : isCompleted
                      ? 'border-success bg-success text-white'
                      : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Labels */}
                <div className="hidden sm:block text-center">
                  <p
                    className={cn(
                      'text-xs font-semibold',
                      isCurrent ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{step.description}</p>
                </div>
              </button>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-[2px] flex-1 mx-2 rounded-full transition-all duration-300',
                    isCompleted ? 'bg-success' : 'bg-border',
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
