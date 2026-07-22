import { useEffect, useRef } from 'react';

/**
 * Stores a value from the previous render.
 * Useful for comparing before/after states in effects.
 *
 * @example
 * const prevCount = usePrevious(count);
 * useEffect(() => { if (prevCount !== count) doSomething(); }, [count]);
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  // eslint-disable-next-line react-hooks/refs -- this hook intentionally exposes the last committed value.
  return ref.current;
}
