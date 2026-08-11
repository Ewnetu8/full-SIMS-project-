import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib';

// â”€â”€â”€ Variants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg',
    'font-medium transition-all duration-200 select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        default:
          'bg-[#102A7A] text-white shadow-sm hover:bg-[#B08A00] hover:text-[#102A7A] hover:shadow transition-all duration-200 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 dark:hover:text-primary-foreground',
        secondary:
          'bg-white border border-[#102A7A] text-[#102A7A] shadow-sm hover:bg-[#B08A00] hover:text-[#102A7A] hover:border-[#102A7A] transition-all duration-200 dark:bg-secondary dark:border-transparent dark:text-secondary-foreground dark:hover:bg-secondary/80',
        outline:
          'border border-[#102A7A] bg-white text-[#102A7A] hover:bg-[#B08A00] hover:text-[#102A7A] hover:border-[#102A7A] transition-all duration-200 dark:border-border dark:bg-transparent dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground',
        ghost:
          'bg-transparent text-[#102A7A] hover:bg-amber-500/10 hover:text-[#B08A00] transition-all duration-200 dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 transition-all duration-200',
        link: 'text-[#102A7A] hover:text-[#B08A00] underline-offset-4 hover:underline p-0 h-auto transition-colors duration-200 dark:text-primary dark:hover:text-accent',
        ai: [
          'text-white shadow-sm',
          'bg-[#102A7A]',
          'hover:bg-[#B08A00] hover:text-[#102A7A] hover:shadow-md transition-all duration-200',
          'dark:bg-accent dark:text-accent-foreground dark:hover:bg-accent/90',
        ],
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-md gap-1',
        sm: 'h-8 px-3 text-sm',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        xl: 'h-12 px-8 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render a different element / component while keeping button styles. */
  asChild?: boolean;
  /** Shows a loading spinner and disables the button. */
  loading?: boolean;
  /** Icon shown before the label. */
  leftIcon?: React.ReactNode;
  /** Icon shown after the label. */
  rightIcon?: React.ReactNode;
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Primary interactive element used throughout the application.
 *
 * @example
 * <Button variant="default" size="md" leftIcon={<PlusIcon />}>
 *   Create Exam
 * </Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        {asChild ? <Slottable>{children}</Slottable> : children}
        {!loading && rightIcon}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
