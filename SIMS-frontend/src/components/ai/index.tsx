'use client';

/**
 * AI Components — Specialized components for AI-powered features.
 *
 * All components are theme-aware and use the AI colour tokens
 * (--ai-primary, --ai-accent, --ai-muted, etc.) defined in globals.css.
 */

import { motion } from 'framer-motion';
import { Brain, Sparkles, Lightbulb, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib';

// ─── AI Insight Card ──────────────────────────────────────────────────────────

export interface AIInsightCardProps {
  title:       string;
  insight:     string;
  type?:       'insight' | 'recommendation' | 'warning' | 'success';
  confidence?: number;   // 0–100
  className?:  string;
}

const insightConfig = {
  insight:        { icon: Brain,        iconClass: 'text-ai-primary',    bg: 'bg-ai-muted',           border: 'border-ai-border' },
  recommendation: { icon: Lightbulb,   iconClass: 'text-warning',        bg: 'bg-warning/10',         border: 'border-warning/30' },
  warning:        { icon: AlertCircle, iconClass: 'text-destructive',    bg: 'bg-destructive/10',     border: 'border-destructive/30' },
  success:        { icon: CheckCircle2, iconClass: 'text-success',       bg: 'bg-success/10',         border: 'border-success/30' },
};

/**
 * Card displaying an AI-generated insight with optional confidence score.
 *
 * @example
 * <AIInsightCard
 *   title="Performance Trend"
 *   insight="Students who complete practice tests score 23% higher on average."
 *   confidence={92}
 * />
 */
export function AIInsightCard({
  title,
  insight,
  type      = 'insight',
  confidence,
  className,
}: AIInsightCardProps) {
  const cfg = insightConfig[type];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'rounded-xl border p-4 transition-all duration-200 hover:shadow-md',
        cfg.bg,
        cfg.border,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 shrink-0', cfg.iconClass)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            {confidence !== undefined && (
              <ConfidenceBadge confidence={confidence} />
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── AI Feedback Card ─────────────────────────────────────────────────────────

export interface AIFeedbackCardProps {
  feedback:    string;
  score?:      number;   // 0–100
  category?:   string;
  className?:  string;
}

/**
 * Displays AI-generated written feedback for an exam submission.
 *
 * @example
 * <AIFeedbackCard
 *   feedback="The answer demonstrates a solid understanding of core concepts but lacks specific examples."
 *   score={78}
 *   category="Critical Thinking"
 * />
 */
export function AIFeedbackCard({ feedback, score, category, className }: AIFeedbackCardProps) {
  return (
    <div
      className={cn(
        'ai-gradient-border rounded-xl bg-card p-4 space-y-3',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-ai-primary" aria-hidden="true" />
          <span className="text-xs font-semibold text-ai-primary uppercase tracking-wide">
            AI Feedback
          </span>
          {category && (
            <span className="text-xs text-muted-foreground">· {category}</span>
          )}
        </div>
        {score !== undefined && (
          <span className="text-sm font-bold text-foreground">{score}/100</span>
        )}
      </div>

      {/* Feedback text */}
      <p className="text-sm text-muted-foreground leading-relaxed">{feedback}</p>
    </div>
  );
}

// ─── AI Loader ────────────────────────────────────────────────────────────────

export interface AILoaderProps {
  message?:   string;
  className?: string;
}

/**
 * Animated loader displayed while AI is processing.
 *
 * @example
 * <AILoader message="Grading your exam…" />
 */
export function AILoader({ message = 'AI is processing…', className }: AILoaderProps) {
  return (
    <div
      role="status"
      aria-label={message}
      className={cn('flex flex-col items-center justify-center gap-4 py-10', className)}
    >
      {/* Pulsing brain icon */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-ai-primary/20"
        />
        <Brain className="relative h-8 w-8 text-ai-primary" aria-hidden="true" />
      </div>

      {/* Typing dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-ai-primary"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-xs">{message}</p>
    </div>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────

export interface RecommendationItem {
  id:          string;
  title:       string;
  description: string;
  priority?:   'high' | 'medium' | 'low';
}

export interface RecommendationCardProps {
  title?:        string;
  items:         RecommendationItem[];
  className?:    string;
}

const priorityConfig = {
  high:   'bg-destructive/10 text-destructive',
  medium: 'bg-warning/10 text-warning-foreground',
  low:    'bg-muted text-muted-foreground',
};

/**
 * Card listing AI-generated recommendations.
 *
 * @example
 * <RecommendationCard
 *   items={[
 *     { id: '1', title: 'Review Chapter 3', description: 'Low performance detected.', priority: 'high' }
 *   ]}
 * />
 */
export function RecommendationCard({ title = 'AI Recommendations', items, className }: RecommendationCardProps) {
  return (
    <div className={cn('rounded-xl border border-ai-border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-ai-border bg-ai-muted px-5 py-3">
        <Sparkles className="h-4 w-4 text-ai-primary" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-ai-primary">{title}</h3>
      </div>

      {/* Items */}
      <ul className="divide-y divide-border">
        {items.map((item, i) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-3 px-5 py-3.5"
          >
            <Lightbulb
              className="mt-0.5 h-4 w-4 shrink-0 text-ai-primary"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                {item.priority && (
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                      priorityConfig[item.priority],
                    )}
                  >
                    {item.priority}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

// ─── Confidence Badge ─────────────────────────────────────────────────────────

export interface ConfidenceBadgeProps {
  confidence:  number;  // 0–100
  showLabel?:  boolean;
  className?:  string;
}

/**
 * Visual badge showing AI confidence level (0–100%).
 * Colour shifts from destructive → warning → success based on score.
 *
 * @example
 * <ConfidenceBadge confidence={87} />
 */
export function ConfidenceBadge({ confidence, showLabel = true, className }: ConfidenceBadgeProps) {
  const clamped = Math.min(100, Math.max(0, confidence));

  const colorClass =
    clamped >= 80 ? 'bg-success/15 text-success'
    : clamped >= 60 ? 'bg-warning/15 text-warning-foreground'
    : 'bg-destructive/15 text-destructive';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        colorClass,
        className,
      )}
      aria-label={`AI confidence: ${clamped}%`}
    >
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      {showLabel && <span>{clamped}% confidence</span>}
    </span>
  );
}
