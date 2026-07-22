'use client';

/**
 * Examination Components — UI blocks for the exam-taking experience.
 *
 * Components:
 *  - QuestionCard      — displays a single question with options
 *  - ExamTimer         — countdown timer with warning states
 *  - ExamProgressBar   — tracks how many questions are answered
 *  - QuestionNavigator — grid of question numbers with status indicators
 *  - ExamStatusBadge   — coloured badge for exam lifecycle states
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Question Card ────────────────────────────────────────────────────────────

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

export interface QuestionOption {
  id:    string;
  label: string;
  text:  string;
}

export interface QuestionCardProps {
  index:       number;
  total:       number;
  question:    string;
  type:        QuestionType;
  options?:    QuestionOption[];
  value?:      string;
  onChange?:   (value: string) => void;
  required?:   boolean;
  disabled?:   boolean;
  className?:  string;
}

/**
 * Renders a single exam question with appropriate input controls.
 *
 * @example
 * <QuestionCard
 *   index={0}
 *   total={20}
 *   question="Which of the following best describes polymorphism?"
 *   type="multiple_choice"
 *   options={[{ id: 'a', label: 'A', text: 'Inheritance' }, ...]}
 *   value={answer}
 *   onChange={setAnswer}
 * />
 */
export function QuestionCard({
  index,
  total,
  question,
  type,
  options = [],
  value,
  onChange,
  required,
  disabled,
  className,
}: QuestionCardProps) {
  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={cn('rounded-xl border border-border bg-card p-6 space-y-5', className)}
    >
      {/* Question header */}
      <div className="flex items-start justify-between gap-4">
        <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {index + 1}
        </span>
        <p className="flex-1 text-sm font-medium text-foreground leading-relaxed">
          {question}
          {required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
        </p>
        <span className="shrink-0 text-xs text-muted-foreground">{index + 1}/{total}</span>
      </div>

      {/* Answer input */}
      <div
        role={type === 'multiple_choice' || type === 'true_false' ? 'radiogroup' : undefined}
        aria-label="Answer options"
      >
        {(type === 'multiple_choice' || type === 'true_false') && (
          <div className="flex flex-col gap-2">
            {(type === 'true_false'
              ? [{ id: 'true', label: 'A', text: 'True' }, { id: 'false', label: 'B', text: 'False' }]
              : options
            ).map((opt) => (
              <label
                key={opt.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border border-border px-4 py-3 cursor-pointer',
                  'transition-all duration-150 hover:border-primary/50 hover:bg-accent/50',
                  value === opt.id && 'border-primary bg-primary/5 ring-1 ring-primary',
                  disabled && 'pointer-events-none opacity-60',
                )}
              >
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={opt.id}
                  checked={value === opt.id}
                  onChange={() => onChange?.(opt.id)}
                  disabled={disabled}
                  className="sr-only"
                />
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                    value === opt.id
                      ? 'border-primary bg-primary text-white'
                      : 'border-border text-muted-foreground',
                  )}
                  aria-hidden="true"
                >
                  {opt.label}
                </span>
                <span className="text-sm">{opt.text}</span>
              </label>
            ))}
          </div>
        )}

        {type === 'short_answer' && (
          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            placeholder="Type your answer here…"
            className={cn(
              'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'transition-colors',
              disabled && 'opacity-60 cursor-not-allowed',
            )}
            aria-label="Short answer"
          />
        )}

        {type === 'essay' && (
          <textarea
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            placeholder="Write your answer here…"
            rows={6}
            className={cn(
              'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground resize-y',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'transition-colors',
              disabled && 'opacity-60 cursor-not-allowed',
            )}
            aria-label="Essay answer"
          />
        )}
      </div>
    </motion.div>
  );
}

// ─── Exam Timer ───────────────────────────────────────────────────────────────

export interface ExamTimerProps {
  /** Seconds remaining. */
  secondsLeft: number;
  /** Seconds at which to start showing warning styles. Default: 300 (5 min) */
  warnAt?:     number;
  /** Seconds at which to show critical/danger styles. Default: 60 */
  dangerAt?:   number;
  className?:  string;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * Countdown timer for exams. Changes colour as time runs low.
 *
 * @example
 * <ExamTimer secondsLeft={remainingSeconds} />
 */
export function ExamTimer({
  secondsLeft,
  warnAt   = 300,
  dangerAt = 60,
  className,
}: ExamTimerProps) {
  const isDanger  = secondsLeft <= dangerAt;
  const isWarning = secondsLeft <= warnAt && !isDanger;

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${formatTime(secondsLeft)}`}
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-mono font-semibold transition-colors',
        isDanger
          ? 'border-destructive/50 bg-destructive/10 text-destructive'
          : isWarning
          ? 'border-warning/50 bg-warning/10 text-warning-foreground'
          : 'border-border bg-card text-foreground',
        className,
      )}
    >
      <Clock
        className={cn(
          'h-4 w-4',
          isDanger && 'animate-spin-slow',
        )}
        aria-hidden="true"
      />
      <AnimatePresence mode="wait">
        <motion.span
          key={secondsLeft}
          initial={isDanger ? { scale: 1.1 } : undefined}
          animate={{ scale: 1 }}
          transition={{ duration: 0.1 }}
        >
          {formatTime(secondsLeft)}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ─── Exam Progress Bar ────────────────────────────────────────────────────────

export interface ExamProgressBarProps {
  answered:   number;
  total:      number;
  className?: string;
}

/**
 * Slim progress bar showing how many questions have been answered.
 *
 * @example
 * <ExamProgressBar answered={8} total={20} />
 */
export function ExamProgressBar({ answered, total, className }: ExamProgressBarProps) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Progress</span>
        <span>{answered}/{total} answered</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={answered}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${answered} of ${total} questions answered`}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ─── Question Navigator ───────────────────────────────────────────────────────

export type QuestionStatus = 'unanswered' | 'answered' | 'flagged' | 'current';

export interface QuestionNavigatorProps {
  total:         number;
  currentIndex:  number;
  statuses:      QuestionStatus[];
  onSelect:      (index: number) => void;
  className?:    string;
}

const statusStyles: Record<QuestionStatus, string> = {
  unanswered: 'border-border bg-background text-muted-foreground hover:border-primary/50',
  answered:   'border-success bg-success/10 text-success hover:bg-success/20',
  flagged:    'border-warning bg-warning/10 text-warning-foreground hover:bg-warning/20',
  current:    'border-primary bg-primary text-white shadow-sm',
};

/**
 * Grid of numbered question buttons for exam navigation.
 *
 * @example
 * <QuestionNavigator
 *   total={20}
 *   currentIndex={3}
 *   statuses={statuses}
 *   onSelect={setCurrentIndex}
 * />
 */
export function QuestionNavigator({
  total,
  currentIndex,
  statuses,
  onSelect,
  className,
}: QuestionNavigatorProps) {
  return (
    <nav aria-label="Question navigation" className={cn('space-y-3', className)}>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Questions
      </h4>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-success bg-success/10" />
          Answered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-border" />
          Unanswered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-warning bg-warning/10" />
          Flagged
        </span>
      </div>

      {/* Grid */}
      <div
        role="list"
        className="grid grid-cols-5 gap-1.5"
      >
        {Array.from({ length: total }).map((_, i) => {
          const status = i === currentIndex ? 'current' : (statuses[i] ?? 'unanswered');
          return (
            <button
              key={i}
              type="button"
              role="listitem"
              onClick={() => onSelect(i)}
              aria-label={`Question ${i + 1}, ${status}`}
              aria-current={i === currentIndex ? 'true' : undefined}
              className={cn(
                'flex h-8 w-full items-center justify-center rounded-md border text-xs font-semibold',
                'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                statusStyles[status],
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Exam Status Badge ────────────────────────────────────────────────────────

export type ExamStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'in_progress'
  | 'submitted'
  | 'grading'
  | 'graded'
  | 'expired'
  | 'cancelled';

export interface ExamStatusBadgeProps {
  status:     ExamStatus;
  className?: string;
}

const examStatusConfig: Record<ExamStatus, { label: string; classes: string }> = {
  draft:       { label: 'Draft',       classes: 'bg-muted text-muted-foreground' },
  scheduled:   { label: 'Scheduled',   classes: 'bg-info/15 text-info' },
  active:      { label: 'Active',      classes: 'bg-success/15 text-success' },
  in_progress: { label: 'In Progress', classes: 'bg-primary/15 text-primary' },
  submitted:   { label: 'Submitted',   classes: 'bg-info/15 text-info' },
  grading:     { label: 'Grading',     classes: 'bg-ai-muted text-ai-primary' },
  graded:      { label: 'Graded',      classes: 'bg-success/15 text-success' },
  expired:     { label: 'Expired',     classes: 'bg-muted text-muted-foreground' },
  cancelled:   { label: 'Cancelled',   classes: 'bg-destructive/15 text-destructive' },
};

/**
 * Coloured status badge for examination lifecycle states.
 *
 * @example
 * <ExamStatusBadge status="active" />
 */
export function ExamStatusBadge({ status, className }: ExamStatusBadgeProps) {
  const cfg = examStatusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        cfg.classes,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

// ─── Exam Navigation Buttons ──────────────────────────────────────────────────

export interface ExamNavButtonsProps {
  currentIndex:  number;
  total:         number;
  onPrevious:    () => void;
  onNext:        () => void;
  onSubmit?:     () => void;
  submitLabel?:  string;
  className?:    string;
}

/**
 * Previous / Next / Submit navigation for the exam-taking flow.
 *
 * @example
 * <ExamNavButtons
 *   currentIndex={currentQ}
 *   total={questions.length}
 *   onPrevious={goBack}
 *   onNext={goForward}
 *   onSubmit={submitExam}
 * />
 */
export function ExamNavButtons({
  currentIndex,
  total,
  onPrevious,
  onNext,
  onSubmit,
  submitLabel = 'Submit Exam',
  className,
}: ExamNavButtonsProps) {
  const isFirst = currentIndex === 0;
  const isLast  = currentIndex === total - 1;

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirst}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium',
          'transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40',
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      {isLast && onSubmit ? (
        <button
          type="button"
          onClick={onSubmit}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          {submitLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={isLast}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-white',
            'transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40',
          )}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
