'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Root ─────────────────────────────────────────────────────────────────────

const Tabs        = TabsPrimitive.Root;
const TabsContent = TabsPrimitive.Content;

// ─── Variants ─────────────────────────────────────────────────────────────────

const tabsListVariants = cva('flex items-center', {
  variants: {
    variant: {
      line: [
        'border-b border-border gap-0',
      ],
      boxed: [
        'rounded-lg bg-muted p-1 gap-1',
      ],
      pill: [
        'gap-1',
      ],
    },
  },
  defaultVariants: { variant: 'line' },
});

const tabsTriggerVariants = cva(
  [
    'inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium',
    'transition-all duration-200 select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        line: [
          'rounded-none border-b-2 border-transparent px-4 py-2.5',
          'text-muted-foreground',
          'hover:text-foreground',
          'data-[state=active]:border-primary data-[state=active]:text-foreground',
        ],
        boxed: [
          'rounded-md px-3 py-1.5',
          'text-muted-foreground',
          'hover:text-foreground',
          'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        ],
        pill: [
          'rounded-full px-4 py-1.5',
          'text-muted-foreground',
          'hover:bg-accent hover:text-foreground',
          'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
        ],
      },
    },
    defaultVariants: { variant: 'line' },
  },
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

// ─── Components ───────────────────────────────────────────────────────────────

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
export type { VariantProps };
