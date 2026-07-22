import type { BaseUser } from '@/types';

// ─── Mock User Record ─────────────────────────────────────────────────────────
// Extends BaseUser with a plaintext password field for mock-only use.
// WARNING: In production, passwords are NEVER stored on the client.

export interface MockUserRecord extends BaseUser {
  /** Plaintext password — exists in mock layer only. Never leave the mock module. */
  readonly _password: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const MOCK_USERS: MockUserRecord[] = [
  {
    id:        'usr_admin_001',
    email:     'admin@example.com',
    _password: 'Admin123!',
    firstName: 'Sarah',
    lastName:  'Mitchell',
    role:      'admin',
    avatarUrl: undefined,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  },
  {
    id:        'usr_lecturer_001',
    email:     'lecturer@example.com',
    _password: 'Lecturer123!',
    firstName: 'Dr. James',
    lastName:  'Anderson',
    role:      'lecturer',
    avatarUrl: undefined,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  },
  {
    id:        'usr_student_001',
    email:     'student@example.com',
    _password: 'Student123!',
    firstName: 'Alex',
    lastName:  'Johnson',
    role:      'student',
    avatarUrl: undefined,
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  },
] as const;
