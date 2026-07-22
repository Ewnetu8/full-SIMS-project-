// ─── Number Formatting Utilities ──────────────────────────────────────────────

const DEFAULT_LOCALE = 'en-US';

/**
 * Formats a number with locale-aware separators.
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Formats a decimal value as a percentage string.
 *
 * @example
 * formatPercentage(0.875) // "87.5%"
 * formatPercentage(87.5, false) // "87.5%"
 */
export function formatPercentage(
  value: number,
  isDecimal = true,
  decimals = 1,
  locale: string = DEFAULT_LOCALE,
): string {
  const normalized = isDecimal ? value : value / 100;
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(normalized);
}

/**
 * Formats a value as a currency string.
 *
 * @example
 * formatCurrency(1234.5) // "$1,234.50"
 */
export function formatCurrency(
  value: number,
  currency = 'USD',
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Returns a grade letter for a given numeric score (0–100).
 */
export function scoreToGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'C-';
  if (score >= 45) return 'D';
  return 'F';
}
