import type { ExamResults, ExamResultRow, Result } from '@/types/api';

export type { ExamResults, ExamResultRow, Result };

export type GradingStatusFilter = 'ALL' | 'graded' | 'pending' | 'in_progress' | 'disrupted';

export type GradeLetterFilter = 'ALL' | 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

export interface ResultsFilterState {
  searchQuery: string;
  gradingStatus: string;
  gradeLetter: string;
}

export interface ExamResultSummaryMetrics {
  totalAttempts: number;
  gradedCount: number;
  pendingCount: number;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  passCount: number;
  passRate: number | null;
  gradeDistribution: Record<string, number>;
}
