// ─── API Response Types ───────────────────────────────────────────────────────

/**
 * Standard API success response envelope returned by the backend.
 */
export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

/**
 * Standard API error response envelope.
 */
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
  timestamp: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

/**
 * Pagination metadata returned by list endpoints.
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * A paginated API response that wraps a list of items.
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Query parameters for paginated list requests.
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Analytics Types ─────────────────────────────────────────────────────────

export interface ScoreSummary {
  mean: number | null;
  median: number | null;
  stddev: number | null;
  min: number | null;
  max: number | null;
}

export interface QuestionAnalytics {
  question_id: string;
  question_text: string;
  question_type: string;
  total_points: string;
  correct_count: number;
  attempts: number;
  correct_rate: number | null;
}

export interface ExamAnalyticsResponse {
  exam_id: string;
  title: string;
  status: string;
  attempt_count: number;
  graded_count: number;
  score: ScoreSummary;
  per_question: QuestionAnalytics[];
}

export interface AdvisingStudent {
  student_id: string;
  student_identifier: string;
  class_standing: string;
  enrolled_credit_hours: number;
  min_credit_hours: number;
}

export interface AdvisingReportResponse {
  semester_id: string;
  semester_label: string;
  students: AdvisingStudent[];
}

