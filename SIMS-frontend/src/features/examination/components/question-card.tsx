'use client';

import { CheckCircle2, Flag, Save } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib';

import type { ExaminationAnswer, ExaminationQuestion } from '../types';

interface ExaminationQuestionCardProps {
  question: ExaminationQuestion;
  index: number;
  total: number;
  answer: ExaminationAnswer | undefined;
  flagged: boolean;
  onChange: (answer: ExaminationAnswer) => void;
  onToggleFlag: () => void;
}

export function ExaminationQuestionCard({
  question,
  index,
  total,
  answer,
  flagged,
  onChange,
  onToggleFlag,
}: ExaminationQuestionCardProps) {
  const textAnswer = typeof answer === 'string' ? answer : '';
  const selectedOptions = Array.isArray(answer) ? answer : [];
  const wordCount = textAnswer.trim() ? textAnswer.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = textAnswer.length;

  const isChoice = question.type === 'MCQ' || question.type === 'multiple_choice' || question.type === 'true_false';
  const isShortAnswer = question.type === 'SHORT_ANSWER' || question.type === 'short_answer';
  const isEssay = question.type === 'ESSAY' || question.type === 'essay';
  const options =
    question.type === 'true_false'
      ? [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ]
      : question.options ?? [];

  return (
    <section
      aria-labelledby={`question-heading-${question.id}`}
      className="rounded-2xl border border-border/80 bg-card p-5 shadow-md sm:p-8"
    >
      {/* Question Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Question {index + 1} of {total}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              ({question.marks} {question.marks === 1 ? 'mark' : 'marks'})
            </span>
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
              {String(question.type).replace('_', ' ')}
            </span>
          </div>

          <h2
            id={`question-heading-${question.id}`}
            className="mt-4 text-base font-semibold leading-relaxed text-foreground sm:text-lg"
          >
            {question.prompt}
            {question.required && (
              <span className="ml-1 text-destructive" aria-label="Required question">
                *
              </span>
            )}
          </h2>
        </div>

        {/* Flag Button */}
        <button
          type="button"
          onClick={onToggleFlag}
          aria-pressed={flagged}
          className={cn(
            'inline-flex items-center gap-1.5 shrink-0 rounded-xl border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            flagged
              ? 'border-warning/50 bg-warning/15 text-warning dark:text-warning'
              : 'border-border/80 bg-muted/30 text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <Flag className={cn('h-3.5 w-3.5', flagged && 'fill-warning')} />
          <span>{flagged ? 'Flagged' : 'Flag'}</span>
        </button>
      </div>

      {/* Code Snippet Context if available */}
      {question.codeSnippet ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border/70 bg-muted/60 p-4 text-xs font-mono text-foreground">
          <pre>{question.codeSnippet}</pre>
        </div>
      ) : null}

      {/* Question Body Controls */}
      <div className="mt-6">
        {/* Single Choice / True-False / MCQ */}
        {isChoice && (
          <fieldset>
            <legend className="sr-only">Options for Question {index + 1}</legend>
            <div role="radiogroup" aria-label={`Answer for question ${index + 1}`} className="space-y-3">
              {options.map((option, optionIndex) => {
                const isSelected = textAnswer === option.id;
                const letter = String.fromCharCode(65 + optionIndex);
                return (
                  <label
                    key={option.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3.5 rounded-xl border p-4 transition-all hover:border-primary/50 hover:bg-accent/40',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                        : 'border-border/80 bg-background'
                    )}
                  >
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      value={option.id}
                      checked={isSelected}
                      onChange={() => onChange(option.id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition',
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {question.type === 'true_false' ? (option.id === 'true' ? 'T' : 'F') : letter}
                    </span>
                    <span className="text-sm font-medium text-foreground">{option.text}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Short Answer */}
        {isShortAnswer && (
          <div className="space-y-2">
            <input
              type="text"
              value={textAnswer}
              maxLength={question.maxCharacters ?? 200}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Type your concise answer here..."
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Short answer for question ${index + 1}`}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Limit response to key terms or numbers</span>
              <span>
                {charCount}/{question.maxCharacters ?? 200} characters
              </span>
            </div>
          </div>
        )}

        {/* Essay Question */}
        {isEssay && (
          <div className="space-y-2">
            <textarea
              value={textAnswer}
              maxLength={question.maxCharacters ?? 2000}
              onChange={(e) => onChange(e.target.value)}
              rows={8}
              placeholder="Write your comprehensive essay response here..."
              className="w-full resize-y rounded-xl border border-input bg-background p-4 text-sm leading-relaxed text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Essay response for question ${index + 1}`}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Ensure proper structure and clarity</span>
              <span>
                {charCount}/{question.maxCharacters ?? 2000} characters | {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function AutoSaveIndicator({
  state,
  lastSavedAt,
}: {
  state: 'idle' | 'saving' | 'saved';
  lastSavedAt: string | null;
}) {
  const formattedTime = lastSavedAt
    ? new Intl.DateTimeFormat('en-KE', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(lastSavedAt))
    : null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm"
      aria-live="polite"
    >
      {state === 'saving' ? (
        <>
          <Save className="h-3.5 w-3.5 animate-pulse text-primary" />
          <span>Saving answers…</span>
        </>
      ) : lastSavedAt ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span>Saved at {formattedTime}</span>
        </>
      ) : (
        <>
          <Save className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Auto-save active</span>
        </>
      )}
    </span>
  );
}