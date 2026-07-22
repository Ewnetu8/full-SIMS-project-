'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import * as React from 'react';

import { IconButton } from '@/components/ui';
import { cn } from '@/lib';

import { Sidebar, type SidebarProps } from './sidebar';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MobileNavProps extends SidebarProps {
  open:    boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Mobile drawer navigation — slides in from the left.
 * Renders a full-height sidebar inside an overlay.
 *
 * @example
 * <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
 */
export function MobileNav({ open, onClose, ...sidebarProps }: MobileNavProps) {
  // Lock body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={cn(
              'fixed left-0 top-0 z-50 h-full w-64 lg:hidden',
              'shadow-xl',
            )}
          >
            {/* Close button */}
            <div className="absolute right-2 top-2 z-10">
              <IconButton
                aria-label="Close navigation"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-sidebar-muted hover:text-sidebar-foreground"
              >
                <X className="h-4 w-4" />
              </IconButton>
            </div>

            <Sidebar
              {...sidebarProps}
              collapsed={false}
              className="w-full h-full"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
