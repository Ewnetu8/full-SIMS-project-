import type { UserRole } from '@/types';

// ─── User Role Constants ──────────────────────────────────────────────────────

export const USER_ROLES: Record<Uppercase<UserRole>, UserRole> = {
  SYSTEM_ADMIN: 'system_admin',
  ADMIN: 'admin',
  LECTURER: 'lecturer',
  STUDENT: 'student',
} as const;

/** Human-readable labels for each role, used in UI. */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  system_admin: 'System Administrator',
  admin: 'Administrator',
  lecturer: 'Lecturer',
  student: 'Student',
};

/** Ordered list of all roles for iteration (e.g. role selects). */
export const ALL_ROLES: UserRole[] = ['system_admin', 'admin', 'lecturer', 'student'];
