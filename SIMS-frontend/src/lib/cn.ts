import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS class names, resolving conflicts intelligently.
 *
 * Uses `clsx` to handle conditional classes and `tailwind-merge` to deduplicate
 * and resolve Tailwind utility conflicts (e.g. `p-2 p-4` → `p-4`).
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', 'text-sm')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
