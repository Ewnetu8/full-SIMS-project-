'use client';

import { Search, X, Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Shows spinner instead of search icon when true. */
  loading?: boolean;
  /** Callback when the clear button is pressed. */
  onClear?: () => void;
  /** Size variant. */
  size?: 'sm' | 'md' | 'lg';
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Search input with left search icon, optional loading state and clear button.
 *
 * @example
 * <SearchInput placeholder="Search exams..." onClear={() => setValue('')} value={value} />
 */
const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { className, loading = false, onClear, value, size = 'md', ...props },
    ref,
  ) => {
    const hasValue = value !== '' && value !== undefined;

    const sizeClasses = {
      sm: 'h-8 text-xs pl-8 pr-8',
      md: 'h-9 text-sm pl-9 pr-9',
      lg: 'h-11 text-base pl-10 pr-10',
    }[size];

    const iconSize = {
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    }[size];

    const iconLeft = {
      sm: 'left-2',
      md: 'left-2.5',
      lg: 'left-3',
    }[size];

    return (
      <div className="relative flex items-center w-full">
        {/* Left Icon */}
        <span
          className={cn(
            'absolute flex items-center pointer-events-none text-muted-foreground',
            iconLeft,
          )}
          aria-hidden="true"
        >
          {loading ? (
            <Loader2 className={cn(iconSize, 'animate-spin')} />
          ) : (
            <Search className={iconSize} />
          )}
        </span>

        {/* Input */}
        <input
          ref={ref}
          type="search"
          value={value}
          className={cn(
            'flex w-full rounded-lg border border-input bg-background',
            'text-foreground placeholder:text-muted-foreground',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            '[&::-webkit-search-cancel-button]:hidden', // hide native clear
            sizeClasses,
            className,
          )}
          {...props}
        />

        {/* Clear Button */}
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className={cn(
              'absolute right-2 flex items-center justify-center rounded',
              'text-muted-foreground hover:text-foreground transition-colors',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            )}
            aria-label="Clear search"
          >
            <X className={iconSize} />
          </button>
        )}
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';

export { SearchInput };
