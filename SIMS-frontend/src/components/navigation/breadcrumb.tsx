'use client';

import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Maximum items to show before collapsing with ellipsis. */
  maxItems?: number;
  /** Show home icon for the first item. */
  showHome?: boolean;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Breadcrumb navigation with optional truncation.
 *
 * @example
 * <Breadcrumb
 *   items={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Exams',     href: '/exams' },
 *     { label: 'Mid-Term Maths' },
 *   ]}
 * />
 */
export function Breadcrumb({
  items,
  maxItems = 4,
  showHome = true,
  className,
}: BreadcrumbProps) {
  const needsTruncation = items.length > maxItems;
  const visibleItems = needsTruncation
    ? [items[0]!, null, ...items.slice(-(maxItems - 2))]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1 text-sm">
        {showHome && items.length > 0 && (
          <>
            <li>
              <Link
                href="/"
                className="flex items-center text-muted-foreground hover:text-[#B08A00] dark:hover:text-accent transition-colors"
                aria-label="Home"
              >
                <Home className="h-3.5 w-3.5" />
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            </li>
          </>
        )}

        {visibleItems.map((item, i) => {
          const isLast = i === visibleItems.length - 1;

          // Ellipsis placeholder
          if (item === null) {
            return (
              <React.Fragment key="ellipsis">
                <li>
                  <span className="flex items-center text-muted-foreground" aria-hidden="true">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </span>
                </li>
                {!isLast && (
                  <li aria-hidden="true">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </li>
                )}
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={item.href ?? item.label}>
              <li>
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-[#B08A00] dark:hover:text-accent transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      isLast
                        ? 'text-[#102A7A] dark:text-foreground font-semibold'
                        : 'text-muted-foreground',
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
