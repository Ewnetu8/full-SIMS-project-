import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Variants ─────────────────────────────────────────────────────────────────

const alertVariants = cva(
  [
    'relative flex w-full gap-3 rounded-xl border p-4',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        default:     'border-border bg-card text-card-foreground',
        info:        'border-info/30 bg-info/10 text-foreground',
        success:     'border-success/30 bg-success/10 text-foreground',
        warning:     'border-warning/30 bg-warning/10 text-foreground',
        destructive: 'border-destructive/30 bg-destructive/10 text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

const alertIcons = {
  default:     Info,
  info:        Info,
  success:     CheckCircle2,
  warning:     TriangleAlert,
  destructive: AlertCircle,
};

const alertIconColors = {
  default:     'text-muted-foreground',
  info:        'text-info',
  success:     'text-success',
  warning:     'text-warning',
  destructive: 'text-destructive',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?:       string;
  dismissible?: boolean;
  onDismiss?:   () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Contextual alert with icon, title, and optional dismiss button.
 *
 * @example
 * <Alert variant="success" title="Exam submitted!">
 *   Your answers have been saved.
 * </Alert>
 */
export function Alert({
  className,
  variant = 'default',
  title,
  dismissible = false,
  onDismiss,
  children,
  ...props
}: AlertProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  const Icon      = alertIcons[variant ?? 'default'];
  const iconColor = alertIconColors[variant ?? 'default'];

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconColor)} aria-hidden="true" />

      <div className="flex-1 min-w-0">
        {title && (
          <p className="mb-1 text-sm font-semibold">{title}</p>
        )}
        {children && (
          <div className="text-sm text-muted-foreground">{children}</div>
        )}
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          className={cn(
            'shrink-0 rounded-md p-0.5',
            'text-muted-foreground hover:text-foreground transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
