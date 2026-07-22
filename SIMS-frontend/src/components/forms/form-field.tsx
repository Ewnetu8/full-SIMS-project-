'use client';

import * as React from 'react';
import {
  type FieldPath,
  type FieldValues,
  useFormContext,
  Controller,
  type ControllerRenderProps,
} from 'react-hook-form';

import { cn } from '@/lib';

import { ErrorMessage } from './error-message';
import { HelperText } from './helper-text';
import { Label } from './label';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name:        TName;
  label?:      string;
  helperText?: string;
  required?:   boolean;
  disabled?:   boolean;
  className?:  string;
  /**
   * Render prop — receives the RHF field props and should return an input element.
   */
  render: (props: {
    field: ControllerRenderProps<TFieldValues, TName> & { id?: string };
    error?: string;
  }) => React.ReactElement;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * RHF Controller-connected field wrapper. Handles label, helper, and error display.
 *
 * @example
 * <FormField
 *   name="email"
 *   label="Email address"
 *   required
 *   render={({ field, error }) => (
 *     <Input {...field} error={!!error} placeholder="you@example.com" />
 *   )}
 * />
 */
export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  helperText,
  required,
  disabled,
  className,
  render,
}: FormFieldProps<TFieldValues, TName>) {
  const { control } = useFormContext<TFieldValues>();
  const fieldId     = React.useId();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const errorMsg = fieldState.error?.message;

        return (
          <div className={cn('flex flex-col gap-1.5', className)}>
            {label && (
              <Label htmlFor={fieldId} required={required}>
                {label}
              </Label>
            )}

            {/* Clone child to inject id */}
            {render({ field: { ...field, id: fieldId, disabled }, error: errorMsg })}

            {errorMsg ? (
              <ErrorMessage>{errorMsg}</ErrorMessage>
            ) : helperText ? (
              <HelperText>{helperText}</HelperText>
            ) : null}
          </div>
        );
      }}
    />
  );
}
