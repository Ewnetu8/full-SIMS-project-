import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib';

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const formSelectClass = (error?: boolean) =>
  cn(
    'flex h-10 w-full items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-all duration-200',
    'placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'appearance-none bg-no-repeat bg-[right_0.75rem_center]',
    error ? 'border-destructive focus:ring-destructive' : 'border-input hover:border-border/80'
  );

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <select
          ref={ref}
          className={cn(formSelectClass(error), 'pr-9', className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none opacity-60" />
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
