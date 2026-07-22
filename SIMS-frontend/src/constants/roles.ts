import type { UserRole } from '@/types';

// ─── User Role Constants ──────────────────────────────────────────────────────

export const USER_ROLES: Record<Uppercase<UserRole>, UserRole> = {
  ADMIN: 'admin',
  LECTURER: 'lecturer',
  STUDENT: 'student',
} as const;

/** Human-readable labels for each role, used in UI. */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  lecturer: 'Lecturer',
  student: 'Student',
};

/** Ordered list of all roles for iteration (e.g. role selects). */
export const ALL_ROLES: UserRole[] = ['admin', 'lecturer', 'student'];
