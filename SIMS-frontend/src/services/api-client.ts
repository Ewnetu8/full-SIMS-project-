import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { useAuthStore } from '@/features/auth/store';
import { env } from '@/lib/env';
import { API_ENDPOINTS } from '@/constants';
import { createApiError } from '@/lib/errors';
import { toast } from '@/components/feedback';

import type { ApiErrorResponse } from '@/types';

// ─── CSRF Helper ──────────────────────────────────────────────────────────────

/**
 * Read the Django CSRF token from the browser cookie.
 * Django sets a readable (non-HttpOnly) `csrftoken` cookie which is required
 * in the `X-CSRFToken` header for state-mutating requests.
 */
function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : '';
}

// ─── Axios Client Factory ─────────────────────────────────────────────────────

/**
 * Creates a pre-configured Axios instance with:
 * - Base URL from environment
 * - JSON content-type headers
 * - Request interceptor (for auth token & CSRF token injection)
 * - Response interceptor (normalises API errors into typed ApiError instances)
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: env.NEXT_PUBLIC_API_BASE_URL,
    timeout: 15_000, // 15 s
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    withCredentials: true, // send cookies for refresh token flow
  });

  // ── Request Interceptor ──────────────────────────────────────────────────────
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Don't add auth token to login, register, or refresh endpoints
      const isAuthEndpoint =
        config.url?.includes(API_ENDPOINTS.AUTH.LOGIN) ||
        config.url?.includes(API_ENDPOINTS.AUTH.REGISTER) ||
        config.url?.includes(API_ENDPOINTS.AUTH.REFRESH);

      if (!isAuthEndpoint) {
        const token = useAuthStore.getState().tokens?.accessToken;
        if (token) {
          config.headers.set('Authorization', `Bearer ${token}`);
        }
      }
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers.set('X-CSRFToken', csrfToken);
      }

      // Log the full URL being called
      const fullUrl = `${config.baseURL}${config.url}`;
      console.log('🌐 API Request:', config.method?.toUpperCase(), fullUrl);

      return config;
    },
    (error: unknown) => Promise.reject(error),
  );

  // ── Response Interceptor ─────────────────────────────────────────────────────
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error)) return Promise.reject(error);

      const response = error.response;

      if (!response) {
        // Network error or timeout — no HTTP status available
        return Promise.reject(
          new Error("We couldn't connect to the server. Please check your connection and try again."),
        );
      }

      // Normalise the backend response into the ApiErrorResponse shape.
      // Django REST Framework uses `detail` (string) for error messages or key-value dictionary for field validation errors.
      const raw = response.data as Record<string, unknown> | undefined;
      let fieldErrors: Record<string, string[]> | undefined = (raw?.errors as Record<string, string[]>) ?? undefined;

      if (!fieldErrors && raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const potentialErrors: Record<string, string[]> = {};
        let hasFieldErrors = false;
        Object.entries(raw).forEach(([k, v]) => {
          if (k !== 'message' && k !== 'detail' && k !== 'statusCode' && k !== 'timestamp') {
            const arr = Array.isArray(v) ? v.map(String) : [String(v)];
            potentialErrors[k] = arr;
            hasFieldErrors = true;
          }
        });
        if (hasFieldErrors) {
          fieldErrors = potentialErrors;
        }
      }

      let messageStr =
        (raw?.message as string) ||
        (raw?.detail as string) ||
        (typeof raw?.detail === 'object' && raw?.detail !== null ? JSON.stringify(raw.detail) : '') ||
        '';

      if (!messageStr && fieldErrors && Object.keys(fieldErrors).length > 0) {
        const firstField = Object.keys(fieldErrors)[0];
        if (firstField && fieldErrors[firstField]) {
          const firstErr = fieldErrors[firstField]?.[0] || 'Validation error';
          messageStr = `${firstField}: ${firstErr}`;
        }
      }

      const normalised: ApiErrorResponse = {
        message: messageStr || response.statusText || 'An error occurred',
        statusCode: (raw?.statusCode as number) || response.status,
        errors: fieldErrors,
        timestamp: (raw?.timestamp as string) || new Date().toISOString(),
      };

      const apiError = createApiError(normalised);

      const isAuthEndpoint =
        error.config?.url?.includes(API_ENDPOINTS.AUTH.LOGIN) ||
        error.config?.url?.includes(API_ENDPOINTS.AUTH.REGISTER) ||
        error.config?.url?.includes(API_ENDPOINTS.AUTH.REFRESH);

      if (response.status === 401 && !isAuthEndpoint) {
        try {
          // Attempt to refresh the token using raw axios to avoid interceptor loops
          const refreshRes = await axios.post<{ access?: string }>(
            `${env.NEXT_PUBLIC_API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
            {},
            { withCredentials: true }
          );

          // The exact field name depends on the backend framework (access, access_token, etc)
          const newAccessToken = (refreshRes.data as any).access || (refreshRes.data as any).access_token || (refreshRes.data as any).accessToken || '';
          if (newAccessToken) {
            useAuthStore.getState().refreshSession({ 
              accessToken: newAccessToken,
              refreshToken: undefined,
              expiresAt: Date.now() + 15 * 60 * 1000,
            });
            // Retry the original request
            if (error.config) {
              error.config.headers.set('Authorization', `Bearer ${newAccessToken}`);
              return client(error.config);
            }
          }
        } catch (refreshError) {
          // If refresh fails, clear the session
          useAuthStore.getState().clearSession();
          toast.warning('Your session has expired. Please sign in again.', { id: 'session-expired' });
          return Promise.reject(apiError);
        }
      } else if (response.status === 401 && !isAuthEndpoint) {
        useAuthStore.getState().clearSession();
        toast.warning('Your session has expired. Please sign in again.', { id: 'session-expired' });
      }

      return Promise.reject(apiError);
    },
  );

  return client;
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

/** The shared API client instance used throughout the application. */
export const apiClient = createApiClient();

// ─── Convenience Wrappers ─────────────────────────────────────────────────────

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((r) => r.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((r) => r.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((r) => r.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((r) => r.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((r) => r.data),
};
