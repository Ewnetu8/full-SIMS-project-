import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib';

// â”€â”€â”€ Stats Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface StatsCardProps {
  title:     string;
  value:     string | number;
  delta?:    number;       // +/- percentage
  icon?:     React.ReactNode;
  suffix?:   string;
  loading?:  boolean;
  className?: string;
}

/**
 * Large KPI stats card with delta indicator.
 *
 * @example
 * <StatsCard title="Total Students" value={1240} delta={12.5} icon={<Users />} />
 */
export function StatsCard({ title, value, delta, icon, suffix, loading, className }: StatsCardProps) {
  if (loading) {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-5 space-y-3', className)}>
        <div className="h-3 w-24 rounded skeleton-shimmer" />
        <div className="h-8 w-20 rounded skeleton-shimmer" />
        <div className="h-2.5 w-32 rounded skeleton-shimmer" />
      </div>
    );
  }

  const DeltaIcon = delta === undefined ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor = delta === undefined ? '' : delta > 0 ? 'text-success' : delta < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className={cn('group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {value}{suffix && <span className="text-lg text-muted-foreground ml-1">{suffix}</span>}
          </p>
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      {DeltaIcon && delta !== undefined && (
        <div className={cn('mt-3 flex items-center gap-1 text-xs font-medium', deltaColor)}>
          <DeltaIcon className="h-3.5 w-3.5" />
          {Math.abs(delta)}% from last period
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Metric Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface MetricCardProps {
  label:     string;
  value:     string | number;
  icon?:     React.ReactNode;
  color?:    'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'ai';
  className?: string;
}

const metricColors = {
  default:     'bg-muted text-muted-foreground',
  primary:     'bg-primary/10 text-primary',
  success:     'bg-success/10 text-success',
  warning:     'bg-warning/10 text-warning-foreground',
  destructive: 'bg-destructive/10 text-destructive',
  ai:          'bg-ai-muted text-ai-primary',
};

/**
 * Compact horizontal metric card.
 *
 * @example
 * <MetricCard label="Pass Rate" value="87%" color="success" />
 */
export function MetricCard({ label, value, icon, color = 'default', className }: MetricCardProps) {
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3', className)}>
      {icon && (
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', metricColors[color])}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
      </div>
    </div>
  );
}

// â”€â”€â”€ Activity Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ActivityItem {
  id:      string;
  title:   string;
  time:    string;
  icon?:   React.ReactNode;
  color?:  string;
}

export interface ActivityCardProps {
  title?:    string;
  items:     ActivityItem[];
  className?: string;
}

/**
 * Timeline-style activity feed card.
 */
export function ActivityCard({ title = 'Recent Activity', items, className }: ActivityCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card', className)}>
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 px-5 py-3">
            <div className={cn(
              'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
              item.color ?? 'bg-muted text-muted-foreground',
            )}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// â”€â”€â”€ Info Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface InfoCardProps {
  title:     string;
  items:     { label: string; value: React.ReactNode }[];
  className?: string;
}

/**
 * Key-value information card.
 *
 * @example
 * <InfoCard title="Exam Details" items={[{ label: 'Duration', value: '2h' }]} />
 */
export function InfoCard({ title, items, className }: InfoCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <dl className="divide-y divide-border">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between px-5 py-3 gap-4">
            <dt className="text-xs text-muted-foreground shrink-0">{item.label}</dt>
            <dd className="text-sm font-medium text-right">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// â”€â”€â”€ Status Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type StatusType = 'active' | 'inactive' | 'pending' | 'completed' | 'graded' | 'draft' | 'published' | 'failed';

export interface StatusBadgeProps {
  status:     StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; classes: string }> = {
  active:    { label: 'Active',     classes: 'bg-success/15 text-success' },
  inactive:  { label: 'Inactive',   classes: 'bg-muted text-muted-foreground' },
  pending:   { label: 'Pending',    classes: 'bg-warning/15 text-warning-foreground' },
  completed: { label: 'Completed',  classes: 'bg-info/15 text-info' },
  graded:    { label: 'Graded',     classes: 'bg-success/15 text-success' },
  draft:     { label: 'Draft',      classes: 'bg-muted text-muted-foreground' },
  published: { label: 'Published',  classes: 'bg-primary/15 text-primary' },
  failed:    { label: 'Failed',     classes: 'bg-destructive/15 text-destructive' },
};

/**
 * Coloured status chip for tables and cards.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = statusConfig[status];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
      cfg.classes,
      className,
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}
