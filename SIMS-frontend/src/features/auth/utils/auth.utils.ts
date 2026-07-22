import { ROUTES } from '@/constants';

import type { PasswordStrengthResult } from '../types';
import type { UserRole } from '@/types';

// ─── Role-Based Navigation ────────────────────────────────────────────────────

/**
 * Returns the default home page path for a given user role.
 * Used after login to redirect users to their role-specific dashboard.
 */
export function getHomeByRole(role: UserRole): string {
  switch (role) {
    case 'admin':    return ROUTES.ADMIN.DASHBOARD;
    case 'lecturer': return ROUTES.LECTURER.DASHBOARD;
    case 'student':  return ROUTES.STUDENT.DASHBOARD;
    default:         return ROUTES.HOME;
  }
}

// ─── Route Classification ─────────────────────────────────────────────────────

/** Routes that can be accessed without authentication. */
export const PUBLIC_ROUTES = [
  '/',
  ROUTES.LOGIN,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
] as const;

/** Routes that redirect authenticated users away (e.g., login page). */
export const AUTH_ONLY_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
] as const;

/** Top-level path prefixes that require authentication. */
export const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/lecturer', '/student'] as const;

/** Path prefixes that are allowed per role. */
export const ROLE_ALLOWED_PREFIXES: Record<UserRole, string[]> = {
  admin:    ['/dashboard', '/admin'],
  lecturer: ['/dashboard', '/lecturer'],
  student:  ['/dashboard', '/student'],
};

export function isPublicRoute(pathname: string): boolean {
  return (PUBLIC_ROUTES as readonly string[]).includes(pathname);
}

export function isAuthOnlyRoute(pathname: string): boolean {
  return (AUTH_ONLY_ROUTES as readonly string[]).some((r) => pathname.startsWith(r));
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Returns true if the given role may access the given pathname.
 * `/dashboard` is always allowed for any authenticated user.
 */
export function hasRoleAccess(role: UserRole, pathname: string): boolean {
  const allowed = ROLE_ALLOWED_PREFIXES[role];
  return allowed.some((prefix) => pathname.startsWith(prefix));
}

// ─── Password Strength ────────────────────────────────────────────────────────

/**
 * Evaluates password strength based on multiple criteria.
 * Returns a score (0–4) and associated display metadata.
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { level: 'weak', score: 0, label: '', color: 'bg-muted', width: 'w-0' };
  }

  let score = 0;
  if (password.length >= 8)           score++;
  if (password.length >= 12)          score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[a-z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))  score++;

  // Map raw score (0–6) onto 4 levels
  const normalised = Math.min(4, Math.ceil(score / 1.5)) as 0 | 1 | 2 | 3 | 4;

  const results: PasswordStrengthResult[] = [
    { level: 'weak',   score: 0, label: 'Too weak',  color: 'bg-destructive', width: 'w-[10%]' },
    { level: 'weak',   score: 1, label: 'Weak',      color: 'bg-destructive', width: 'w-1/4' },
    { level: 'fair',   score: 2, label: 'Fair',      color: 'bg-warning',     width: 'w-2/4' },
    { level: 'good',   score: 3, label: 'Good',      color: 'bg-info',        width: 'w-3/4' },
    { level: 'strong', score: 4, label: 'Strong',    color: 'bg-success',     width: 'w-full' },
  ];

  return results[normalised] ?? results[0]!;
}

// ─── Token Utilities ──────────────────────────────────────────────────────────

/** Returns true if the token expiry timestamp (ms) is in the past. */
export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt;
}

/**
 * Returns how many milliseconds remain before the token expires.
 * Returns 0 if already expired.
 */
export function getTokenExpiryMs(expiresAt: number): number {
  return Math.max(0, expiresAt - Date.now());
}

// ─── Display Helpers ──────────────────────────────────────────────────────────

/** Returns a human-readable label for a user role. */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin:    'Administrator',
    lecturer: 'Lecturer',
    student:  'Student',
  };
  return labels[role];
}
