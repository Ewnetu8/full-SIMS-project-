import * as React from 'react';

import { cn } from '@/lib';

// ─── Base Skeleton ────────────────────────────────────────────────────────────

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width in Tailwind class or CSS value. */
  width?:  string;
  /** Height in Tailwind class or CSS value. */
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full' | 'none';
}

/**
 * Shimmer skeleton placeholder.
 *
 * @example
 * <Skeleton className="h-4 w-48" />
 */
export function Skeleton({ className, rounded = 'md', ...props }: SkeletonProps) {
  const radiusMap = {
    none: 'rounded-none',
    sm:   'rounded-sm',
    md:   'rounded-md',
    lg:   'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      aria-hidden="true"
      className={cn('skeleton-shimmer', radiusMap[rounded], className)}
      {...props}
    />
  );
}

// ─── Skeleton Text ────────────────────────────────────────────────────────────

/** Multiple lines of skeleton text. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

// ─── Skeleton Avatar ──────────────────────────────────────────────────────────

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' }[size];
  return <Skeleton className={s} rounded="full" aria-hidden="true" />;
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

/** A full stats card skeleton placeholder. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-card p-5 space-y-4', className)}
      aria-hidden="true"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
        <Skeleton className="h-9 w-9" rounded="lg" />
      </div>
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

// ─── Skeleton Table ───────────────────────────────────────────────────────────

/** A table loading skeleton with N rows. */
export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border overflow-hidden', className)} aria-hidden="true">
      {/* Header */}
      <div className="flex gap-4 border-b border-border bg-muted/50 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ flex: i === 0 ? 2 : 1 }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-border last:border-0 px-4 py-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3" style={{ flex: c === 0 ? 2 : 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
