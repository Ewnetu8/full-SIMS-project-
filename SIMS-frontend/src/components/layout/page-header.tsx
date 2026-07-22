'use client';

import * as React from 'react';

import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PageHeaderProps {
  /** Main page title. */
  title: string;
  /** Subtitle / description below the title. */
  description?: string;
  /** Breadcrumb component rendered above the title. */
  breadcrumb?: React.ReactNode;
  /** Right-aligned action buttons. */
  actions?: React.ReactNode;
  /** Extra content below the title row. */
  children?: React.ReactNode;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Standard page header with title, optional description, breadcrumb, and action slot.
 *
 * @example
 * <PageHeader
 *   title="Manage Exams"
 *   description="Create, edit, and publish examinations"
 *   breadcrumb={<Breadcrumb />}
 *   actions={<Button>Create Exam</Button>}
 * />
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 pb-6', className)}>
      {breadcrumb}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground max-w-prose">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
