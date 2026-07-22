import { AlertCircle } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib';

/** Validation error message displayed below a form field. */
export function ErrorMessage({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      role="alert"
      aria-live="polite"
      className={cn('flex items-center gap-1.5 text-xs text-destructive', className)}
      {...props}
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}
