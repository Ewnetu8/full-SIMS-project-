// ─── Results API Service (SIMS API 4) ─────────────────────────────────────────

import { api } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type { ExamResults, Result } from '@/types/api';

/**
 * Fetch authenticated student's official graded exam results.
 * Endpoint: GET /api/v1/results/me
 */
export async function getMyResults(): Promise<Result[]> {
  return api.get<Result[]>(API_ENDPOINTS.RESULTS.ME);
}

/**
 * Fetch per-student results for a specific examination (Lecturer / Admin).
 * Endpoint: GET /api/v1/results/exam/{id}
 * 
 * @param examId - Examination UUID
 */
export async function getExamResults(examId: string): Promise<ExamResults> {
  return api.get<ExamResults>(API_ENDPOINTS.RESULTS.EXAM(examId));
}

export const resultsApiService = {
  getMyResults,
  getExamResults,
};
