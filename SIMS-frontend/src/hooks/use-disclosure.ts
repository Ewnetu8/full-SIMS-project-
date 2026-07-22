import { useCallback, useState } from 'react';

interface UseDisclosureOptions {
  defaultOpen?: boolean;
}

interface UseDisclosureReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * Manages open/close state for modals, drawers, dropdowns, and similar components.
 *
 * @example
 * const { isOpen, open, close } = useDisclosure();
 * return <Dialog open={isOpen} onOpenChange={close} />;
 */
export function useDisclosure(
  options: UseDisclosureOptions = {},
): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState(options.defaultOpen ?? false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((s) => !s), []);
  const onOpenChange = useCallback((value: boolean) => setIsOpen(value), []);

  return { isOpen, open, close, toggle, onOpenChange };
}
