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

const BASE = '/auth';

export const authApi = {
  /**
   * POST /api/auth/login/
   * DRF returns: { user: {...}, access: "...", refresh: "..." }
   * (Adapter needed to map `access` → `accessToken`, etc.)
   */
  login: (credentials: LoginCredentials): Promise<AuthLoginResponse> =>
    apiClient
      .post<AuthLoginResponse>(`${BASE}/login/`, credentials)
      .then((r) => r.data),

  /**
   * POST /api/auth/logout/
   * Sends the refresh token so the server can blacklist it.
   */
  logout: (refreshToken: string): Promise<void> =>
    apiClient
      .post<void>(`${BASE}/logout/`, { refreshToken })
      .then(() => undefined),

  /**
   * POST /api/auth/forgot-password/
   */
  forgotPassword: (payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> =>
    apiClient
      .post<ForgotPasswordResponse>(`${BASE}/forgot-password/`, payload)
      .then((r) => r.data),

  /**
   * POST /api/auth/reset-password/
   */
  resetPassword: (payload: ResetPasswordPayload): Promise<ResetPasswordResponse> =>
    apiClient
      .post<ResetPasswordResponse>(`${BASE}/reset-password/`, payload)
      .then((r) => r.data),

  /**
   * POST /api/auth/token/refresh/
   * simplejwt returns: { access: "..." }
   */
  refreshToken: (refreshToken: string): Promise<RefreshTokenResponse> =>
    apiClient
      .post<RefreshTokenResponse>(`${BASE}/token/refresh/`, { refresh: refreshToken })
      .then((r) => r.data),

  /**
   * GET /api/auth/me/
   * Returns the currently authenticated user's profile.
   */
  getMe: (): Promise<{ user: BaseUser }> =>
    apiClient
      .get<{ user: BaseUser }>(`${BASE}/me/`)
      .then((r) => r.data),
};
