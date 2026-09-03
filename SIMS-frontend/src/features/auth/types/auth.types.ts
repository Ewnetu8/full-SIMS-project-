import type { BaseUser, AuthTokens, AuthSession, UserRole } from '@/types';

// ─── Auth Request Payloads ────────────────────────────────────────────────────

export interface LoginCredentials {
  email:      string;
  password:   string;
  rememberMe: boolean;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  /** The token from the reset-password URL query parameter. */
  token:           string;
  password:        string;
  confirmPassword: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

// ─── Auth Response Types ──────────────────────────────────────────────────────

export interface AuthLoginResponse {
  user:    BaseUser;
  tokens:  AuthTokens;
  message: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface RefreshTokenResponse {
  tokens: AuthTokens;
}

// ─── MFA API Types (SIMS API Specification) ──────────────────────────────────

export interface MfaSetupResponse {
  otpauth_uri: string;
  secret:      string;
}

export interface MfaVerifyPayload {
  totp_code: string;
}

export interface MfaVerifyResponse {
  detail:       string;
  backup_codes: string[];
}

export interface MfaLoginPayload {
  mfa_token: string;
  totp_code: string;
}

export interface MfaDisablePayload {
  password:  string;
  totp_code: string;
}

export interface MfaDisableResponse {
  detail: string;
}

/**
 * Result returned by the authApi.login method:
 * - If MFA is not required: returns normal session { user, tokens, message }
 * - If MFA is required: returns { mfaRequired: true, mfaToken: string }
 */
export type AuthLoginResult =
  | { mfaRequired: false; session: AuthLoginResponse }
  | { mfaRequired: true; mfaToken: string; email: string };

// ─── Auth Store Types ─────────────────────────────────────────────────────────

export interface AuthState {
  user:            BaseUser | null;
  tokens:          AuthTokens | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  rememberMe:      boolean;
  error:           string | null;
  /**
   * Authoritative MFA status for the currently authenticated user:
   * null = unknown / loading, true = MFA enabled, false = MFA disabled
   */
  mfaEnabled:      boolean | null;
  isMfaLoading:    boolean;
  // Ephemeral MFA state for login step 2 (never persisted in storage)
  mfaToken:        string | null;
  mfaEmail:        string | null;
  mfaRememberMe:   boolean;
}

export interface AuthActions {
  /** Set only the user object (e.g., after a profile update). */
  setUser:         (user: BaseUser) => void;
  /** Replace the token pair (e.g., after a token refresh). */
  setTokens:       (tokens: AuthTokens) => void;
  setRememberMe:   (remember: boolean) => void;
  setLoading:      (loading: boolean) => void;
  setError:        (error: string | null) => void;
  /** Explicitly updates the authoritative MFA status in store and user object. */
  setMfaEnabled:   (enabled: boolean | null) => void;
  /** Fetches the authoritative MFA status from backend. */
  fetchMfaStatus:  () => Promise<boolean | null>;
  /** Sets pending MFA login state before redirecting to /auth/mfa */
  setMfaPending:   (mfaToken: string, email?: string, rememberMe?: boolean) => void;
  /** Clears pending MFA login state */
  clearMfaPending: () => void;
  /** Full login — stores user + tokens and marks as authenticated. */
  login:           (session: AuthSession, rememberMe: boolean) => void;
  /** Full logout — calls the session API and clears the store. */
  logout:          () => Promise<void>;
  /** Clear local state only (e.g., on 401). */
  clearSession:    () => void;
  /** Update tokens after a refresh without changing the user. */
  refreshSession:  (tokens: AuthTokens) => void;
  /** Restore session from HttpOnly refresh cookie during app startup. */
  initializeAuth:  () => Promise<void>;
  /** Apply profile updates from the backend or profile form. */
  updateProfile:   (user: BaseUser) => void;
}

// ─── Password Strength ────────────────────────────────────────────────────────

export type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  level:  PasswordStrengthLevel;
  score:  number;          // 0–4
  label:  string;
  color:  string;          // Tailwind bg-* class
  width:  string;          // Tailwind w-* class for the bar
}

// Re-export base types so feature code can import from one place
export type { BaseUser, AuthTokens, AuthSession, UserRole };

