import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { useAuthStore } from '@/features/auth/store';
import { env } from '@/lib/env';
import { createApiError } from '@/lib/errors';

import type { ApiErrorResponse } from '@/types';

// ─── Axios Client Factory ─────────────────────────────────────────────────────

/**
 * Creates a pre-configured Axios instance with:
 * - Base URL from environment
 * - JSON content-type headers
 * - Request interceptor (for auth token injection — ready for Phase 2)
 * - Response interceptor (normalises API errors into typed ApiError instances)
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: env.NEXT_PUBLIC_API_URL,
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
      const token = useAuthStore.getState().tokens?.accessToken;
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
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
          new Error('Network error. Please check your internet connection.'),
        );
      }

      const apiError = createApiError(response.data as ApiErrorResponse);

      if (response.status === 401) {
        useAuthStore.getState().clearSession();
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
