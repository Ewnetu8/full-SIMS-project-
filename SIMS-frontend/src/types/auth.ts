                            0
                            
                            
                            
                            // ─── User Roles ────────────────────────────────────────────────────────────────

/**
 * The set of roles that a user may hold within the system.
 */
export type UserRole = 'admin' | 'lecturer' | 'student';

/**
 * Minimal user shape shared across the application.
 * Extended role-specific types live in their respective feature slices.
 */
export interface BaseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  studentIdentifier?: string;
  facultyIdentifier?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Authentication token pair returned after a successful login.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // Unix timestamp (ms)
}

/**
 * The shape of the authenticated session stored in the auth store.
 */
export interface AuthSession {
  user: BaseUser;
  tokens: AuthTokens;
}
