'use client';

import * as React from 'react';
import { type FieldPath, type FieldValues, FormProvider, type UseFormReturn } from 'react-hook-form';

// ─── Form Wrapper ─────────────────────────────────────────────────────────────

export interface FormWrapperProps<T extends FieldValues> {
  form:      UseFormReturn<T>;
  onSubmit:  (data: T) => void | Promise<void>;
  children:  React.ReactNode;
  className?: string;
  id?:        string;
}

/**
 * Wraps a React Hook Form `useForm()` instance with `<FormProvider>` and a `<form>` element.
 *
 * @example
 * const form = useForm<SignInSchema>({ resolver: zodResolver(schema) });
 * <FormWrapper form={form} onSubmit={handleSignIn}>...</FormWrapper>
 */
export function FormWrapper<T extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
  id,
}: FormWrapperProps<T>) {
  return (
    <FormProvider {...form}>
      <form
        id={id}
        onSubmit={form.handleSubmit(onSubmit)}
        className={className}
        noValidate
      >
        {children}
      </form>
    </FormProvider>
  );
}

// Re-export common RHF hooks for convenience
export { useFormContext, Controller } from 'react-hook-form';
export type { FieldPath, FieldValues };
