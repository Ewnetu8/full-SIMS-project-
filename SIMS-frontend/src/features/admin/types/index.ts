// ─── Admin Feature Data Types ──────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'LECTURER' | 'STUDENT' | 'admin' | 'lecturer' | 'student';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserCompact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'LECTURER' | 'STUDENT';
  is_active: boolean;
  created_at: string;
}

export interface NestedStudentProfile {
  id: string;
  student_identifier: string;
  class_standing?: ClassStanding | string;
  department: string | null;
  department_detail?: Department | null;
}

export interface NestedLecturerProfile {
  id: string;
  faculty_identifier: string;
  department: string | null;
  department_detail?: Department | null;
}

export interface UserDetail {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  national_id_fan: string | null;
  role: 'ADMIN' | 'LECTURER' | 'STUDENT';
  is_active: boolean;
  is_staff: boolean;
  student_profile: NestedStudentProfile | null;
  lecturer_profile: NestedLecturerProfile | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  national_id_fan?: string | null;
  role?: 'ADMIN' | 'LECTURER' | 'STUDENT';
  is_active?: boolean;
  is_staff?: boolean;
}

export interface AdminUser extends UserCompact {
  // Legacy / convenience aliases
  userId?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  departmentId?: string | null;
  status?: UserStatus;
  lastLogin?: string;
  avatarUrl?: string;
  phone?: string;
  studentIdentifier?: string;
  facultyIdentifier?: string;
  nationalIdFan?: string | null;
}

export interface ApiStudentListItem {
  id: string;
  student_identifier: string;
  class_standing: ClassStanding;
  department: string | null;
  department_detail?: Department | null;
  user: string;
  user_email: string;
  user_full_name: string;
  user_is_active: boolean;
  created_at: string;
}

export interface ApiStudentDetail {
  id: string;
  student_identifier: string;
  class_standing: ClassStanding;
  department: string | null;
  department_detail?: Department | null;
  user: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  user_is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentFilterParams {
  search?: string;
  department?: string;
  class_standing?: string;
}

export interface UpdateStudentPayload {
  student_identifier?: string;
  class_standing?: ClassStanding;
  department_id?: string | null;
}

export type StudentProfile = ApiStudentListItem;

export type EnrollmentStatus = 'ENROLLED' | 'PASSED' | 'FAILED' | 'DROPPED';

export interface CourseOfferingDetailCourse {
  id: string;
  course_code?: string;
  code?: string;
  title?: string;
  name?: string;
  credit_hours?: number;
  creditHours?: number;
  intended_class_standing?: ClassStanding;
  intendedClassStanding?: ClassStanding;
  program?: string | null;
  program_detail?: Program | null;
  programDetail?: Program | null;
}

export interface CourseOfferingDetailAcademicYear {
  id: string;
  display_label?: string;
  displayLabel?: string;
  start_boundary?: string;
  end_boundary?: string;
}

export interface CourseOfferingDetailSemester {
  id: string;
  academic_year?: string;
  academicYear?: string;
  academic_year_detail?: CourseOfferingDetailAcademicYear | null;
  academicYearDetail?: CourseOfferingDetailAcademicYear | null;
  semester_index?: 'FIRST' | 'SECOND' | string;
  semesterIndex?: 'FIRST' | 'SECOND' | string;
}

export interface AdminCourseOffering {
  id: string;
  course: string;
  course_detail?: CourseOfferingDetailCourse | null;
  semester: string;
  semester_detail?: CourseOfferingDetailSemester | null;
  section: string;
  capacity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdminEnrollment {
  id: string;
  student: string;
  course_offering?: string | null;
  course_offering_detail?: AdminCourseOffering | null;
  status: EnrollmentStatus;
  is_retake: boolean;
  grade?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEnrollmentPayload {
  student: string;
  course_offering: string;
  status?: EnrollmentStatus;
  grade?: string | null;
}

export interface UpdateEnrollmentPayload {
  status?: EnrollmentStatus;
  grade?: string | null;
  course_offering?: string;
}

export interface BatchImportResponse {
  detail?: string;
  task_id?: string;
  message?: string;
  imported_count?: number;
}

export interface ApiLecturerListItem {
  id: string;
  faculty_identifier: string;
  department: string | null;
  department_detail?: Department | null;
  user: string;
  user_email: string;
  user_full_name: string;
  user_is_active: boolean;
  created_at: string;
}

export interface ApiLecturerDetail {
  id: string;
  faculty_identifier: string;
  department: string | null;
  department_detail?: Department | null;
  user: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  user_is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LecturerFilterParams {
  search?: string;
  department?: string;
}

export interface UpdateLecturerPayload {
  faculty_identifier?: string;
  department_id?: string | null;
}

export type LecturerProfile = ApiLecturerListItem;

export interface University {
  id: string;
  name: string;
  code: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface College {
  id: string;
  name: string;
  code: string;
  university: string;
  university_detail?: University;
  createdAt?: string;
  updatedAt?: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  department: string;
  degreeLevel: string;
  totalCreditHoursRequired: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicYearItem {
  id: string;
  displayLabel: string;
  startBoundary: string;
  endBoundary: string;
  createdAt?: string;
}

export interface SemesterItem {
  id: string;
  academicYear: string;
  academicYearLabel?: string;
  semesterIndex: number;
  createdAt?: string;
}

export interface Department {
  id: string;
  name: string; // e.g. "Computer Science & Software Engineering"
  code: string; // e.g. "CS"
  college?: string | null;
  college_detail?: College;
  createdAt?: string;
  updatedAt?: string;
}



export interface AcademicYear {
  id: string;
  displayLabel: string;
  startBoundary: string;
  endBoundary: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SemesterTerm = 'FIRST' | 'SECOND' | 'SUMMER';

export interface Semester {
  id: string;
  academicYear: string;
  academicYearDetail?: AcademicYear;
  semesterIndex: SemesterTerm | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSemesterPayload {
  academic_year: string;
  semester_index: SemesterTerm | string;
}

export interface UpdateSemesterPayload {
  academic_year?: string;
  semester_index?: SemesterTerm | string;
}

export type ClassStanding = 'FRESHMAN' | 'SOPHOMORE' | 'JUNIOR' | 'SENIOR' | 'GRADUATE';

export interface Course {
  id: string;
  code: string; // e.g. "CS301"
  name: string; // e.g. "Data Structures & Algorithms"
  title?: string;
  creditHours: number;
  program?: string | null;
  programDetail?: Program | null;
  intendedClassStanding?: ClassStanding;
  createdAt?: string;
  updatedAt?: string;
}

export type AdminExamStatus = 'scheduled' | 'active' | 'completed' | 'grading' | 'published' | 'archived';

export interface AdminExamOverview {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  department: string;
  lecturerName: string;
  status: AdminExamStatus;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  totalStudents: number;
  participatedStudents: number;
}

export type AIGradingJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AIGradingJob {
  id: string;
  examId: string;
  examTitle: string;
  courseName: string;
  department: string;
  totalSubmissions: number;
  processedSubmissions: number;
  status: AIGradingJobStatus;
  confidenceAverage?: number;
  errorReason?: string;
  startedAt: string;
  completedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  actorRole: UserRole;
  actionEvent: string; // e.g. "user.created", "exam.published", "settings.updated"
  resourceType: string;
  resourceName: string;
  ipAddress: string;
  details: string;
}

export interface SystemSettings {
  institutionName: string;
  institutionCode: string;
  supportEmail: string;
  timezone: string;
  academicYear: string;
  activeSemester: string;
  branding: {
    primaryColor: string;
    darkThemeDefault: boolean;
    portalTitle: string;
  };
  examDefaults: {
    defaultDurationMinutes: number;
    passPercentageThreshold: number;
    autoSaveIntervalSeconds: number;
    allowReviewBeforeSubmission: boolean;
  };
  aiConfig: {
    provider: string; // e.g. "OpenAI GPT-4o", "Claude 3.5 Sonnet", "Local LLM Server"
    apiKeyMasked: string;
    autoGradingConfidenceThreshold: number; // e.g. 85%
    flagLowConfidenceForManualReview: boolean;
    maxParallelGradingWorkers: number;
  };
  notificationSettings: {
    emailAlertsOnSystemErrors: boolean;
    notifyLecturersOnExamPublish: boolean;
    weeklyDigestEmail: boolean;
  };
}

export interface AdminDashboardStats {
  totalStudents: number;
  totalLecturers: number;
  totalAdministrators: number;
  totalCourses: number;
  totalDepartments: number;
  totalExams: number;
  activeExams: number;
  pendingAIGrading: number;
  publishedResults: number;
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    cpuUsage: number;
    memoryUsage: number;
    activeDbConnections: number;
    apiLatencyMs: number;
    aiEngineStatus: 'online' | 'busy' | 'offline';
    lastBackupTimestamp: string;
  };
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  category: 'user' | 'exam' | 'ai' | 'system' | 'security';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface AdminReportData {
  performanceTrends: { month: string; avgScore: number; passRate: number }[];
  departmentPassRates: { department: string; passRate: number; totalExams: number }[];
  aiGradingStats: { month: string; automated: number; manualReview: number; errorRate: number }[];
  systemUsage: { day: string; activeStudents: number; activeLecturers: number; examSessions: number }[];
  gradeDistribution: { grade: string; count: number; percentage: number }[];
}

export interface Tag {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTagPayload {
  name: string;
}

export interface UpdateTagPayload {
  name: string;
}

