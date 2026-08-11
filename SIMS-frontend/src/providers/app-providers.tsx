'use client';

import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Composes all global providers into a single wrapper component.
 *
 * Ordering matters:
 * 1. ThemeProvider — needs to be the outermost wrapper to prevent flash of
 *    wrong theme during hydration.
 * 2. QueryProvider — wraps data-fetching infrastructure.
 * 3. AuthProvider — handles authentication state.
 *
 * To add a new provider:
 * 1. Create it in this directory.
 * 2. Export from `index.ts`.
 * 3. Nest it here in the appropriate order.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>{children}</AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
