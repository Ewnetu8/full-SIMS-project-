/**
 * Mock Authentication Service
 *
 * Simulates the Django REST Framework authentication API with realistic
 * network delays and error handling. All public functions match the
 * signature of the real `authApi` service in `../services/auth-api.ts`.
 *
 * To switch from mock → real backend:
 *   1. Set NEXT_PUBLIC_USE_MOCK_AUTH=false (or remove it)
 *   2. Update hooks to import from `../services` instead of `../mock`
 *
 * Security note: `_password` fields never leave this module — the returned
 * BaseUser objects are stripped of all sensitive fields before being returned.
 */

import { MOCK_USERS } from './mock-users';

import type {
  LoginCredentials,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AuthLoginResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  RefreshTokenResponse,
} from '../types';
import type { AuthTokens, BaseUser } from '@/types';

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/** Simulate network latency */
function sleep(ms = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates mock JWT-like tokens.
 * The payloads are base64-encoded JSON — NOT cryptographically signed.
 * This mimics the structure of real JWTs so the app can parse them if needed.
 */
function generateMockTokens(userId: string, expiresInSeconds = 3_600): AuthTokens {
  const now      = Date.now();
  const header   = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const sig      = btoa('mock-signature-not-secure');

  const accessPayload  = btoa(JSON.stringify({
    sub:  userId,
    iat:  Math.floor(now / 1000),
    exp:  Math.floor(now / 1000) + expiresInSeconds,
    type: 'access',
  }));
  const refreshPayload = btoa(JSON.stringify({
    sub:  userId,
    iat:  Math.floor(now / 1000),
    exp:  Math.floor(now / 1000) + expiresInSeconds * 24,
    type: 'refresh',
  }));

  return {
    accessToken:  `${header}.${accessPayload}.${sig}`,
    refreshToken: `${header}.${refreshPayload}.${sig}`,
    expiresAt:    now + expiresInSeconds * 1_000,
  };
}

/** Strip the _password field to produce a safe BaseUser */
function toSafeUser(record: (typeof MOCK_USERS)[number]): BaseUser {
  return {
    id:        record.id,
    email:     record.email,
    firstName: record.firstName,
    lastName:  record.lastName,
    role:      record.role,
    avatarUrl: record.avatarUrl,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function persistMockSession(user: BaseUser, tokens: AuthTokens, rememberMe: boolean) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(
    'examsphere_mock_session',
    JSON.stringify({ user, tokens, rememberMe }),
  );
}

function clearPersistedMockSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('examsphere_mock_session');
}

// ─── Mock Auth Service ────────────────────────────────────────────────────────

export const mockAuthService = {
  /**
   * Authenticate a user with email + password.
   * Sets an httpOnly session cookie via the Next.js API route.
   */
  async login(credentials: LoginCredentials): Promise<AuthLoginResponse> {
    await sleep(900);

    const record = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === credentials.email.toLowerCase(),
    );

    if (!record || record._password !== credentials.password) {
      throw new Error(
        'Invalid email or password. Please check your credentials and try again.',
      );
    }

    const expiresIn = credentials.rememberMe ? 30 * 24 * 3_600 : 24 * 3_600;
    const tokens    = generateMockTokens(record.id, expiresIn);
    const user      = toSafeUser(record);

    persistMockSession(user, tokens, credentials.rememberMe);

    // Set httpOnly session cookie via Next.js API Route.
    // This is what the Edge Middleware reads for route protection.
    await fetch('/api/auth/session', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        userId:     user.id,
        role:       user.role,
        exp:        tokens.expiresAt,
        rememberMe: credentials.rememberMe,
      }),
    });

    return { user, tokens, message: `Welcome back, ${user.firstName}!` };
  },

  /**
   * Sign the user out and clear the session cookie.
   */
  async logout(): Promise<void> {
    await sleep(200);
    clearPersistedMockSession();
    await fetch('/api/auth/session', { method: 'DELETE' });
  },

  /**
   * Send a password-reset email.
   * Always returns success to prevent email enumeration attacks.
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
    await sleep(1_000);
    // Intentionally do not reveal whether the email exists
    void MOCK_USERS.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
    return {
      message:
        "If an account with that email exists, we've sent a password reset link. " +
        'Check your inbox and spam folder.',
    };
  },

  /**
   * Reset the user's password using the token from the email link.
   * Mock: always succeeds after validation.
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
    await sleep(900);
    // In production: validate token signature and expiry on the server
    if (!payload.token) {
      throw new Error('Reset token is missing or invalid. Please request a new link.');
    }
    return {
      message:
        'Your password has been reset successfully. ' +
        'Please sign in with your new password.',
    };
  },

  /**
   * Obtain a new access token using the refresh token.
   * Mock: decodes the userId from the refresh token payload and issues new tokens.
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    await sleep(300);
    try {
      const parts   = refreshToken.split('.');
      const payload = JSON.parse(atob(parts[1] ?? '')) as { sub: string; type: string };
      if (payload.type !== 'refresh') throw new Error('Not a refresh token');
      const tokens = generateMockTokens(payload.sub);
      return { tokens };
    } catch {
      throw new Error('Session expired. Please sign in again.');
    }
  },

  /**
   * Return the current mock user from the browser storage if present.
   */
  async getCurrentUser(): Promise<BaseUser> {
    await sleep(200);
    if (typeof window === 'undefined') {
      throw new Error('No active session.');
    }

    const raw = window.localStorage.getItem('examsphere_mock_session');
    if (!raw) {
      throw new Error('No active session.');
    }

    const parsed = JSON.parse(raw) as { user: BaseUser };
    return parsed.user;
  },
};
