import { z } from 'zod';

// ─── Shared Password Rule ─────────────────────────────────────────────────────
// Used in reset-password only (login does NOT enforce strong rules on the
// client — that's the server's job).

export const strongPasswordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter (A–Z)')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter (a–z)')
  .regex(/[0-9]/, 'Must contain at least one number (0–9)')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character (!@#$…)');

// ─── Login Schema ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email:      z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password:   z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.output<typeof loginSchema>;

// ─── Forgot Password Schema ───────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
});

export type ForgotPasswordFormValues = z.output<typeof forgotPasswordSchema>;

// ─── Reset Password Schema ────────────────────────────────────────────────────

export const resetPasswordSchema = z
  .object({
    password:        strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path:    ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.output<typeof resetPasswordSchema>;


