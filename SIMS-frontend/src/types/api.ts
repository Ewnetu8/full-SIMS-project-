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

// ─── Analytics Types (SIMS API 4) ───────────────────────────────────────────

export interface AdminAnalyticsResponse {
  total_users: number;
  total_students: number;
  total_lecturers: number;
  total_colleges: number;
  total_departments: number;
  total_programs: number;
  total_courses: number;
  total_exams: number;
}

export interface ScoreSummary {
  mean: number | null;
  median: number | null;
  mode: number | null;
  stddev: number | null;
  min: number | null;
  max: number | null;
}

export interface ScoreBand {
  label: string;
  count: number;
}

export interface QuestionAnalytics {
  question_id: string;
  question_text: string;
  question_type: string;
  total_points: string;
  correct_count: number;
  attempts: number;
  correct_rate: number | null;
  average_points: number | null;
  unanswered_count: number;
}

export interface ExamAnalytics {
  exam_id: string;
  title: string;
  status: string;
  attempt_count: number;
  graded_count: number;
  score: ScoreSummary;
  pass_rate: number | null;
  pass_threshold: number;
  score_distribution: ScoreBand[];
  per_question: QuestionAnalytics[];
}

export type ExamAnalyticsResponse = ExamAnalytics;

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

// ─── Results Types (SIMS API 4) ─────────────────────────────────────────────

export interface Result {
  id: string;
  exam_attempt: string;
  exam_id: string;
  exam_title: string;
  exam_status: string;
  course_code: string;
  course_title: string;
  final_score: string;
  grade_letter: string;
  certified_by: string;
  grading_status: string;
  submission_time: string;
  created_at: string;
  updated_at: string;
}

export interface ExamResultRow {
  student_id: string;
  student_identifier: string;
  student_name: string | null;
  attempt_id: string;
  final_score: string | null;
  grade_letter: string | null;
  grading_status: string;
  submission_time: string | null;
  is_disrupted: boolean;
}

export interface ExamResults {
  exam_id: string;
  title: string;
  status: string;
  attempt_count: number;
  graded_count: number;
  students: ExamResultRow[];
}
