// ─── Questions API Service ────────────────────────────────────────────────────

import { api } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants';
import type {
  Question,
  QuestionWithWarnings,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  QuestionOption,
  CreateQuestionOptionRequest,
  RubricCriterion,
  CreateRubricCriterionRequest,
  Tag,
  CreateTagRequest,
  ListQuestionsParams,
  ListQuestionOptionsParams,
  ListRubricCriteriaParams,
} from '@/types/lecturer';

// ─── Questions ────────────────────────────────────────────────────────────────

/**
 * List all questions accessible to the authenticated lecturer.
 * Lecturers only see their own questions (filtered by backend).
 *
 * @param params - Optional query parameters (examination, question_type, creator)
 * @returns Promise resolving to an array of questions
 */
export async function listQuestions(params?: ListQuestionsParams): Promise<Question[]> {
  return api.get<Question[]>(API_ENDPOINTS.QUESTIONS.ROOT, { params });
}

/**
 * Get a single question by ID.
 *
 * @param id - Question UUID
 * @returns Promise resolving to the question object
 */
export async function getQuestion(id: string): Promise<Question> {
  return api.get<Question>(API_ENDPOINTS.QUESTIONS.BY_ID(id));
}

/**
 * Create a new question.
 * The authenticated lecturer is automatically set as the creator.
 *
 * @param data - Question creation payload
 * @returns Promise resolving to the created question (may include warnings)
 */
export async function createQuestion(
  data: CreateQuestionRequest,
): Promise<QuestionWithWarnings> {
  return api.post<QuestionWithWarnings>(API_ENDPOINTS.QUESTIONS.ROOT, data);
}

/**
 * Update an existing question (full replacement).
 *
 * @param id - Question UUID
 * @param data - Complete question data
 * @returns Promise resolving to the updated question (may include warnings)
 */
export async function updateQuestion(
  id: string,
  data: CreateQuestionRequest,
): Promise<QuestionWithWarnings> {
  return api.put<QuestionWithWarnings>(API_ENDPOINTS.QUESTIONS.BY_ID(id), data);
}

/**
 * Partially update an existing question.
 *
 * @param id - Question UUID
 * @param data - Partial question data to update
 * @returns Promise resolving to the updated question (may include warnings)
 */
export async function patchQuestion(
  id: string,
  data: UpdateQuestionRequest,
): Promise<QuestionWithWarnings> {
  return api.patch<QuestionWithWarnings>(API_ENDPOINTS.QUESTIONS.BY_ID(id), data);
}

/**
 * Delete (soft-delete) a question.
 * Questions are soft-deleted (is_active=False) to preserve referential integrity.
 *
 * @param id - Question UUID
 * @returns Promise resolving to deletion confirmation
 */
export async function deleteQuestion(
  id: string,
): Promise<{ detail: string; is_active: boolean }> {
  return api.delete<{ detail: string; is_active: boolean }>(
    API_ENDPOINTS.QUESTIONS.BY_ID(id),
  );
}

// ─── Question Options ─────────────────────────────────────────────────────────

/**
 * List question options.
 * Typically filtered by question ID.
 *
 * @param params - Optional query parameters (question)
 * @returns Promise resolving to an array of question options
 */
export async function listQuestionOptions(
  params?: ListQuestionOptionsParams,
): Promise<QuestionOption[]> {
  return api.get<QuestionOption[]>(API_ENDPOINTS.QUESTIONS.OPTIONS, { params });
}

/**
 * Get a single question option by ID.
 *
 * @param id - Option UUID
 * @returns Promise resolving to the option object
 */
export async function getQuestionOption(id: string): Promise<QuestionOption> {
  return api.get<QuestionOption>(API_ENDPOINTS.QUESTIONS.OPTION_BY_ID(id));
}

/**
 * Create a new question option (for MCQ questions).
 *
 * @param data - Option creation payload
 * @returns Promise resolving to the created option
 */
export async function createQuestionOption(
  data: CreateQuestionOptionRequest,
): Promise<QuestionOption> {
  return api.post<QuestionOption>(API_ENDPOINTS.QUESTIONS.OPTIONS, data);
}

/**
 * Update an existing question option (full replacement).
 *
 * @param id - Option UUID
 * @param data - Complete option data
 * @returns Promise resolving to the updated option
 */
export async function updateQuestionOption(
  id: string,
  data: CreateQuestionOptionRequest,
): Promise<QuestionOption> {
  return api.put<QuestionOption>(API_ENDPOINTS.QUESTIONS.OPTION_BY_ID(id), data);
}

/**
 * Partially update an existing question option.
 *
 * @param id - Option UUID
 * @param data - Partial option data to update
 * @returns Promise resolving to the updated option
 */
export async function patchQuestionOption(
  id: string,
  data: Partial<CreateQuestionOptionRequest>,
): Promise<QuestionOption> {
  return api.patch<QuestionOption>(API_ENDPOINTS.QUESTIONS.OPTION_BY_ID(id), data);
}

/**
 * Delete a question option.
 *
 * @param id - Option UUID
 * @returns Promise resolving when deletion is complete
 */
export async function deleteQuestionOption(id: string): Promise<void> {
  return api.delete<void>(API_ENDPOINTS.QUESTIONS.OPTION_BY_ID(id));
}

// ─── Rubric Criteria ──────────────────────────────────────────────────────────

/**
 * List rubric criteria.
 * Typically filtered by question ID.
 *
 * @param params - Optional query parameters (question)
 * @returns Promise resolving to an array of rubric criteria
 */
export async function listRubricCriteria(
  params?: ListRubricCriteriaParams,
): Promise<RubricCriterion[]> {
  return api.get<RubricCriterion[]>(API_ENDPOINTS.QUESTIONS.RUBRIC_CRITERIA, { params });
}

/**
 * Get a single rubric criterion by ID.
 *
 * @param id - Criterion UUID
 * @returns Promise resolving to the criterion object
 */
export async function getRubricCriterion(id: string): Promise<RubricCriterion> {
  return api.get<RubricCriterion>(API_ENDPOINTS.QUESTIONS.RUBRIC_CRITERION_BY_ID(id));
}

/**
 * Create a new rubric criterion (for text/essay questions).
 * The sum of all criteria point weights must equal the question's total_points.
 *
 * @param data - Criterion creation payload
 * @returns Promise resolving to the created criterion
 */
export async function createRubricCriterion(
  data: CreateRubricCriterionRequest,
): Promise<RubricCriterion> {
  return api.post<RubricCriterion>(API_ENDPOINTS.QUESTIONS.RUBRIC_CRITERIA, data);
}

/**
 * Update an existing rubric criterion (full replacement).
 *
 * @param id - Criterion UUID
 * @param data - Complete criterion data
 * @returns Promise resolving to the updated criterion
 */
export async function updateRubricCriterion(
  id: string,
  data: CreateRubricCriterionRequest,
): Promise<RubricCriterion> {
  return api.put<RubricCriterion>(API_ENDPOINTS.QUESTIONS.RUBRIC_CRITERION_BY_ID(id), data);
}

/**
 * Partially update an existing rubric criterion.
 *
 * @param id - Criterion UUID
 * @param data - Partial criterion data to update
 * @returns Promise resolving to the updated criterion
 */
export async function patchRubricCriterion(
  id: string,
  data: Partial<CreateRubricCriterionRequest>,
): Promise<RubricCriterion> {
  return api.patch<RubricCriterion>(
    API_ENDPOINTS.QUESTIONS.RUBRIC_CRITERION_BY_ID(id),
    data,
  );
}

/**
 * Delete a rubric criterion.
 *
 * @param id - Criterion UUID
 * @returns Promise resolving when deletion is complete
 */
export async function deleteRubricCriterion(id: string): Promise<void> {
  return api.delete<void>(API_ENDPOINTS.QUESTIONS.RUBRIC_CRITERION_BY_ID(id));
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

/**
 * List all tags.
 *
 * @returns Promise resolving to an array of tags
 */
export async function listTags(): Promise<Tag[]> {
  return api.get<Tag[]>(API_ENDPOINTS.TAGS.ROOT);
}

/**
 * Get a single tag by ID.
 *
 * @param id - Tag UUID
 * @returns Promise resolving to the tag object
 */
export async function getTag(id: string): Promise<Tag> {
  return api.get<Tag>(API_ENDPOINTS.TAGS.BY_ID(id));
}

/**
 * Create a new tag.
 *
 * @param data - Tag creation payload
 * @returns Promise resolving to the created tag
 */
export async function createTag(data: CreateTagRequest): Promise<Tag> {
  return api.post<Tag>(API_ENDPOINTS.TAGS.ROOT, data);
}

/**
 * Update an existing tag (full replacement).
 *
 * @param id - Tag UUID
 * @param data - Complete tag data
 * @returns Promise resolving to the updated tag
 */
export async function updateTag(id: string, data: CreateTagRequest): Promise<Tag> {
  return api.put<Tag>(API_ENDPOINTS.TAGS.BY_ID(id), data);
}

/**
 * Partially update an existing tag.
 *
 * @param id - Tag UUID
 * @param data - Partial tag data to update
 * @returns Promise resolving to the updated tag
 */
export async function patchTag(id: string, data: Partial<CreateTagRequest>): Promise<Tag> {
  return api.patch<Tag>(API_ENDPOINTS.TAGS.BY_ID(id), data);
}

/**
 * Delete a tag.
 *
 * @param id - Tag UUID
 * @returns Promise resolving when deletion is complete
 */
export async function deleteTag(id: string): Promise<void> {
  return api.delete<void>(API_ENDPOINTS.TAGS.BY_ID(id));
}
