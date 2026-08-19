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

const STORAGE_KEY = 'sims_user_identifiers';

/**
 * Retrieves all stored user identifier mappings from localStorage.
 */
export function getAllStoredUserIdentifiers(): Record<string, UserIdentifierRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Persists a user identifier record (e.g. entered by Admin during registration).
 */
export function saveUserIdentifier(record: UserIdentifierRecord): void {
  if (typeof window === 'undefined' || !record.email) return;
  try {
    const records = getAllStoredUserIdentifiers();
    const normalizedEmail = record.email.toLowerCase().trim();
    
    // Clean identifiers to ensure UUIDs are never stored as student/faculty identifiers
    const cleanStudentId = record.studentIdentifier && !isValidUuid(record.studentIdentifier)
      ? record.studentIdentifier.trim()
      : undefined;
      
    const cleanFacultyId = record.facultyIdentifier && !isValidUuid(record.facultyIdentifier)
      ? record.facultyIdentifier.trim()
      : undefined;

    const existing: Partial<UserIdentifierRecord> = records[normalizedEmail] || {};
    const updated: UserIdentifierRecord = {
      ...existing,
      ...record,
      email: normalizedEmail,
      studentIdentifier: cleanStudentId || existing.studentIdentifier,
      facultyIdentifier: cleanFacultyId || existing.facultyIdentifier,
    };

    records[normalizedEmail] = updated;
    if (record.id && isValidUuid(record.id)) {
      records[record.id] = updated;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('Failed to save user identifier in localStorage:', e);
  }
}

/**
 * Finds a stored user identifier record by email or user ID.
 */
export function getStoredUserIdentifier(email?: string | null, id?: string | null): UserIdentifierRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const records = getAllStoredUserIdentifiers();
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      if (records[normalizedEmail]) return records[normalizedEmail];
    }
    if (id && records[id]) {
      return records[id];
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Safely resolves the authentic Student Identifier for a student account.
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

  // 4. Check extra sources provided by callers (e.g. academic data)
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

  // 5. Check persistent identifier registry by email or ID
  const stored = getStoredUserIdentifier(user?.email, user?.id);
  if (stored?.studentIdentifier && !isValidUuid(stored.studentIdentifier)) {
    const trimmed = stored.studentIdentifier.trim();
    if (trimmed) return trimmed;
  }

  return null;
}
