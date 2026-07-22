'use client';

import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// ─── Query Client Factory ─────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /**
         * Data is considered fresh for 60 seconds; no refetch within that window.
         * Reduces redundant network requests for stable reference data.
         */
        staleTime: 60 * 1_000,

        /**
         * Failed queries retry up to 3 times with exponential back-off.
         * Disabled for auth-related 401/403 errors (handled by interceptors).
         */
        retry: (failureCount, error) => {
          if (error instanceof Error && 'statusCode' in error) {
            const statusCode = (error as { statusCode: number }).statusCode;
            if (statusCode === 401 || statusCode === 403) return false;
          }
          return failureCount < 3;
        },

        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ─── SSR-Safe Singleton ───────────────────────────────────────────────────────
// Next.js App Router requires a separate QueryClient per request on the server,
// but a shared singleton on the client to avoid re-creating it on re-renders.

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    // Always create a new client on the server
    return makeQueryClient();
  }
  // Reuse browser singleton
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

// ─── Provider ────────────────────────────────────────────────────────────────

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Provides TanStack Query's QueryClientProvider to the component tree.
 *
 * Exposes ReactQueryDevtools in development mode only.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
