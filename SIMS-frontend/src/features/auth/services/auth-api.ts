/**
 * Auth API Service — Real Backend Integration Layer
 *
 * These functions call the actual Django REST Framework endpoints.
 *
 * DRF Endpoint Conventions:
 *   POST /api/v1/auth/login        → { user, access }
 *   POST /api/v1/auth/logout       → 204 No Content
 *   POST /api/v1/auth/refresh      → { access }
 *   POST /api/v1/auth/register     → { message, user }
 *   GET  /api/v1/auth/me           → { user }
 */

import axios from 'axios';
import { apiClient } from '@/services';
import { API_ENDPOINTS } from '@/constants';
import { env } from '@/lib/env';

import type {
  LoginCredentials,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AuthLoginResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  RefreshTokenResponse,
} from '../types';
import type { BaseUser } from '@/types';

// ─── CSRF Helper ──────────────────────────────────────────────────────────────

/**
 * Read the Django CSRF token from the browser cookie.
 * Django sets a readable (non-HttpOnly) `csrftoken` cookie which is required
 * in the `X-CSRFToken` header for state-mutating requests that enforce CSRF.
 */
function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : '';
}

export const authApi = {
  /**
   * POST /api/v1/auth/register
   */
  register: (data: any): Promise<{ message: string; user?: BaseUser }> =>
    apiClient
      .post<{ message: string; user?: BaseUser }>(API_ENDPOINTS.AUTH.REGISTER, data)
      .then((r) => {
        if (r.data?.user) {
          const u = r.data.user as any;
          if (u.first_name) { u.firstName = u.first_name; delete u.first_name; }
          if (u.last_name) { u.lastName = u.last_name; delete u.last_name; }
          if (u.role) u.role = u.role.toLowerCase();
        }
        return r.data;
      }),

  /**
   * POST /api/v1/auth/login
   */
  login: async (credentials: LoginCredentials): Promise<AuthLoginResponse> => {
    const response = await apiClient.post<any>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    const data = response.data || {};

    const rawUser = data.user || {};
    const formattedUser: BaseUser = {
      id: rawUser.id || 'usr-default',
      email: rawUser.email || credentials.email,
      firstName: rawUser.first_name || rawUser.firstName || 'User',
      lastName: rawUser.last_name || rawUser.lastName || '',
      role: (rawUser.role ? rawUser.role.toLowerCase() : 'admin') as any,
      avatarUrl: rawUser.avatar_url || rawUser.avatarUrl,
      createdAt: rawUser.created_at || rawUser.createdAt || new Date().toISOString(),
      updatedAt: rawUser.updated_at || rawUser.updatedAt || new Date().toISOString(),
    };

    const accessToken = data.access || data.accessToken || data.tokens?.accessToken || '';
    const expiresAt = Date.now() + (credentials.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000);

    const formattedTokens = {
      accessToken,
      refreshToken: data.refresh || data.tokens?.refreshToken || '',
      expiresAt,
    };

    // Synchronize Next.js edge middleware session cookie and AWAIT completion
    try {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: formattedUser.id,
          role: formattedUser.role,
          exp: expiresAt,
          rememberMe: credentials.rememberMe,
        }),
      });
    } catch (e) {
      console.error('Failed to sync session cookie:', e);
    }

    return {
      user: formattedUser,
      tokens: formattedTokens,
      message: data.message || 'Login successful',
    };
  },

  /**
   * POST /api/v1/auth/logout
   */
  logout: (): Promise<void> => {
    const csrfToken = getCsrfToken();
    return apiClient
      .post<void>(
        API_ENDPOINTS.AUTH.LOGOUT,
        {},
        {
          withCredentials: true,
          headers: {
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
        }
      )
      .catch((err: any) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '[DEV LOG] Logout request encountered an error (e.g. CSRF or session expired):',
            err?.message || err
          );
        }
      })
      .then(async () => {
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch (e) {
          console.error('Failed to clear session cookie:', e);
        }
      });
  },

  /**
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword: (payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> =>
    apiClient
      .post<ForgotPasswordResponse>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload)
      .then((r) => r.data),

  /**
   * POST /api/v1/auth/reset-password
   */
  resetPassword: (payload: ResetPasswordPayload): Promise<ResetPasswordResponse> =>
    apiClient
      .post<ResetPasswordResponse>(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload)
      .then((r) => r.data),

  /**
   * POST /api/v1/auth/refresh
   *
   * Uses a raw axios call (bypasses the apiClient interceptors to avoid loops)
   * and includes the Django CSRF token from the browser cookie in the
   * X-CSRFToken header, which is required by enforce_csrf() on the backend.
   */
  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const csrfToken = getCsrfToken();

    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG] Refresh request - CSRF token present:', !!csrfToken);
    }

    const response = await axios.post<any>(
      `${env.NEXT_PUBLIC_API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
      {},
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
      }
    );

    return response.data;
  },
};


