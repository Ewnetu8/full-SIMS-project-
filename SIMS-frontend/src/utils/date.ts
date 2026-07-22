// ─── Date Formatting Utilities ────────────────────────────────────────────────

const DEFAULT_LOCALE = 'en-US';

/**
 * Formats a date value into a human-readable string.
 *
 * @example
 * formatDate('2024-01-15') // "January 15, 2024"
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

/**
 * Formats a date with time.
 *
 * @example
 * formatDateTime('2024-01-15T14:30:00') // "January 15, 2024 at 2:30 PM"
 */
export function formatDateTime(
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

/**
 * Formats a date into a short format.
 *
 * @example
 * formatShortDate('2024-01-15') // "Jan 15, 2024"
 */
export function formatShortDate(
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Returns a relative time string such as "3 minutes ago" or "in 2 days".
 *
 * @example
 * formatRelativeTime(Date.now() - 1000 * 60 * 3) // "3 minutes ago"
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE,
): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = then - now;

  const units: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
    { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
    { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
    { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
    { unit: 'day', ms: 24 * 60 * 60 * 1000 },
    { unit: 'hour', ms: 60 * 60 * 1000 },
    { unit: 'minute', ms: 60 * 1000 },
    { unit: 'second', ms: 1000 },
  ];

  for (const { unit, ms } of units) {
    if (Math.abs(diff) >= ms) {
      return rtf.format(Math.round(diff / ms), unit);
    }
  }

  return rtf.format(0, 'second');
}

/**
 * Formats duration in seconds to a MM:SS or HH:MM:SS string.
 *
 * @example
 * formatDuration(3725) // "1:02:05"
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}
