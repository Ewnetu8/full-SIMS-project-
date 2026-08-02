/**
 * Auth API Service — Real Backend Integration Layer
 *
 * These functions call the actual Django REST Framework endpoints.
 * They are NOT used during mock mode — hooks import from `../mock` instead.
 *
 * To switch from mock → real backend:
 *   1. In each hook (`use-login.ts`, etc.) change the import from
 *      `'../mock'` to `'../services'`
 *   2. Ensure NEXT_PUBLIC_API_URL points to the DRF server
 *   3. Remove or disable `mockAuthService`
 *
 * DRF Endpoint Conventions (standard djangorestframework-simplejwt):
 *   POST /api/auth/login/           → { user, access, refresh }
 *   POST /api/auth/logout/          → 204 No Content
 *   POST /api/auth/token/refresh/   → { access }
 *   POST /api/auth/forgot-password/ → { message }
 *   POST /api/auth/reset-password/  → { message }
 *   GET  /api/auth/me/              → { user }
 */

import { apiClient } from '@/services';
import { API_ENDPOINTS } from '@/constants';

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
   */
  login: (credentials: LoginCredentials): Promise<AuthLoginResponse> =>
    apiClient
      .post<AuthLoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials)
      .then(async (r) => {
        if (r.data?.user) {
          const u = r.data.user as any;
          if (u.first_name) { u.firstName = u.first_name; delete u.first_name; }
          if (u.last_name) { u.lastName = u.last_name; delete u.last_name; }
          if (u.role) u.role = u.role.toLowerCase();
        }
        
        // Synchronize Next.js edge middleware session cookie
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: r.data.user.id,
              role: r.data.user.role,
              exp: r.data.tokens?.expiresAt || Date.now() + 8 * 60 * 60 * 1000,
              rememberMe: credentials.rememberMe,
            }),
          });
        } catch (e) {
          console.error('Failed to sync session cookie:', e);
        }

        return r.data;
      }),

  /**
   * POST /api/v1/auth/logout
   */
  logout: (): Promise<void> =>
    apiClient
      .post<void>(API_ENDPOINTS.AUTH.LOGOUT, {})
      .then(async () => {
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch (e) {
          console.error('Failed to clear session cookie:', e);
        }
      }),

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
  refreshToken: (): Promise<RefreshTokenResponse> =>
    apiClient
      .post<RefreshTokenResponse>(API_ENDPOINTS.AUTH.REFRESH, {})
      .then((r) => r.data),

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
