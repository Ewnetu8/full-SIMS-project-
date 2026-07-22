import * as React from 'react';

import { cn } from '@/lib';

/** Below-field hint text. */
export function HelperText({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  );
}
