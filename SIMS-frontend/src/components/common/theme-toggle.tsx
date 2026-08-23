'use client';

import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { THEME_LABELS } from '@/constants';
import { cn } from '@/lib';
import { useTheme } from '@/providers/theme-provider';

import type { ThemeMode } from '@/types';

const THEME_ICONS: Record<string, React.ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
};

interface ThemeToggleProps {
  /** Renders as a segmented control instead of a cycle button. */
  variant?: 'cycle' | 'segmented';
  className?: string;
}

/**
 * A reusable theme toggle component.
 *
 * `variant="cycle"` (default) — cycles through light -> dark on click.
 * `variant="segmented"` — renders a two-way toggle showing light and dark options.
 *
 * Both variants are WCAG-accessible with aria labels and focus styles.
 */
export function ThemeToggle({ variant = 'cycle', className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  // Prevent hydration mismatch — only render after mount
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  
  if (!mounted) {
    // Reserve space to prevent layout shift
    return <div className={cn('h-9 w-9', className)} aria-hidden />;
  }

  // Force system fallback into explicit light/dark for the toggle UI
  const current = (theme === 'dark' || theme === 'system') && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : theme === 'dark' ? 'dark' : 'light';

  if (variant === 'cycle') {
    const nextTheme: Record<string, ThemeMode> = {
      light: 'dark',
      dark: 'light',
    };

    return (
      <button
        type="button"
        onClick={() => setTheme(nextTheme[current] as ThemeMode)}
        className={cn(
          'inline-flex items-center justify-center rounded-md p-2',
          'text-foreground/70 hover:text-foreground',
          'hover:bg-accent transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        aria-label={`Switch to ${nextTheme[current]} theme`}
        title={`Current theme: ${THEME_LABELS[current as ThemeMode]}`}
      >
        {THEME_ICONS[current]}
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme selection"
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-muted p-1 gap-0.5',
        className,
      )}
    >
      {(['light', 'dark'] as ThemeMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={current === mode}
          onClick={() => setTheme(mode)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium',
            'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            current === mode
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-label={`${THEME_LABELS[mode]} theme`}
        >
          {THEME_ICONS[mode]}
          <span className="capitalize">{THEME_LABELS[mode]}</span>
        </button>
      ))}
    </div>
  );
}
