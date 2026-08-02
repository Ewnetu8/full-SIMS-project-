// ─── Environment Variable Validation ─────────────────────────────────────────
// Centralises access to environment variables and provides type-safe defaults.
// Uses Zod to validate at module-load time so misconfiguration fails fast.

import { z } from 'zod';

const envSchema = z.object({
  // Backend API base URL — required in all environments
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url('NEXT_PUBLIC_API_BASE_URL must be a valid URL')
    .default('http://localhost:8000'),

  // Application public URL — used for canonical links and OG meta
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL')
    .default('http://localhost:3000'),

  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

// Validate and throw a readable error if any required vars are missing
const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. Check your .env.local file.');
}

export const env = parsed.data;
