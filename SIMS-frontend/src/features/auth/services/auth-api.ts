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
import { getStoredUserIdentifier, saveUserIdentifier, isValidUuid } from '@/lib/user-identifier';

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
      .post<any>(API_ENDPOINTS.AUTH.REGISTER, data)
      .then((r) => {
        const backendResponse = r.data;
        
        if (backendResponse?.user) {
          const rawUser = backendResponse.user;
          const userEmail = rawUser.email || data.email;
          const userId = rawUser.id;

          let studentIdentifier =
            (data?.student_identifier && !isValidUuid(data.student_identifier) ? String(data.student_identifier).trim() : null) ||
            (rawUser?.student_identifier && !isValidUuid(rawUser.student_identifier) ? String(rawUser.student_identifier).trim() : null) ||
            (rawUser?.studentIdentifier && !isValidUuid(rawUser.studentIdentifier) ? String(rawUser.studentIdentifier).trim() : null) ||
            (rawUser?.student_id && !isValidUuid(rawUser.student_id) ? String(rawUser.student_id).trim() : null) ||
            undefined;

          let facultyIdentifier =
            (data?.faculty_identifier && !isValidUuid(data.faculty_identifier) ? String(data.faculty_identifier).trim() : null) ||
            (rawUser?.faculty_identifier && !isValidUuid(rawUser.faculty_identifier) ? String(rawUser.faculty_identifier).trim() : null) ||
            (rawUser?.facultyIdentifier && !isValidUuid(rawUser.facultyIdentifier) ? String(rawUser.facultyIdentifier).trim() : null) ||
            undefined;

          if (userEmail && (studentIdentifier || facultyIdentifier)) {
            saveUserIdentifier({
              email: userEmail,
              id: userId,
              studentIdentifier,
              facultyIdentifier,
              role: rawUser.role || data.role,
            });
          }

          const user: BaseUser = {
            id: rawUser.id || 'usr-default',
            email: userEmail,
            firstName: rawUser.first_name || data.first_name || 'User',
            lastName: rawUser.last_name || data.last_name || '',
            role: (rawUser.role ? rawUser.role.toLowerCase() : (data.role ? data.role.toLowerCase() : 'student')) as any,
            avatarUrl: rawUser.avatar_url || rawUser.avatarUrl,
            studentIdentifier,
            facultyIdentifier,
            createdAt: rawUser.created_at || new Date().toISOString(),
            updatedAt: rawUser.updated_at || new Date().toISOString(),
          };
          
          return {
            message: 'Registration successful',
            user,
          };
        }
        
        return { message: backendResponse.message || 'Registration successful' };
      }),

  /**
   * POST /api/v1/auth/login
   * Backend returns { user: {...}, access: "jwt_string" } and sets HttpOnly refresh_token cookie.
   */
  login: async (credentials: LoginCredentials): Promise<AuthLoginResponse> => {
    const response = await apiClient.post<any>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    const data = response.data || {};

    const rawUser = data.user || {};
    const userEmail = rawUser.email || credentials.email;
    const userId = rawUser.id;

    let studentIdentifier =
      (rawUser.student_identifier && !isValidUuid(rawUser.student_identifier) ? String(rawUser.student_identifier).trim() : null) ||
      (rawUser.studentIdentifier && !isValidUuid(rawUser.studentIdentifier) ? String(rawUser.studentIdentifier).trim() : null) ||
      (rawUser.student_id && !isValidUuid(rawUser.student_id) ? String(rawUser.student_id).trim() : null) ||
      undefined;

    let facultyIdentifier =
      (rawUser.faculty_identifier && !isValidUuid(rawUser.faculty_identifier) ? String(rawUser.faculty_identifier).trim() : null) ||
      (rawUser.facultyIdentifier && !isValidUuid(rawUser.facultyIdentifier) ? String(rawUser.facultyIdentifier).trim() : null) ||
      undefined;

    // Fall back to persistent storage mapping by email or ID
    if (!studentIdentifier || !facultyIdentifier) {
      const stored = getStoredUserIdentifier(userEmail, userId);
      if (stored?.studentIdentifier && !studentIdentifier && !isValidUuid(stored.studentIdentifier)) {
        studentIdentifier = stored.studentIdentifier.trim();
      }
      if (stored?.facultyIdentifier && !facultyIdentifier && !isValidUuid(stored.facultyIdentifier)) {
        facultyIdentifier = stored.facultyIdentifier.trim();
      }
    }

    // Persist identifier mapping
    if (userEmail && (studentIdentifier || facultyIdentifier)) {
      saveUserIdentifier({
        email: userEmail,
        id: userId,
        studentIdentifier,
        facultyIdentifier,
        role: rawUser.role,
      });
    }

    const formattedUser: BaseUser = {
      id: rawUser.id || 'usr-default',
      email: userEmail,
      firstName: rawUser.first_name || rawUser.firstName || 'User',
      lastName: rawUser.last_name || rawUser.lastName || '',
      role: (rawUser.role ? rawUser.role.toLowerCase() : 'student') as any,
      avatarUrl: rawUser.avatar_url || rawUser.avatarUrl,
      studentIdentifier,
      facultyIdentifier,
      createdAt: rawUser.created_at || rawUser.createdAt || new Date().toISOString(),
      updatedAt: rawUser.updated_at || rawUser.updatedAt || new Date().toISOString(),
    };

    const accessToken = data.access || data.access_token || data.accessToken || data.tokens?.accessToken || '';
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
   *
   * Uses a raw axios call (bypasses the apiClient interceptors to avoid loops)
   * and includes the Django CSRF token from the browser cookie in the
   * X-CSRFToken header, which is required by enforce_csrf() on the backend.
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
      .get<any>(API_ENDPOINTS.AUTH.ME)
      .then((r) => {
        const rawUser = r.data || {};
        const userEmail = rawUser.email;
        const userId = rawUser.id;

        let studentIdentifier =
          (rawUser.student_identifier && !isValidUuid(rawUser.student_identifier) ? String(rawUser.student_identifier).trim() : null) ||
          (rawUser.studentIdentifier && !isValidUuid(rawUser.studentIdentifier) ? String(rawUser.studentIdentifier).trim() : null) ||
          (rawUser.student_id && !isValidUuid(rawUser.student_id) ? String(rawUser.student_id).trim() : null) ||
          undefined;

        let facultyIdentifier =
          (rawUser.faculty_identifier && !isValidUuid(rawUser.faculty_identifier) ? String(rawUser.faculty_identifier).trim() : null) ||
          (rawUser.facultyIdentifier && !isValidUuid(rawUser.facultyIdentifier) ? String(rawUser.facultyIdentifier).trim() : null) ||
          undefined;

        if (!studentIdentifier || !facultyIdentifier) {
          const stored = getStoredUserIdentifier(userEmail, userId);
          if (stored?.studentIdentifier && !studentIdentifier && !isValidUuid(stored.studentIdentifier)) {
            studentIdentifier = stored.studentIdentifier.trim();
          }
          if (stored?.facultyIdentifier && !facultyIdentifier && !isValidUuid(stored.facultyIdentifier)) {
            facultyIdentifier = stored.facultyIdentifier.trim();
          }
        }

        if (userEmail && (studentIdentifier || facultyIdentifier)) {
          saveUserIdentifier({
            email: userEmail,
            id: userId,
            studentIdentifier,
            facultyIdentifier,
            role: rawUser.role,
          });
        }

        const user: BaseUser = {
          id: rawUser.id || 'usr-default',
          email: userEmail || '',
          firstName: rawUser.first_name || rawUser.firstName || 'User',
          lastName: rawUser.last_name || rawUser.lastName || '',
          role: (rawUser.role ? rawUser.role.toLowerCase() : 'student') as any,
          avatarUrl: rawUser.avatar_url || rawUser.avatarUrl,
          studentIdentifier,
          facultyIdentifier,
          createdAt: rawUser.created_at || rawUser.createdAt || new Date().toISOString(),
          updatedAt: rawUser.updated_at || rawUser.updatedAt || new Date().toISOString(),
        };
        
        return { user };
      }),
};

