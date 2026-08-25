import { useQuery } from '@tanstack/react-query';

import { reportsApiService } from '../services/reports-api';

import type { AdvisingReportResponse, Semester } from '../types';

export const REPORTS_QUERY_KEYS = {
  all: ['reports'] as const,
  advising: (semesterId: string) => ['reports', 'advising', semesterId] as const,
  semesters: ['reports', 'semesters'] as const,
};

interface ApiErrorShape {
  status?: number;
  response?: { status?: number };
}

/**
 * Hook to fetch the advising report for a specific semester from GET /api/v1/analytics/advising?semester={semesterId}
 * Scoped to ADMIN and LECTURER roles.
 */
export function useAdvisingReport(semesterId?: string | null) {
  return useQuery<AdvisingReportResponse, Error>({
    queryKey: REPORTS_QUERY_KEYS.advising(semesterId || ''),
    queryFn: () => {
      if (!semesterId) {
        throw new Error('Semester ID is required to generate the advising report.');
      }
      return reportsApiService.getAdvisingReport(semesterId);
    },
    enabled: Boolean(semesterId),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
    retry: (failureCount, error: unknown) => {
      const err = error as ApiErrorShape;
      const status = err?.status || err?.response?.status;
      if (status === 400 || status === 403 || status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch active academic semesters for reporting filters.
 */
export function useAdminSemesters() {
  return useQuery<Semester[], Error>({
    queryKey: REPORTS_QUERY_KEYS.semesters,
    queryFn: () => reportsApiService.getSemesters(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
