import type { BaseUser } from '@/types';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Checks if a string is a standard UUID.
 */
export function isValidUuid(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  return UUID_REGEX.test(val.trim());
}

export interface UserIdentifierRecord {
  email: string;
  id?: string;
  studentIdentifier?: string;
  facultyIdentifier?: string;
  role?: string;
}

/**
 * No-op helper preserved for interface compatibility.
 * Fake localStorage persistence removed per Single Source of Truth architecture.
 */
export function saveUserIdentifier(_record: UserIdentifierRecord): void {
  // Pure no-op: Local storage must never act as a database.
}

/**
 * No-op helper preserved for interface compatibility.
 * Fake localStorage persistence removed per Single Source of Truth architecture.
 */
export function getStoredUserIdentifier(_email?: string | null, _id?: string | null): UserIdentifierRecord | null {
  return null;
}

/**
 * Safely resolves the authentic Student Identifier for a student account from real backend user data.
 * Guarantees that internal database UUIDs are never returned as student identifiers.
 */
export function resolveStudentIdentifier(
  user?: BaseUser | null,
  extraSources?: (string | null | undefined)[]
): string | null {
  if (!user && (!extraSources || extraSources.length === 0)) {
    return null;
  }

  // 1. Direct property on BaseUser
  if (user?.studentIdentifier && !isValidUuid(user.studentIdentifier)) {
    const trimmed = user.studentIdentifier.trim();
    if (trimmed) return trimmed;
  }

  // 2. Snake_case field from backend user object
  const anyUser = user as any;
  if (anyUser?.student_identifier && !isValidUuid(anyUser.student_identifier)) {
    const trimmed = String(anyUser.student_identifier).trim();
    if (trimmed) return trimmed;
  }

  // 3. student_id if it is a real identifier and NOT a UUID
  if (anyUser?.student_id && !isValidUuid(anyUser.student_id)) {
    const trimmed = String(anyUser.student_id).trim();
    if (trimmed) return trimmed;
  }

  // 4. Check extra sources provided by callers (e.g. backend academic data / enrollments)
  if (extraSources) {
    for (const source of extraSources) {
      if (source && typeof source === 'string' && !isValidUuid(source)) {
        const trimmed = source.trim();
        if (trimmed && trimmed !== 'Not provided' && trimmed !== 'Not available') {
          return trimmed;
        }
      }
    }
  }

  return null;
}
