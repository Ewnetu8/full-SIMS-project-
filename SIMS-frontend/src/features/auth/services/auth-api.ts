/**
 * Auth API Service — Real Backend Integration Layer
 *
 * These functions call the actual Django REST Framework endpoints.
 *
 * DRF Endpoint Conventions:
 *   POST /api/v1/auth/login        → { user, access } OR { mfa_required: true, mfa_token: string }
 *   POST /api/v1/auth/mfa/login    → { user, access } (MFA step 2)
 *   POST /api/v1/auth/mfa/setup    → { otpauth_uri, secret }
 *   POST /api/v1/auth/mfa/verify   → { detail, backup_codes }
 *   POST /api/v1/auth/mfa/disable  → { detail }
 *   POST /api/v1/auth/logout       → 200 OK / 204 No Content
 *   POST /api/v1/auth/refresh      → { access }
 *   POST /api/v1/auth/register     → { message, user }
 *   GET  /api/v1/auth/me           → { user }
 */

import axios from 'axios';
import { apiClient } from '@/services';
import { API_ENDPOINTS } from '@/constants';
import { env } from '@/lib/env';
import { isApiError } from '@/lib/errors';
import { getCsrfToken } from '@/utils/csrf';
import { isValidUuid } from '@/lib/user-identifier';
import { parseJwtExp } from '../utils';

import type {
  LoginCredentials,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AuthLoginResponse,
  AuthLoginResult,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  RefreshTokenResponse,
  MfaSetupResponse,
  MfaVerifyPayload,
  MfaVerifyResponse,
  MfaLoginPayload,
  MfaDisablePayload,
  MfaDisableResponse,
} from '../types';
import type { BaseUser, AuthTokens } from '@/types';

/**
 * Helper to normalize raw backend User payload into frontend BaseUser.
 */
function normalizeBackendUser(rawUser: any, fallbackEmail?: string): BaseUser {
  const userEmail = rawUser?.email || fallbackEmail || '';

  const studentIdentifier =
    (rawUser?.student_identifier && !isValidUuid(rawUser.student_identifier) ? String(rawUser.student_identifier).trim() : null) ||
    (rawUser?.studentIdentifier && !isValidUuid(rawUser.studentIdentifier) ? String(rawUser.studentIdentifier).trim() : null) ||
    (rawUser?.student_id && !isValidUuid(rawUser.student_id) ? String(rawUser.student_id).trim() : null) ||
    undefined;

  const facultyIdentifier =
    (rawUser?.faculty_identifier && !isValidUuid(rawUser.faculty_identifier) ? String(rawUser.faculty_identifier).trim() : null) ||
    (rawUser?.facultyIdentifier && !isValidUuid(rawUser.facultyIdentifier) ? String(rawUser.facultyIdentifier).trim() : null) ||
    undefined;

  const mfaEnabled =
    typeof rawUser?.mfa_enabled === 'boolean'
      ? rawUser.mfa_enabled
      : typeof rawUser?.mfaEnabled === 'boolean'
        ? rawUser.mfaEnabled
        : rawUser?.mfaEnabled ?? undefined;

  return {
    id: rawUser?.id || 'usr-default',
    email: userEmail,
    firstName: rawUser?.first_name || rawUser?.firstName || 'User',
    lastName: rawUser?.last_name || rawUser?.lastName || '',
    role: (rawUser?.role ? rawUser.role.toLowerCase() : 'student') as any,
    university: rawUser?.university ?? null,
    universityName: rawUser?.university_name ?? rawUser?.universityName ?? null,
    avatarUrl: rawUser?.avatar_url || rawUser?.avatarUrl,
    studentIdentifier,
    facultyIdentifier,
    mfaEnabled,
    createdAt: rawUser?.created_at || rawUser?.createdAt || new Date().toISOString(),
    updatedAt: rawUser?.updated_at || rawUser?.updatedAt || new Date().toISOString(),
  };
}

/**
 * Helper to extract and format tokens from backend response.
 */
function extractAuthTokens(data: any): AuthTokens {
  const accessToken = data.access || data.access_token || data.accessToken || data.tokens?.accessToken || '';
  const refreshToken = data.refresh || data.refresh_token || data.refreshToken || data.tokens?.refreshToken || undefined;
  const jwtExp = parseJwtExp(accessToken);
  const expiresAt = jwtExp || (Date.now() + 15 * 60 * 1000);

  return {
    accessToken,
    refreshToken,
    expiresAt,
  };
}

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
          const user = normalizeBackendUser(backendResponse.user, data.email);
          return {
            message: 'Registration successful',
            user,
          };
        }
        return { message: backendResponse.message || 'Registration successful' };
      }),

  /**
   * POST /api/v1/auth/login
   * Backend returns either:
   * 1. Normal user: { user: {...}, access: "jwt_string" } and sets HttpOnly refresh_token cookie.
   * 2. MFA enabled: { mfa_required: true, mfa_token: "string" }
   */
  login: async (credentials: LoginCredentials): Promise<AuthLoginResult> => {
    const response = await apiClient.post<any>(API_ENDPOINTS.AUTH.LOGIN, {
      email: credentials.email,
      password: credentials.password,
    });
    const data = response.data || {};

    // Check if backend returned MFA requirement
    if (data.mfa_required || data.mfa_token) {
      return {
        mfaRequired: true,
        mfaToken: data.mfa_token,
        email: credentials.email,
      };
    }

    const formattedUser = normalizeBackendUser(data.user, credentials.email);
    const formattedTokens = extractAuthTokens(data);

    return {
      mfaRequired: false,
      session: {
        user: formattedUser,
        tokens: formattedTokens,
        message: data.message || 'Login successful',
      },
    };
  },

  /**
   * POST /api/v1/auth/mfa/login
   * Completes login for MFA-enabled accounts using the intermediate mfa_token
   * and a 6-digit TOTP code OR 8-digit backup code.
   * Returns the real JWT access token and sets HttpOnly refresh_token cookie.
   */
  loginWithMfa: async (payload: MfaLoginPayload): Promise<AuthLoginResponse> => {
    const response = await apiClient.post<any>(API_ENDPOINTS.AUTH.MFA_LOGIN, {
      mfa_token: payload.mfa_token,
      totp_code: payload.totp_code.trim(),
    });
    const data = response.data || {};

    const formattedUser = normalizeBackendUser(data.user);
    formattedUser.mfaEnabled = true;
    const formattedTokens = extractAuthTokens(data);

    return {
      user: formattedUser,
      tokens: formattedTokens,
      message: data.detail || data.message || 'Verification successful',
    };
  },

  /**
   * POST /api/v1/auth/mfa/setup
   * Generates a new TOTP secret for the authenticated user and returns the otpauth URI and raw secret.
   */
  setupMfa: async (): Promise<MfaSetupResponse> => {
    const response = await apiClient.post<MfaSetupResponse>(API_ENDPOINTS.AUTH.MFA_SETUP, {});
    return response.data;
  },

  /**
   * POST /api/v1/auth/mfa/verify
   * Verifies the initial TOTP code and activates MFA on the user's account.
   * Returns 8 one-time backup codes.
   */
  verifyMfa: async (payload: MfaVerifyPayload): Promise<MfaVerifyResponse> => {
    const response = await apiClient.post<MfaVerifyResponse>(API_ENDPOINTS.AUTH.MFA_VERIFY, {
      totp_code: payload.totp_code.trim(),
    });
    return response.data;
  },

  /**
   * POST /api/v1/auth/mfa/disable
   * Disables MFA on the authenticated user's account requiring password and current TOTP code.
   */
  disableMfa: async (payload: MfaDisablePayload): Promise<MfaDisableResponse> => {
    const response = await apiClient.post<MfaDisableResponse>(API_ENDPOINTS.AUTH.MFA_DISABLE, {
      password: payload.password,
      totp_code: payload.totp_code.trim(),
    });
    return response.data;
  },

  /**
   * Authoritative check for whether MFA is currently enabled for the authenticated user.
   * Calls POST /api/v1/auth/mfa/setup:
   * - If backend responds with HTTP 400 and detail contains "already enabled", MFA is enabled (true).
   * - If backend responds with HTTP 200 OK (setup generated), MFA is currently disabled (false).
   * - If backend responds with an unexpected error, re-throws.
   */
  getMfaStatus: async (): Promise<boolean> => {
    try {
      await authApi.setupMfa();
      return false;
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.statusCode === 400 && (err.message || '').toLowerCase().includes('already enabled')) {
          return true;
        }
      }
      throw err;
    }
  },

  /**
   * POST /api/v1/auth/logout
   * Sends X-CSRFToken header and HttpOnly refresh_token cookie.
   * Backend invalidates the refresh token and clears the cookie.
   */
  logout: async (): Promise<void> => {
    try {
      const csrfToken = getCsrfToken();
      await apiClient.post<void>(
        API_ENDPOINTS.AUTH.LOGOUT,
        {},
        {
          headers: csrfToken ? { 'X-CSRFToken': csrfToken } : undefined,
        },
      );
    } catch (e) {
      console.warn('Backend logout request encountered an error (session cleared locally):', e);
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
   * The backend reads the refresh_token from the HttpOnly cookie and returns a new access token.
   * NO refresh token is passed in the request body.
   */
  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const csrfToken = getCsrfToken();
    const { useAuthStore } = await import('../store');
    const storedRefreshToken = useAuthStore.getState().tokens?.refreshToken;

    const requestBody = storedRefreshToken ? { refresh: storedRefreshToken } : {};

    const response = await axios.post<{
      access?: string;
      access_token?: string;
      accessToken?: string;
      refresh?: string;
      refresh_token?: string;
      refreshToken?: string;
    }>(
      `${env.NEXT_PUBLIC_API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
      requestBody,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
      },
    );

    const data = response.data || {};
    const accessToken = data.access || data.access_token || data.accessToken || '';
    const newRefreshToken = data.refresh || data.refresh_token || data.refreshToken || storedRefreshToken;
    const jwtExp = parseJwtExp(accessToken);
    const expiresAt = jwtExp || (Date.now() + 15 * 60 * 1000);

    return {
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresAt,
      },
    };
  },

  /**
   * GET /api/v1/auth/me
   */
  getMe: (): Promise<{ user: BaseUser }> =>
    apiClient
      .get<any>(API_ENDPOINTS.AUTH.ME)
      .then((r) => {
        const rawUser = r.data || {};
        const user = normalizeBackendUser(rawUser);
        return { user };
      }),
};
