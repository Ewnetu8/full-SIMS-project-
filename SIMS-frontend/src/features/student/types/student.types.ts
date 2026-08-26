export type EnrollmentStatusEnum = 'ENROLLED' | 'PASSED' | 'FAILED' | 'DROPPED';
export type ExaminationStatusEnum = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'CLOSED' | 'PUBLISHED';
export type QuestionTypeEnum = 'MCQ' | 'SHORT_ANSWER' | 'ESSAY';
export type SemesterIndexEnum = 'FIRST' | 'SECOND' | 'SUMMER';
export type DegreeLevelEnum = 'BACHELOR' | 'MASTER' | 'DOCTORATE' | 'DIPLOMA' | 'CERTIFICATE';

export interface AcademicYear {
  id: string;
  display_label: string;
  start_boundary: string;
  end_boundary: string;
  created_at: string;
  updated_at: string;
}

export interface Semester {
  id: string;
  academic_year: string;
  academic_year_detail?: AcademicYear;
  semester_index: SemesterIndexEnum;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  college?: string | null;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  department: string;
  department_detail?: Department;
  name: string;
  code: string;
  degree_level?: DegreeLevelEnum;
  total_credit_hours_required?: number;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  program?: string | null;
  program_detail?: Program;
  title: string;
  course_code: string;
  credit_hours: number;
  intended_class_standing?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseOffering {
  id: string;
  course: string;
  course_detail: Course;
  semester: string;
  semester_detail: Semester;
  section: string;
  capacity?: number;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student: string;
  course_offering?: string | null;
  course_offering_detail: CourseOffering;
  status: EnrollmentStatusEnum;
  is_retake: boolean;
  grade?: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id: string;
  question: string;
  option_text: string;
  is_correct?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  examination?: string | null;
  creator?: string;
  question_text: string;
  question_type: QuestionTypeEnum;
  total_points: string | number;
  is_active?: boolean;
  options: QuestionOption[];
  rubric_criteria?: any[];
  created_at: string;
  updated_at: string;
}

export interface Examination {
  id: string;
  course_offering: string;
  course_offering_detail?: {
    id: string;
    course_title?: string;
    course_code?: string;
    section?: string;
    course_detail?: Course;
  };
  lecturer: string;
  title: string;
  status: ExaminationStatusEnum;
  start_window: string;
  end_window: string;
  duration_minutes: number;
  questions?: Question[];
  created_at: string;
  updated_at: string;
}

export interface ExamAttempt {
  id: string;
  examination: string;
  student: string;
  start_time: string;
  submission_time?: string | null;
  is_disrupted: boolean;
  questions?: Question[];
  created_at: string;
  updated_at: string;
}

export interface StudentAnswerRequest {
  selected_option?: string | null;
  submitted_text?: string | null;
}

export interface StudentAnswer {
  id: string;
  exam_attempt: string;
  question: string;
  question_text: string;
  selected_option?: string | null;
  submitted_text?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmitExamRequest {
  is_disrupted?: boolean;
}

export interface Notification {
  id: string;
  recipient: string;
  message_body: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationMarkRead {
  id: string;
  is_read?: boolean;
}

export interface NotificationMarkReadRequest {
  is_read: boolean;
}

export interface StudentProfile {
  fullName: string;
  studentId: string;
  email: string;
  department: string;
  program: string;
  yearOfStudy: string;
}

export interface AcademicProfileDetails {
  studentId: string | null;
  department: string | null;
  college: string | null;
  program: string | null;
  academicYear: string | null;
  classStanding: string | null;
  totalEnrolledCourses: number;
}

export interface CourseAssessmentMarkItem {
  assessment_id: string;
  title: string;
  assessment_type: string;
  max_marks: string | number;
  weight: string | number;
  due_date: string | null;
  mark_id: string | null;
  score: string | number | null;
  remarks: string;
}

export interface CourseOfferingMarksGroup {
  enrollment_id: string;
  course_offering: CourseOffering;
  assessments: CourseAssessmentMarkItem[];
  total_percent: number | null;
  letter_grade: string | null;
}

export type { Result } from '@/types/api';