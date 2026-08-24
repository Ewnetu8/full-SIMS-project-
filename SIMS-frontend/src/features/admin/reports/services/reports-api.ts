import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { academicService } from '@/features/admin/services/academic-service';
import { api } from '@/services/api-client';

import type { AdvisingReportResponse, Semester } from '../types';

/**
 * Service for Institutional Advising Reports and Analytics.
 */
export const reportsApiService = {
  /**
   * Fetch advising report for students below the credit-hour minimum in a semester.
   * Endpoint: GET /api/v1/analytics/advising?semester={semesterId}
   * 
   * @param semesterId - Semester UUID
   */
  async getAdvisingReport(semesterId: string): Promise<AdvisingReportResponse> {
    return api.get<AdvisingReportResponse>(API_ENDPOINTS.ANALYTICS.ADVISING, {
      params: { semester: semesterId },
    });
  },

  /**
   * Fetch available academic semesters for reporting filters.
   */
  async getSemesters(): Promise<Semester[]> {
    return academicService.getSemesters();
  },
};

export const { getAdvisingReport, getSemesters } = reportsApiService;
