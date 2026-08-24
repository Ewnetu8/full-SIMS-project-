import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { isValidUuid } from '@/lib/user-identifier';
import { api } from '@/services/api-client';

import { academicService } from './academic-service';
import { examApiService } from './exam-api-service';

import type {
  UserCompact,
  UserDetail,
  UpdateUserPayload,
  Department,
  Course,
  ClassStanding,
  College,
  Program,
  AcademicYear,
  Semester,
  CreateSemesterPayload,
  UpdateSemesterPayload,
  AdminExamOverview,
  AIGradingJob,
  AuditLog,
  SystemSettings,
  AdminDashboardStats,
  AdminNotification,
  AdminCourseOffering,
  AdminEnrollment,
  CreateEnrollmentPayload,
  UpdateEnrollmentPayload,
  BatchImportResponse,
  ApiStudentListItem,
  ApiStudentDetail,
  StudentFilterParams,
  UpdateStudentPayload,
  ApiLecturerListItem,
  ApiLecturerDetail,
  LecturerFilterParams,
  UpdateLecturerPayload,
  Tag,
  CreateTagPayload,
  UpdateTagPayload,
} from '../types';

export interface RegisterUserPayload {
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  role?: 'STUDENT' | 'LECTURER' | 'ADMIN' | 'student' | 'lecturer' | 'admin';
  student_identifier?: string;
  faculty_identifier?: string;
  department_id?: string | null;
  national_id_fan?: string | null;
}

export const adminService = {
  // ─── Users ─────────────────────────────────────────────────────────────────
  /**
   * Returns list of users matching optional search keyword and role filter.
   * Endpoint: GET /api/v1/users
   */
  async getUsers(params?: { search?: string; role?: string }): Promise<UserCompact[]> {
    const queryParams: Record<string, string> = {};
    if (params?.search && params.search.trim()) {
      queryParams.search = params.search.trim();
    }
    if (params?.role && params.role !== 'ALL') {
      queryParams.role = params.role.toUpperCase();
    }
    return api.get<UserCompact[]>(API_ENDPOINTS.USERS.ROOT, {
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    });
  },

  /**
   * Returns full user details including nested profile information.
   * Endpoint: GET /api/v1/users/{id}
   */
  async getUserById(id: string): Promise<UserDetail> {
    return api.get<UserDetail>(API_ENDPOINTS.USERS.BY_ID(id));
  },

  /**
   * Registers a new user account.
   * Endpoint: POST /api/v1/auth/register
   */
  async createUser(data: RegisterUserPayload): Promise<UserCompact> {
    const roleUpper = (data.role || 'STUDENT').toUpperCase() as 'STUDENT' | 'LECTURER' | 'ADMIN';

    const payload: Record<string, unknown> = {
      email: data.email.trim(),
      password: data.password || 'Temp!Pass2026',
      first_name: data.first_name ? data.first_name.trim() : '',
      last_name: data.last_name ? data.last_name.trim() : '',
      role: roleUpper,
    };

    if (data.national_id_fan && data.national_id_fan.trim()) {
      payload.national_id_fan = data.national_id_fan.trim();
    }

    if (roleUpper === 'STUDENT' && data.student_identifier) {
      payload.student_identifier = data.student_identifier.trim();
    } else if (roleUpper === 'LECTURER' && data.faculty_identifier) {
      payload.faculty_identifier = data.faculty_identifier.trim();
    }

    if (data.department_id && isValidUuid(data.department_id)) {
      payload.department_id = data.department_id;
    }

    const res = await api.post<{ user?: UserCompact } & UserCompact>(API_ENDPOINTS.AUTH.REGISTER, payload);
    return (res.user || res) as UserCompact;
  },

  /**
   * Updates user fields.
   * Endpoint: PATCH /api/v1/users/{id}
   */
  async updateUser(id: string, data: UpdateUserPayload): Promise<UserDetail> {
    const payload: Record<string, unknown> = {};
    if (data.first_name !== undefined) payload.first_name = data.first_name.trim();
    if (data.last_name !== undefined) payload.last_name = data.last_name.trim();
    if (data.national_id_fan !== undefined) {
      payload.national_id_fan = data.national_id_fan ? data.national_id_fan.trim() : null;
    }
    if (data.role !== undefined) payload.role = data.role.toUpperCase();
    if (data.is_active !== undefined) payload.is_active = data.is_active;
    if (data.is_staff !== undefined) payload.is_staff = data.is_staff;

    return api.patch<UserDetail>(API_ENDPOINTS.USERS.BY_ID(id), payload);
  },

  /**
   * Soft deletes / deactivates a user account.
   * Endpoint: DELETE /api/v1/users/{id}
   */
  async deleteUser(id: string): Promise<{ detail: string }> {
    return api.delete<{ detail: string }>(API_ENDPOINTS.USERS.BY_ID(id));
  },

  // ─── Universities ───────────────────────────────────────────────────────────
  async getUniversities(): Promise<Array<{ id: string; name: string; code: string }>> {
    return academicService.getUniversities();
  },

  // ─── Colleges ───────────────────────────────────────────────────────────────
  async getColleges(): Promise<College[]> {
    return academicService.getColleges();
  },

  async createCollege(data: { name: string; code: string; university: string }): Promise<College> {
    return academicService.createCollege(data);
  },

  async updateCollege(id: string, data: Partial<{ name: string; code: string; university: string }>): Promise<College> {
    return academicService.updateCollege(id, data);
  },

  async deleteCollege(id: string): Promise<void> {
    return academicService.deleteCollege(id);
  },

  // ─── Departments ───────────────────────────────────────────────────────────
  async getDepartments(): Promise<Department[]> {
    return academicService.getDepartments();
  },

  async getDepartmentById(id: string): Promise<Department> {
    return academicService.getDepartmentById(id);
  },

  async createDepartment(data: { name: string; code: string; college?: string | null }): Promise<Department> {
    return academicService.createDepartment(data);
  },

  async updateDepartment(id: string, data: Partial<{ name: string; code: string; college?: string | null }>): Promise<Department> {
    return academicService.updateDepartment(id, data);
  },

  async deleteDepartment(id: string): Promise<void> {
    return academicService.deleteDepartment(id);
  },

  // ─── Programs ───────────────────────────────────────────────────────────────
  async getPrograms(): Promise<Program[]> {
    return academicService.getPrograms();
  },

  async createProgram(data: { department: string; name: string; code: string; degree_level?: string; total_credit_hours_required?: number }): Promise<Program> {
    return academicService.createProgram(data);
  },

  async updateProgram(id: string, data: Partial<{ department?: string; name: string; code: string; degree_level?: string; total_credit_hours_required?: number }>): Promise<Program> {
    return academicService.updateProgram(id, data);
  },

  async deleteProgram(id: string): Promise<void> {
    return academicService.deleteProgram(id);
  },

  // ─── Academic Years ─────────────────────────────────────────────────────────
  async getAcademicYears(): Promise<AcademicYear[]> {
    return academicService.getAcademicYears();
  },

  async createAcademicYear(data: { display_label: string; start_boundary: string; end_boundary: string }): Promise<AcademicYear> {
    return academicService.createAcademicYear(data);
  },

  async updateAcademicYear(id: string, data: Partial<{ display_label: string; start_boundary: string; end_boundary: string }>): Promise<AcademicYear> {
    return academicService.updateAcademicYear(id, data);
  },

  async deleteAcademicYear(id: string): Promise<void> {
    return academicService.deleteAcademicYear(id);
  },

  // ─── Semesters ──────────────────────────────────────────────────────────────
  async getSemesters(): Promise<Semester[]> {
    return academicService.getSemesters();
  },

  async getSemesterById(id: string): Promise<Semester> {
    return academicService.getSemesterById(id);
  },

  async createSemester(data: CreateSemesterPayload): Promise<Semester> {
    return academicService.createSemester(data);
  },

  async updateSemester(id: string, data: UpdateSemesterPayload): Promise<Semester> {
    return academicService.updateSemester(id, data);
  },

  async deleteSemester(id: string): Promise<void> {
    return academicService.deleteSemester(id);
  },

  // ─── Courses ───────────────────────────────────────────────────────────────
  async getCourses(): Promise<Course[]> {
    return academicService.getCourses();
  },

  async createCourse(data: { title: string; course_code: string; credit_hours: number; program?: string | null; intended_class_standing?: ClassStanding }): Promise<Course> {
    return academicService.createCourse(data);
  },

  async updateCourse(id: string, data: Partial<{ title: string; course_code: string; credit_hours: number; program?: string | null; intended_class_standing?: ClassStanding }>): Promise<Course> {
    return academicService.updateCourse(id, data);
  },

  async deleteCourse(id: string): Promise<void> {
    return academicService.deleteCourse(id);
  },

  // ─── Exams ─────────────────────────────────────────────────────────────────
  async getAllExams(): Promise<AdminExamOverview[]> {
    return examApiService.getExams();
  },

  async createExam(data: { title: string; duration_minutes: number; course_offering?: string }): Promise<AdminExamOverview> {
    return examApiService.createExam(data);
  },

  async scheduleExam(id: string, data: { start_window: string; end_window: string; duration_minutes: number }): Promise<void> {
    return examApiService.scheduleExam(id, data);
  },

  async archiveExam(id: string): Promise<AdminExamOverview> {
    const exams = await this.getAllExams();
    const exam = exams.find((e) => e.id === id);
    if (!exam) throw new Error('Exam not found');
    exam.status = 'archived';
    return exam;
  },

  async deleteExam(id: string): Promise<void> {
    return examApiService.deleteExam(id);
  },

  // ─── Course Offerings ───────────────────────────────────────────────────────
  async getCourseOfferings(): Promise<AdminCourseOffering[]> {
    return academicService.getCourseOfferings();
  },

  async getCourseOfferingById(id: string): Promise<AdminCourseOffering> {
    return academicService.getCourseOfferingById(id);
  },

  // ─── Enrollments ────────────────────────────────────────────────────────────
  async getEnrollments(): Promise<AdminEnrollment[]> {
    return academicService.getEnrollments();
  },

  async getEnrollmentById(id: string): Promise<AdminEnrollment> {
    return academicService.getEnrollmentById(id);
  },

  async createEnrollment(data: CreateEnrollmentPayload): Promise<AdminEnrollment> {
    return academicService.createEnrollment(data);
  },

  async updateEnrollment(id: string, data: UpdateEnrollmentPayload): Promise<AdminEnrollment> {
    return academicService.updateEnrollment(id, data);
  },

  async deleteEnrollment(id: string): Promise<void> {
    return academicService.deleteEnrollment(id);
  },

  async batchImportEnrollments(file: File): Promise<BatchImportResponse> {
    return academicService.batchImportEnrollments(file);
  },

  // ─── Students (Student Management API) ──────────────────────────────────────
  async getStudents(params?: StudentFilterParams): Promise<ApiStudentListItem[]> {
    return academicService.getStudents(params);
  },

  async getStudentById(id: string): Promise<ApiStudentDetail> {
    return academicService.getStudentById(id);
  },

  async updateStudent(id: string, payload: UpdateStudentPayload): Promise<ApiStudentDetail> {
    return academicService.updateStudent(id, payload);
  },

  // ─── Lecturers (Lecturer Management API) ───────────────────────────────────
  async getLecturers(params?: LecturerFilterParams): Promise<ApiLecturerListItem[]> {
    return academicService.getLecturers(params);
  },

  async getLecturerById(id: string): Promise<ApiLecturerDetail> {
    return academicService.getLecturerById(id);
  },

  async updateLecturer(id: string, payload: UpdateLecturerPayload): Promise<ApiLecturerDetail> {
    return academicService.updateLecturer(id, payload);
  },

  // ─── Tags (Question Tags API) ───────────────────────────────────────────────
  async getTags(): Promise<Tag[]> {
    return academicService.getTags();
  },

  async getTagById(id: string): Promise<Tag> {
    return academicService.getTagById(id);
  },

  async createTag(payload: CreateTagPayload): Promise<Tag> {
    return academicService.createTag(payload);
  },

  async updateTag(id: string, payload: UpdateTagPayload): Promise<Tag> {
    return academicService.updateTag(id, payload);
  },

  async patchTag(id: string, payload: Partial<UpdateTagPayload>): Promise<Tag> {
    return academicService.patchTag(id, payload);
  },

  async deleteTag(id: string): Promise<void> {
    return academicService.deleteTag(id);
  },

  // ─── AI Jobs, Settings, Reports, Notifications ────────────────────────────
  async getAIGradingJobs(): Promise<AIGradingJob[]> {
    return [];
  },

  async retryAIGradingJob(_jobId: string): Promise<AIGradingJob | null> {
    return null;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return [];
  },

  async getSettings(): Promise<SystemSettings> {
    return {
      institutionName: 'Addis Ababa Science and Technology University',
      institutionCode: 'AASTU',
      supportEmail: 'support@aastu.edu.et',
      timezone: 'Africa/Addis_Ababa',
      academicYear: '2025/2026',
      activeSemester: 'First Semester',
      branding: {
        primaryColor: '#102A7A',
        darkThemeDefault: false,
        portalTitle: 'AASTU SIMS',
      },
      examDefaults: {
        defaultDurationMinutes: 60,
        passPercentageThreshold: 50,
        autoSaveIntervalSeconds: 30,
        allowReviewBeforeSubmission: true,
      },
      aiConfig: {
        provider: 'AASTU AI Engine',
        apiKeyMasked: '••••••••••••••••',
        autoGradingConfidenceThreshold: 85,
        flagLowConfidenceForManualReview: true,
        maxParallelGradingWorkers: 4,
      },
      notificationSettings: {
        emailAlertsOnSystemErrors: true,
        notifyLecturersOnExamPublish: true,
        weeklyDigestEmail: false,
      },
    };
  },

  async updateSettings(newSettings: Partial<SystemSettings>): Promise<SystemSettings> {
    const current = await this.getSettings();
    return { ...current, ...newSettings };
  },

  async getNotifications(): Promise<AdminNotification[]> {
    return [];
  },

  async markNotificationRead(_id: string): Promise<void> { },

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [departments, courses, exams, students, lecturers, users] = await Promise.all([
      academicService.getDepartments().catch(() => []),
      academicService.getCourses().catch(() => []),
      examApiService.getExams().catch(() => []),
      this.getStudents().catch(() => []),
      this.getLecturers().catch(() => []),
      this.getUsers().catch(() => []),
    ]);

    return {
      totalStudents: students.length,
      totalLecturers: lecturers.length,
      totalAdministrators: users.filter((u) => (u.role || '').toUpperCase() === 'ADMIN').length,
      totalCourses: courses.length,
      totalDepartments: departments.length,
      totalExams: exams.length,
      activeExams: exams.filter((e) => e.status === 'active' || e.status === 'scheduled').length,
      pendingAIGrading: 0,
      publishedResults: exams.filter((e) => e.status === 'published').length,
      systemHealth: {
        status: 'healthy',
        cpuUsage: 0,
        memoryUsage: 0,
        activeDbConnections: 0,
        apiLatencyMs: 0,
        aiEngineStatus: 'online',
        lastBackupTimestamp: new Date().toISOString(),
      },
    };
  },
};
