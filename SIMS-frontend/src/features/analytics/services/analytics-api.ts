// ─── Analytics API Service ──────────────────────────────────────────────────

import { api } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type { AdvisingReportResponse, ExamAnalyticsResponse } from '@/types/api';

/**
 * Fetch advising report for a semester.
 * Returns students whose enrolled credit hours are below their class standing's minimum requirement.
 * 
 * @param semesterId - Semester UUID
 */
export async function getAdvisingReport(semesterId: string): Promise<AdvisingReportResponse> {
  return api.get<AdvisingReportResponse>(API_ENDPOINTS.ANALYTICS.ADVISING, {
    params: { semester: semesterId },
  });
}

/**
 * Fetch exam analytics dashboard metrics for a specific examination.
 * Returns mean, median, stddev, min/max scores and per-question difficulty rates.
 * 
 * @param examId - Examination UUID
 */
export async function getExamAnalytics(examId: string): Promise<ExamAnalyticsResponse> {
  return api.get<ExamAnalyticsResponse>(API_ENDPOINTS.ANALYTICS.EXAM_ANALYTICS(examId));
}

export const analyticsApiService = {
  getAdvisingReport,
  getExamAnalytics,
};
