'use client';

import * as React from 'react';

import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FooterProps {
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'flex items-center justify-between border-t border-border',
        'bg-background px-6 py-3 text-xs text-muted-foreground',
        className,
      )}
    >
      <span>© {year} ExamSphere · AI-Powered Examination System</span>
      <span className="hidden sm:inline">Built for AASTU</span>
    </footer>
  );
}
