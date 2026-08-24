import { useQuery } from '@tanstack/react-query';
import { getExamResults } from '../services/results-api';
import { examApiService } from '@/features/admin/services/exam-api-service';
import type { ExamResults } from '@/types/api';
import type { AdminExamOverview } from '@/features/admin/types';

export const RESULTS_QUERY_KEYS = {
  all: ['results'] as const,
  exam: (examId: string) => ['results', 'exam', examId] as const,
  adminExams: ['admin', 'exams', 'list'] as const,
};

/**
 * Hook to fetch per-student examination results from GET /api/v1/results/exam/{id}
 * Scoped to ADMIN and LECTURER roles.
 */
export function useExamResults(examId?: string | null) {
  return useQuery<ExamResults, Error>({
    queryKey: RESULTS_QUERY_KEYS.exam(examId || ''),
    queryFn: () => {
      if (!examId) throw new Error('Exam ID is required');
      return getExamResults(examId);
    },
    enabled: Boolean(examId),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
    retry: (failureCount, error: any) => {
      // Don't retry on 404 or 403
      if (error?.status === 404 || error?.status === 403 || error?.response?.status === 404 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch available examinations for the admin results examination selector.
 */
export function useAdminExamsList() {
  return useQuery<AdminExamOverview[], Error>({
    queryKey: RESULTS_QUERY_KEYS.adminExams,
    queryFn: () => examApiService.getExams(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
