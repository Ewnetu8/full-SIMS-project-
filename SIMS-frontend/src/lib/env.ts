// ─── Environment Variable Validation ─────────────────────────────────────────
// Centralises access to environment variables and provides type-safe defaults.
// Uses Zod to validate at module-load time so misconfiguration fails fast.

import { z } from 'zod';

const envSchema = z.object({
  // Backend API base URL — required in all environments
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url('NEXT_PUBLIC_API_BASE_URL must be a valid URL')
    .default('https://localhost'),

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

// Helper to normalize the base API URL (e.g., stripping trailing /api/v1 or / so path constants compose cleanly)
const rawApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://localhost';
const normalizedApiBaseUrl = rawApiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '') || 'https://localhost';

// Validate and throw a readable error if any required vars are missing
const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: normalizedApiBaseUrl,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
});

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. Check your .env.local file.');
}

export const env = parsed.data;

// Debug log for troubleshooting
if (typeof window !== 'undefined') {
  console.log('🔧 Environment Configuration:');
  console.log('  - API Base URL:', env.NEXT_PUBLIC_API_BASE_URL);
  console.log('  - App URL:', env.NEXT_PUBLIC_APP_URL);
  console.log('  - Node Env:', env.NODE_ENV);
}
