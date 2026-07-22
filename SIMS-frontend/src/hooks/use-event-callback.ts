import { useEffect, useRef, useCallback } from 'react';

/**
 * Returns a stable callback that always calls the latest version of `fn`
 * without triggering re-renders from stale closures.
 *
 * Useful for event listeners that capture props/state.
 */
export function useEventCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
): T {
  const ref = useRef<T>(fn);

  useEffect(() => {
    ref.current = fn;
  });

  return useCallback(
    (...args: Parameters<T>) => ref.current(...args),
    [],
  ) as T;
}
