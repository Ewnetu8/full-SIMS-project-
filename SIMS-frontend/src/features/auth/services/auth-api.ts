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
import { getCsrfToken } from '@/utils/csrf';

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
   * Backend returns { user: {...}, access: "jwt_string" } and sets HttpOnly refresh_token cookie.
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
      role: (rawUser.role ? rawUser.role.toLowerCase() : 'student') as any,
      avatarUrl: rawUser.avatar_url || rawUser.avatarUrl,
      createdAt: rawUser.created_at || rawUser.createdAt || new Date().toISOString(),
      updatedAt: rawUser.updated_at || rawUser.updatedAt || new Date().toISOString(),
    };

    const accessToken = data.access || data.access_token || data.tokens?.accessToken || '';
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
   * Sends X-CSRFToken header and HttpOnly refresh_token cookie.
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT, {});
    } catch (e) {
      console.error('Logout request error:', e);
    } finally {
      try {
        await fetch('/api/auth/session', { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to clear session cookie:', e);
      }
    }
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
   */
  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const csrfToken = getCsrfToken();

    const response = await axios.post<any>(
      `${env.NEXT_PUBLIC_API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
      {},
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
      }
    );

    const data = response.data || {};
    const accessToken = data.access || data.access_token || data.tokens?.accessToken || '';

    return {
      tokens: {
        accessToken,
        refreshToken: data.refresh || data.tokens?.refreshToken || '',
        expiresAt: Date.now() + 15 * 60 * 1000,
      },
    } as any;
  },

  /**
   * GET /api/v1/auth/me
   */
  getMe: (): Promise<{ user: BaseUser }> =>
    apiClient
      .get<{ user: BaseUser }>(API_ENDPOINTS.AUTH.ME)
      .then((r) => {
        if (r.data?.user) {
          const u = r.data.user as any;
          if (u.first_name) { u.firstName = u.first_name; delete u.first_name; }
          if (u.last_name) { u.lastName = u.last_name; delete u.last_name; }
          if (u.role) u.role = u.role.toLowerCase();
        }
        return r.data;
      }),
};
