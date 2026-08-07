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
      .post<any>(API_ENDPOINTS.AUTH.REGISTER, data)
      .then((r) => {
        const backendResponse = r.data;
        
        if (backendResponse?.user) {
          const user: any = { ...backendResponse.user };
          if (user.first_name) { 
            user.firstName = user.first_name; 
            delete user.first_name; 
          }
          if (user.last_name) { 
            user.lastName = user.last_name; 
            delete user.last_name; 
          }
          if (user.role) {
            user.role = user.role.toLowerCase();
          }
          
          return {
            message: 'Registration successful',
            user,
          };
        }
        
        return { message: backendResponse.message || 'Registration successful' };
      }),

  /**
   * POST /api/v1/auth/login
   */
  login: (credentials: LoginCredentials): Promise<AuthLoginResponse> => {
    console.log('🚀 authApi.login called');
    console.log('📍 Endpoint:', API_ENDPOINTS.AUTH.LOGIN);
    console.log('📧 Email:', credentials.email);
    
    return apiClient
      .post<any>(API_ENDPOINTS.AUTH.LOGIN, credentials)
      .then(async (r) => {
        console.log('✅ Backend response received:', r.status);
        console.log('📦 Response data:', r.data);
        
        // Transform Django backend response to frontend format
        const backendResponse = r.data;
        
        // Transform user fields
        const user: any = { ...backendResponse.user };
        if (user.first_name) { 
          user.firstName = user.first_name; 
          delete user.first_name; 
        }
        if (user.last_name) { 
          user.lastName = user.last_name; 
          delete user.last_name; 
        }
        if (user.role) {
          user.role = user.role.toLowerCase();
        }
        
        // Transform tokens - backend returns 'access' but frontend expects 'accessToken'
        const tokens = {
          accessToken: backendResponse.access,
          refreshToken: undefined, // Refresh token is in HTTP-only cookie
          expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes (default JWT expiry)
        };

        return {
          user,
          tokens,
          message: 'Login successful',
        };
      })
      .catch((error) => {
        console.error('❌ Login API error:', error);
        console.error('Error details:', error.response?.data);
        throw error;
      });
  },

  /**
   * POST /api/v1/auth/logout
   */
  logout: (): Promise<void> =>
    apiClient
      .post<void>(API_ENDPOINTS.AUTH.LOGOUT, {})
      .then(() => {}),

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
      .post<any>(API_ENDPOINTS.AUTH.REFRESH, {})
      .then((r) => {
        // Backend returns { access: "token" }
        // Frontend expects { tokens: { accessToken: "token" } }
        return {
          tokens: {
            accessToken: r.data.access,
            refreshToken: undefined, // In HTTP-only cookie
            expiresAt: Date.now() + 15 * 60 * 1000,
          },
        };
      }),

  /**
   * GET /api/v1/auth/me
   */
  getMe: (): Promise<{ user: BaseUser }> =>
    apiClient
      .get<any>(API_ENDPOINTS.AUTH.ME)
      .then((r) => {
        // Transform user fields
        const user: any = { ...r.data };
        if (user.first_name) { 
          user.firstName = user.first_name; 
          delete user.first_name; 
        }
        if (user.last_name) { 
          user.lastName = user.last_name; 
          delete user.last_name; 
        }
        if (user.role) {
          user.role = user.role.toLowerCase();
        }
        
        return { user };
      }),
};
