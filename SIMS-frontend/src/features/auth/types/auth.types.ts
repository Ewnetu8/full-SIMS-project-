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

// ─── Session Cookie Payload ───────────────────────────────────────────────────
// Stored in an httpOnly cookie so the Edge Middleware can inspect it.
// Keep this minimal — never include sensitive fields like tokens.

export interface SessionCookiePayload {
  userId:     string;
  role:       UserRole;
  exp:        number;   // Unix timestamp (ms)
  rememberMe: boolean;
}

// ─── Auth Store Types ─────────────────────────────────────────────────────────

export interface AuthState {
  user:            BaseUser | null;
  tokens:          AuthTokens | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  rememberMe:      boolean;
  error:           string | null;
}

export interface AuthActions {
  /** Set only the user object (e.g., after a profile update). */
  setUser:        (user: BaseUser) => void;
  /** Replace the token pair (e.g., after a token refresh). */
  setTokens:      (tokens: AuthTokens) => void;
  setRememberMe:  (remember: boolean) => void;
  setLoading:     (loading: boolean) => void;
  setError:       (error: string | null) => void;
  /** Full login — stores user + tokens and marks as authenticated. */
  login:          (session: AuthSession, rememberMe: boolean) => void;
  /** Full logout — calls the session API and clears the store. */
  logout:         () => Promise<void>;
  /** Clear local state only (e.g., on 401). */
  clearSession:   () => void;
  /** Update tokens after a refresh without changing the user. */
  refreshSession: (tokens: AuthTokens) => void;
  /** Restore session from HttpOnly refresh cookie during app startup. */
  initializeAuth: () => Promise<void>;
  /** Apply profile updates from the backend or profile form. */
  updateProfile:  (user: BaseUser) => void;
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
