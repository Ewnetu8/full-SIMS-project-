// ─── Examinations API Service ─────────────────────────────────────────────────

import { api } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants';
import type {
  Examination,
  CreateExaminationRequest,
  UpdateExaminationRequest,
  ScheduleExaminationRequest,
  ListExaminationsParams,
} from '@/types/lecturer';

// ─── Examinations ─────────────────────────────────────────────────────────────

/**
 * List all examinations accessible to the authenticated lecturer.
 * Lecturers only see their own examinations (filtered by backend).
 *
 * @param params - Optional query parameters (status, course_offering)
 * @returns Promise resolving to an array of examinations
 *
 * @example
 * // Get all examinations
 * const exams = await listExaminations();
 *
 * @example
 * // Get examinations for a specific course offering
 * const exams = await listExaminations({ course_offering: 'uuid' });
 *
 * @example
 * // Get all DRAFT examinations
 * const drafts = await listExaminations({ status: 'DRAFT' });
 */
export async function listExaminations(
  params?: ListExaminationsParams,
): Promise<Examination[]> {
  return api.get<Examination[]>(API_ENDPOINTS.EXAMS.ROOT, { params });
}

/**
 * Get a single examination by ID.
 *
 * @param id - Examination UUID
 * @returns Promise resolving to the examination object with full details
 *
 * @example
 * const exam = await getExamination('exam-uuid');
 * console.log(exam.questions); // Array of questions
 * console.log(exam.status); // Current status
 */
export async function getExamination(id: string): Promise<Examination> {
  return api.get<Examination>(API_ENDPOINTS.EXAMS.BY_ID(id));
}

/**
 * Create a new examination.
 * The authenticated lecturer is automatically set as the examination owner.
 * New examinations are always created in DRAFT status.
 *
 * @param data - Examination creation payload
 * @returns Promise resolving to the created examination
 *
 * @example
 * const newExam = await createExamination({
 *   course_offering: 'course-offering-uuid',
 *   title: 'Midterm Exam',
 *   start_window: '2024-02-15T09:00:00Z',
 *   end_window: '2024-02-15T11:00:00Z',
 *   duration_minutes: 90,
 * });
 */
export async function createExamination(
  data: CreateExaminationRequest,
): Promise<Examination> {
  return api.post<Examination>(API_ENDPOINTS.EXAMS.ROOT, data);
}

/**
 * Update an existing examination (full replacement).
 * Status changes must follow the strict lifecycle:
 * DRAFT → SCHEDULED → ACTIVE → CLOSED → PUBLISHED
 * (no skipping, no rollback)
 *
 * @param id - Examination UUID
 * @param data - Complete examination data
 * @returns Promise resolving to the updated examination
 *
 * @example
 * const updatedExam = await updateExamination('exam-uuid', {
 *   course_offering: 'course-offering-uuid',
 *   title: 'Midterm Exam (Updated)',
 *   start_window: '2024-02-15T10:00:00Z',
 *   end_window: '2024-02-15T12:00:00Z',
 *   duration_minutes: 120,
 * });
 */
export async function updateExamination(
  id: string,
  data: CreateExaminationRequest,
): Promise<Examination> {
  return api.put<Examination>(API_ENDPOINTS.EXAMS.BY_ID(id), data);
}

/**
 * Partially update an existing examination.
 * Status changes must follow the strict lifecycle.
 * Question list edits are locked once status leaves DRAFT/SCHEDULED.
 *
 * @param id - Examination UUID
 * @param data - Partial examination data to update
 * @returns Promise resolving to the updated examination
 *
 * @example
 * // Update only the title
 * const updatedExam = await patchExamination('exam-uuid', {
 *   title: 'Final Exam',
 * });
 *
 * @example
 * // Move to SCHEDULED status
 * const scheduledExam = await patchExamination('exam-uuid', {
 *   status: 'SCHEDULED',
 * });
 */
export async function patchExamination(
  id: string,
  data: UpdateExaminationRequest,
): Promise<Examination> {
  return api.patch<Examination>(API_ENDPOINTS.EXAMS.BY_ID(id), data);
}

/**
 * Delete an examination.
 * Only DRAFT examinations can be deleted.
 * Returns 409 Conflict if exam attempts exist.
 *
 * @param id - Examination UUID
 * @returns Promise resolving when deletion is complete
 *
 * @throws {ApiError} 409 if attempts exist
 * @throws {ApiError} 400 if examination is not in DRAFT status
 *
 * @example
 * try {
 *   await deleteExamination('exam-uuid');
 *   console.log('Examination deleted');
 * } catch (error) {
 *   if (error.statusCode === 409) {
 *     console.error('Cannot delete: attempts exist');
 *   }
 * }
 */
export async function deleteExamination(id: string): Promise<void> {
  return api.delete<void>(API_ENDPOINTS.EXAMS.BY_ID(id));
}

/**
 * Schedule an examination.
 * Validates the time window against the server clock and moves
 * the examination from DRAFT → SCHEDULED.
 *
 * Rules:
 * - start_window must be in the future (server clock)
 * - end_window must be after start_window
 * - duration_minutes must be positive
 * - Exam must currently be in DRAFT status
 *
 * @param id - Examination UUID
 * @param data - Scheduling payload (time window and duration)
 * @returns Promise resolving to the updated examination
 *
 * @throws {ApiError} 400 if validation fails or exam is not in DRAFT status
 *
 * @example
 * const scheduledExam = await scheduleExamination('exam-uuid', {
 *   start_window: '2024-02-15T09:00:00Z',
 *   end_window: '2024-02-15T11:00:00Z',
 *   duration_minutes: 90,
 * });
 * console.log(scheduledExam.status); // 'SCHEDULED'
 */
export async function scheduleExamination(
  id: string,
  data: ScheduleExaminationRequest,
): Promise<Examination> {
  return api.post<Examination>(API_ENDPOINTS.EXAMS.SCHEDULE(id), data);
}

// ─── Examination Status Management ────────────────────────────────────────────

/**
 * Helper function to validate status transitions.
 * Returns true if the transition is allowed, false otherwise.
 *
 * @param currentStatus - Current examination status
 * @param newStatus - Desired new status
 * @returns Boolean indicating if the transition is valid
 *
 * @example
 * const canTransition = isValidStatusTransition('DRAFT', 'SCHEDULED'); // true
 * const cannotTransition = isValidStatusTransition('DRAFT', 'ACTIVE'); // false (skipping SCHEDULED)
 */
export function isValidStatusTransition(
  currentStatus: Examination['status'],
  newStatus: Examination['status'],
): boolean {
  if (currentStatus === newStatus) return true;

  const transitions: Record<Examination['status'], Examination['status'][]> = {
    DRAFT: ['SCHEDULED'],
    SCHEDULED: ['ACTIVE'],
    ACTIVE: ['CLOSED'],
    CLOSED: ['PUBLISHED'],
    PUBLISHED: [],
  };

  return transitions[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Helper function to get the next allowed status(es) for an examination.
 *
 * @param currentStatus - Current examination status
 * @returns Array of allowed next statuses
 *
 * @example
 * const nextStatuses = getNextAllowedStatuses('DRAFT'); // ['SCHEDULED']
 * const nextStatuses = getNextAllowedStatuses('PUBLISHED'); // []
 */
export function getNextAllowedStatuses(
  currentStatus: Examination['status'],
): Examination['status'][] {
  const transitions: Record<Examination['status'], Examination['status'][]> = {
    DRAFT: ['SCHEDULED'],
    SCHEDULED: ['ACTIVE'],
    ACTIVE: ['CLOSED'],
    CLOSED: ['PUBLISHED'],
    PUBLISHED: [],
  };

  return transitions[currentStatus] ?? [];
}

/**
 * Helper function to check if an examination's questions are editable.
 * Questions can only be edited when the exam is in DRAFT or SCHEDULED status.
 *
 * @param status - Current examination status
 * @returns Boolean indicating if questions are editable
 *
 * @example
 * const canEdit = canEditQuestions('DRAFT'); // true
 * const cannotEdit = canEditQuestions('ACTIVE'); // false
 */
export function canEditQuestions(status: Examination['status']): boolean {
  return status === 'DRAFT' || status === 'SCHEDULED';
}
