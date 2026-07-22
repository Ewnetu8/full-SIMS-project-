import { useEffect, useState } from 'react';

/**
 * Returns a debounced version of the given value that only updates after
 * the specified delay has elapsed without changes.
 *
 * Ideal for search inputs to avoid firing a query on every keystroke.
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 400);
 * // Use debouncedSearch in your query key
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
