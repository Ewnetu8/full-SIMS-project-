// ─── Lecturer Domain Types ────────────────────────────────────────────────────

/**
 * Base model with common timestamps and UUID primary key.
 * All Django models extend this structure.
 */
export interface BaseModel {
  id: string; // UUID v4
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

// ─── Question Types ───────────────────────────────────────────────────────────

export type QuestionType = 'MCQ' | 'SHORT_ANSWER' | 'ESSAY';

export interface Tag extends BaseModel {
  name: string;
}

export interface QuestionOption extends BaseModel {
  question: string; // UUID reference
  option_text: string;
  is_correct: boolean;
}

export interface RubricCriterion extends BaseModel {
  question: string; // UUID reference
  criterion_text: string;
  point_weight: number; // Decimal(5, 2)
}

export interface Question extends BaseModel {
  examination: string | null; // UUID reference, nullable
  creator: string; // Lecturer UUID reference
  question_text: string;
  question_type: QuestionType;
  total_points: number; // Decimal(5, 2)
  is_active: boolean;
  tags: Tag[];
  options: QuestionOption[];
  rubric_criteria: RubricCriterion[];
}

/**
 * Request body for creating a new question.
 */
export interface CreateQuestionRequest {
  examination?: string; // UUID, optional
  question_text: string;
  question_type: QuestionType;
  total_points: number;
  tag_ids?: string[]; // Array of tag UUIDs
}

/**
 * Request body for updating a question (partial).
 */
export type UpdateQuestionRequest = Partial<CreateQuestionRequest>;

/**
 * Request body for creating a question option.
 */
export interface CreateQuestionOptionRequest {
  question: string; // UUID
  option_text: string;
  is_correct: boolean;
}

/**
 * Request body for creating a rubric criterion.
 */
export interface CreateRubricCriterionRequest {
  question: string; // UUID
  criterion_text: string;
  point_weight: number;
}

/**
 * Request body for creating a tag.
 */
export interface CreateTagRequest {
  name: string;
}

export type CreateTagPayload = CreateTagRequest;

export interface UpdateTagPayload {
  name?: string;
}

// ─── Examination Types ────────────────────────────────────────────────────────

export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'CLOSED' | 'PUBLISHED';

/**
 * Exam status transition rules.
 * Only forward transitions are allowed, no skipping or rollback.
 */
export const EXAM_STATUS_TRANSITIONS: Record<ExamStatus, ExamStatus[]> = {
  DRAFT: ['SCHEDULED'],
  SCHEDULED: ['ACTIVE'],
  ACTIVE: ['CLOSED'],
  CLOSED: ['PUBLISHED'],
  PUBLISHED: [],
};

export interface CourseOfferingBrief {
  id: string;
  course_code: string;
  course_title: string;
  semester: string; // Academic year label e.g., "2024-2025"
  semester_index: string; // e.g., "FIRST", "SECOND", "1", "2"
  section?: string;
}

export interface Examination extends BaseModel {
  course_offering: string; // UUID reference
  course_offering_detail: CourseOfferingBrief;
  lecturer: string; // Lecturer UUID reference
  title: string;
  status: ExamStatus;
  start_window: string; // ISO 8601 timestamp
  end_window: string; // ISO 8601 timestamp
  duration_minutes: number;
  questions: Question[];
}

/**
 * Request body for creating an examination.
 */
export interface CreateExaminationRequest {
  course_offering: string; // UUID
  title: string;
  start_window: string; // ISO 8601 timestamp
  end_window: string; // ISO 8601 timestamp
  duration_minutes: number;
}

/**
 * Request body for updating an examination (partial).
 */
export interface UpdateExaminationRequest extends Partial<CreateExaminationRequest> {
  status?: ExamStatus;
}

/**
 * Request body for scheduling an examination.
 */
export interface ScheduleExaminationRequest {
  start_window: string; // ISO 8601 timestamp
  end_window: string; // ISO 8601 timestamp
  duration_minutes: number;
}

// ─── Exam Attempt Types (Read-Only for Lecturers) ────────────────────────────

export interface ExamAttempt extends BaseModel {
  examination: string; // UUID reference
  student: string; // Student UUID reference
  start_time: string; // ISO 8601 timestamp
  submission_time: string | null; // ISO 8601 timestamp, nullable
  is_disrupted: boolean;
}

export interface StudentAnswer extends BaseModel {
  exam_attempt: string; // UUID reference
  question: string; // UUID reference
  question_text: string; // Denormalized for convenience
  selected_option: string | null; // UUID reference, nullable
  submitted_text: string | null;
}

// ─── Academic Hierarchy Types (Read-Only) ─────────────────────────────────────

export interface University extends BaseModel {
  name: string;
  code: string;
}

export interface College extends BaseModel {
  university: string; // UUID reference
  university_detail: University;
  name: string;
  code: string;
}

export interface Department extends BaseModel {
  college: string | null; // UUID reference, nullable
  college_detail: College | null;
  name: string;
  code: string;
}

export type DegreeLevel = 'BACHELOR' | 'MASTER' | 'DOCTORATE' | 'DIPLOMA' | 'CERTIFICATE';

export interface Program extends BaseModel {
  department: string; // UUID reference
  department_detail: Department;
  name: string;
  code: string;
  degree_level: DegreeLevel;
  total_credit_hours_required: number;
}

export interface AcademicYear extends BaseModel {
  display_label: string; // e.g., "2024-2025"
  start_boundary: string; // ISO 8601 date (YYYY-MM-DD)
  end_boundary: string; // ISO 8601 date (YYYY-MM-DD)
}

export type SemesterIndex = 'FIRST' | 'SECOND' | 'SUMMER';

export interface Semester extends BaseModel {
  academic_year: string; // UUID reference
  academic_year_detail: AcademicYear;
  semester_index: SemesterIndex;
}

export type ClassStanding = 'FRESHMAN' | 'SOPHOMORE' | 'JUNIOR' | 'SENIOR' | 'GRADUATE';

export interface Course extends BaseModel {
  program: string | null; // UUID reference, nullable
  program_detail: Program | null;
  title: string;
  course_code: string;
  credit_hours: number;
  intended_class_standing: ClassStanding;
}

export interface CoursePrerequisite extends BaseModel {
  course: string; // UUID reference
  course_detail: Course;
  prerequisite_course: string; // UUID reference
  prerequisite_course_detail: Course;
}

export interface CourseOffering extends BaseModel {
  course: string; // UUID reference
  course_detail: Course;
  semester: string; // UUID reference
  semester_detail: Semester;
  section: string;
  capacity: number;
}

// ─── Enrollment Types (Read-Only for Lecturers) ───────────────────────────────

export type EnrollmentStatus = 'ENROLLED' | 'PASSED' | 'FAILED' | 'DROPPED';

export interface StudentBrief {
  id: string;
  student_identifier: string;
  full_name: string;
}

export interface StudentListItem {
  id: string;
  student_identifier: string;
  user_full_name: string;
  user_email: string;
  class_standing?: string;
  department?: string | null;
}

export interface Enrollment extends BaseModel {
  student: string; // UUID reference
  student_detail?: StudentBrief | StudentListItem | null;
  student_identifier?: string;
  student_name?: string;
  course_offering: string; // UUID reference
  course_offering_detail: CourseOffering;
  status: EnrollmentStatus;
  is_retake: boolean;
  grade: string | null;
}

// ─── Query Parameter Types ────────────────────────────────────────────────────

/**
 * Query parameters for listing questions.
 */
export interface ListQuestionsParams {
  examination?: string; // UUID filter
  question_type?: QuestionType;
  creator?: string; // Lecturer UUID filter
}

/**
 * Query parameters for listing examinations.
 */
export interface ListExaminationsParams {
  status?: ExamStatus;
  course_offering?: string; // UUID filter
}

/**
 * Query parameters for listing question options.
 */
export interface ListQuestionOptionsParams {
  question?: string; // UUID filter
}

/**
 * Query parameters for listing rubric criteria.
 */
export interface ListRubricCriteriaParams {
  question?: string; // UUID filter
}

// ─── Response Types ───────────────────────────────────────────────────────────

/**
 * Response when creating a question with warnings.
 */
export interface QuestionWithWarnings extends Question {
  warnings?: string[];
}

/**
 * API error response structure.
 */
export interface ApiErrorDetail {
  detail: string;
  errors?: Record<string, string[]>; // Validation errors keyed by field name
}

// ─── Utility Types ────────────────────────────────────────────────────────────

/**
 * Helper to make all properties of T nullable.
 */
export type NullableProperties<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Helper to extract the UUID type from a model reference.
 */
export type UUID = string;

/**
 * Helper to represent a date-only string (YYYY-MM-DD).
 */
export type DateString = string;

/**
 * Helper to represent an ISO 8601 timestamp string.
 */
export type TimestampString = string;
