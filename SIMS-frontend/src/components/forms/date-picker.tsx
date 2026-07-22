'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import 'react-day-picker/style.css';
import { Button } from '@/components/ui';
import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DatePickerProps {
  value?:      Date;
  onChange?:   (date: Date | undefined) => void;
  placeholder?: string;
  disabled?:   boolean;
  minDate?:    Date;
  maxDate?:    Date;
  error?:      boolean;
  className?:  string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Date picker built on react-day-picker v9 inside a Radix Popover.
 *
 * @example
 * <DatePicker value={date} onChange={setDate} placeholder="Select exam date" />
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  minDate,
  maxDate,
  error,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={disabled}
          className={cn(
            'w-full justify-start font-normal',
            !value && 'text-muted-foreground',
            error && 'border-destructive',
            className,
          )}
          leftIcon={<CalendarIcon className="h-4 w-4 opacity-70" />}
        >
          {value ? format(value, 'PPP') : placeholder}
        </Button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className={cn(
            'z-50 rounded-xl border border-border bg-popover p-3 shadow-lg',
            'data-[state=open]:animate-zoom-in focus:outline-none',
          )}
        >
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date);
              setOpen(false);
            }}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }]  : []),
            ]}
            classNames={{
              root:              'text-sm',
              month_caption:     'flex justify-center py-1 font-medium text-sm',
              nav:               'flex items-center justify-between px-1',
              button_previous:   cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-md',
                'border border-border hover:bg-accent transition-colors',
              ),
              button_next:       cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-md',
                'border border-border hover:bg-accent transition-colors',
              ),
              month_grid:        'w-full border-collapse mt-2',
              weekdays:          'flex',
              weekday:           'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center',
              week:              'flex w-full mt-1',
              day:               'relative p-0 text-center',
              day_button:        cn(
                'h-9 w-9 rounded-md text-sm font-normal',
                'hover:bg-accent hover:text-accent-foreground transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              ),
              selected:          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-md',
              today:             'bg-accent text-accent-foreground',
              outside:           'text-muted-foreground opacity-50',
              disabled:          'text-muted-foreground opacity-30 pointer-events-none',
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
