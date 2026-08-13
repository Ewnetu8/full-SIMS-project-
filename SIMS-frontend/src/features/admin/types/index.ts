// ─── Admin Feature Data Types ──────────────────────────────────────────────────

export type UserRole = 'admin' | 'lecturer' | 'student';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface AdminUser {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  lastLogin: string;
  avatarUrl?: string;
  phone?: string;
  studentIdentifier?: string;
  facultyIdentifier?: string;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  studentId: string; // e.g. "STD-2024-041"
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  program: string;
  academicYear: string; // e.g. "Year 3 - Semester 2"
  status: UserStatus;
  gpa: number;
  enrolledCoursesCount: number;
  avatarUrl?: string;
}

export interface LecturerProfile {
  id: string;
  lecturerId: string; // e.g. "LEC-881"
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  office: string;
  coursesAssigned: string[];
  status: UserStatus;
  avatarUrl?: string;
}

export interface College {
  id: string;
  name: string;
  code: string;
  university?: string;
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

export interface AdminCourseOffering {
  id: string;
  course: string;
  courseCode?: string;
  courseTitle?: string;
  semester: string;
  semesterLabel?: string;
  section: string;
  capacity: number;
  createdAt?: string;
}

export interface Department {
  id: string;
  code: string; // e.g. "CS"
  name: string; // e.g. "Computer Science & Software Engineering"
  college?: string | null;
  description: string;
  headOfDepartment: {
    id: string;
    name: string;
    email: string;
  };
  lecturerCount: number;
  studentCount: number;
  courseCount: number;
  createdAt: string;
}



export interface AcademicYear {
  id: string;
  displayLabel: string;
  startBoundary: string;
  endBoundary: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Semester {
  id: string;
  academicYear: string;
  academicYearDetail?: AcademicYear;
  semesterIndex: 'FIRST' | 'SECOND';
  createdAt?: string;
  updatedAt?: string;
}

export interface Course {
  id: string;
  code: string; // e.g. "CS301"
  name: string; // e.g. "Data Structures & Algorithms"
  creditHours: number;
  department: string;
  assignedLecturer: {
    id: string;
    name: string;
  };
  studentCount: number;
  status: 'active' | 'archived';
  semester: string;
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
