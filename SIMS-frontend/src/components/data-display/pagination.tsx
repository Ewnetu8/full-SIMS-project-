import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginationProps {
  /** Total number of items. */
  total:        number;
  /** Number of items per page. */
  pageSize:     number;
  /** Current page (1-indexed). */
  page:         number;
  /** Called when the page changes. */
  onPageChange: (page: number) => void;
  /** How many page buttons to show around the current page. Default: 2 */
  siblingCount?: number;
  /** Show first/last page jump buttons. Default: true */
  showEdges?:   boolean;
  className?:   string;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function getPageRange(total: number, page: number, siblings: number): (number | '...')[] {
  const totalPages  = total;
  const leftSibling = Math.max(page - siblings, 1);
  const rightSibling = Math.min(page + siblings, totalPages);

  const showLeftDots  = leftSibling > 2;
  const showRightDots = rightSibling < totalPages - 1;

  if (!showLeftDots && showRightDots) {
    const leftItems = Array.from({ length: 3 + siblings * 2 }, (_, i) => i + 1);
    return [...leftItems, '...', totalPages];
  }

  if (showLeftDots && !showRightDots) {
    const rightItems = Array.from(
      { length: 3 + siblings * 2 },
      (_, i) => totalPages - (3 + siblings * 2) + i + 1,
    );
    return [1, '...', ...rightItems];
  }

  if (showLeftDots && showRightDots) {
    const middleItems = Array.from(
      { length: rightSibling - leftSibling + 1 },
      (_, i) => leftSibling + i,
    );
    return [1, '...', ...middleItems, '...', totalPages];
  }

  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Standalone accessible pagination component.
 * Designed to work independently of DataTable for server-side paginated APIs.
 *
 * @example
 * <Pagination
 *   total={120}
 *   pageSize={10}
 *   page={currentPage}
 *   onPageChange={setCurrentPage}
 * />
 */
export function Pagination({
  total,
  pageSize,
  page,
  onPageChange,
  siblingCount = 1,
  showEdges    = true,
  className,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages = getPageRange(totalPages, page, siblingCount);

  const canPrev  = page > 1;
  const canNext  = page < totalPages;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      {/* First page */}
      {showEdges && (
        <PaginationButton
          onClick={() => onPageChange(1)}
          disabled={!canPrev}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </PaginationButton>
      )}

      {/* Previous page */}
      <PaginationButton
        onClick={() => onPageChange(page - 1)}
        disabled={!canPrev}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </PaginationButton>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <PaginationButton
            key={p}
            onClick={() => onPageChange(p as number)}
            active={p === page}
            aria-label={`Go to page ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </PaginationButton>
        ),
      )}

      {/* Next page */}
      <PaginationButton
        onClick={() => onPageChange(page + 1)}
        disabled={!canNext}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </PaginationButton>

      {/* Last page */}
      {showEdges && (
        <PaginationButton
          onClick={() => onPageChange(totalPages)}
          disabled={!canNext}
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </PaginationButton>
      )}
    </nav>
  );
}

// ─── Pagination summary ───────────────────────────────────────────────────────

export interface PaginationSummaryProps {
  total:    number;
  page:     number;
  pageSize: number;
  className?: string;
}

/**
 * Displays "Showing X–Y of Z results" summary text.
 */
export function PaginationSummary({ total, page, pageSize, className }: PaginationSummaryProps) {
  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);

  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      Showing{' '}
      <strong className="font-semibold text-foreground">{start}–{end}</strong>{' '}
      of{' '}
      <strong className="font-semibold text-foreground">{total}</strong> results
    </p>
  );
}

// ─── Internal ─────────────────────────────────────────────────────────────────

interface PaginationButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

function PaginationButton({ active, className, children, ...props }: PaginationButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-8 min-w-8 items-center justify-center rounded-md border px-1.5 text-sm',
        'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        active
          ? 'border-primary bg-primary text-white font-medium'
          : 'border-border bg-background hover:bg-accent hover:text-accent-foreground',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
