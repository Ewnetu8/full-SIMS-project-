import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { isValidUuid } from '@/lib/user-identifier';
import { api } from '@/services/api-client';

import { academicService } from './academic-service';
import { examApiService } from './exam-api-service';

import type {
  AdminUser,
  StudentProfile,
  LecturerProfile,
  Department,
  Course,
  College,
  Program,
  AcademicYear,
  Semester,
  AdminExamOverview,
  AIGradingJob,
  AuditLog,
  SystemSettings,
  AdminDashboardStats,
  AdminNotification,
} from '../types';

export interface RegisterUserPayload {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  role: 'STUDENT' | 'LECTURER' | 'ADMIN';
  student_identifier?: string;
  faculty_identifier?: string;
  department_id?: string | null;
  national_id_fan?: string | null;
}

export const adminService = {
  // ─── Users ─────────────────────────────────────────────────────────────────
  /**
   * Returns user accounts.
   * Note: The backend SIMS REST API specification does not currently provide a user listing endpoint (GET /api/v1/users).
   * Returns an empty array to prevent 404 errors, repeated network requests, and displaying fabricated mock data.
   */
  async getUsers(): Promise<AdminUser[]> {
    return [];
  },

  async getUserById(_id: string): Promise<AdminUser | null> {
    return null;
  },

  async createUser(data: RegisterUserPayload): Promise<AdminUser> {
    const roleUpper = data.role.toUpperCase() as 'STUDENT' | 'LECTURER' | 'ADMIN';

    const payload: Record<string, any> = {
      email: data.email.trim(),
      password: data.password || 'Temp!Pass2026',
      first_name: data.first_name ? data.first_name.trim() : '',
      last_name: data.last_name ? data.last_name.trim() : '',
      role: roleUpper,
      national_id_fan: data.national_id_fan ? data.national_id_fan.trim() : null,
    };

    if (roleUpper === 'STUDENT') {
      payload.student_identifier = data.student_identifier ? data.student_identifier.trim() : '';
      payload.department_id = data.department_id && isValidUuid(data.department_id) ? data.department_id : null;
    } else if (roleUpper === 'LECTURER') {
      payload.faculty_identifier = data.faculty_identifier ? data.faculty_identifier.trim() : '';
      payload.department_id = data.department_id && isValidUuid(data.department_id) ? data.department_id : null;
    }

    try {
      const res = await api.post<any>(API_ENDPOINTS.AUTH.REGISTER, payload);
      const registeredUser = res.user || res;

      let resolvedDepartment = 'Not assigned';
      if (data.department_id) {
        const depts = await academicService.getDepartments().catch(() => []);
        const found = depts.find((d) => d.id === data.department_id);
        if (found) {
          resolvedDepartment = found.name;
        }
      }

      const rawStudentId = data.student_identifier || registeredUser.student_identifier;
      const studentId = rawStudentId && !isValidUuid(rawStudentId) ? String(rawStudentId).trim() : undefined;

      const rawFacultyId = data.faculty_identifier || registeredUser.faculty_identifier;
      const facultyId = rawFacultyId && !isValidUuid(rawFacultyId) ? String(rawFacultyId).trim() : undefined;

      const displayUserId = studentId || facultyId || registeredUser.id;

      const newUser: AdminUser = {
        id: registeredUser.id,
        userId: displayUserId,
        firstName: registeredUser.first_name || data.first_name,
        lastName: registeredUser.last_name || data.last_name,
        email: registeredUser.email || data.email,
        role: (registeredUser.role ? registeredUser.role.toLowerCase() : data.role.toLowerCase()) as any,
        department: resolvedDepartment,
        status: 'active',
        lastLogin: 'Never',
        studentIdentifier: studentId,
        facultyIdentifier: facultyId,
        createdAt: registeredUser.created_at || new Date().toISOString(),
      };

      return newUser;
    } catch (error: any) {
      throw error;
    }
  },

  async updateUser(id: string, data: Partial<AdminUser>): Promise<AdminUser> {
    const res = await api.patch<any>(API_ENDPOINTS.USERS.BY_ID(id), data);
    return {
      id: res?.id || id,
      userId: res?.student_identifier || res?.faculty_identifier || data.userId || id,
      firstName: res?.first_name || data.firstName || '',
      lastName: res?.last_name || data.lastName || '',
      email: res?.email || data.email || '',
      role: (res?.role ? String(res.role).toLowerCase() : data.role || 'student') as any,
      department: res?.department || data.department || '',
      status: res?.is_active === false || data.status === 'inactive' ? 'inactive' : 'active',
      lastLogin: res?.last_login ? new Date(res.last_login).toLocaleString() : (data.lastLogin || 'Never'),
      createdAt: res?.created_at || data.createdAt || new Date().toISOString(),
    };
  },

  async toggleUserStatus(id: string, status: AdminUser['status']): Promise<AdminUser> {
    return this.updateUser(id, { status });
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.USERS.BY_ID(id));
  },

  // ─── Universities ───────────────────────────────────────────────────────────
  async getUniversities(): Promise<Array<{ id: string; name: string; code: string }>> {
    return academicService.getUniversities();
  },

  // ─── Colleges ───────────────────────────────────────────────────────────────
  async getColleges(): Promise<College[]> {
    return academicService.getColleges();
  },

  async createCollege(data: { name: string; code: string; university?: string }): Promise<College> {
    return academicService.createCollege(data);
  },

  async updateCollege(id: string, data: Partial<{ name: string; code: string; university?: string }>): Promise<College> {
    return academicService.updateCollege(id, data);
  },

  async deleteCollege(id: string): Promise<void> {
    return academicService.deleteCollege(id);
  },

  // ─── Departments ───────────────────────────────────────────────────────────
  async getDepartments(): Promise<Department[]> {
    return academicService.getDepartments();
  },

  async getDepartmentById(id: string): Promise<Department | null> {
    const depts = await this.getDepartments();
    return depts.find((d) => d.id === id) ?? null;
  },

  async createDepartment(data: { name: string; code: string; college?: string }): Promise<Department> {
    return academicService.createDepartment(data);
  },

  async updateDepartment(id: string, data: Partial<{ name: string; code: string; college?: string }>): Promise<Department> {
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

  async createSemester(data: { academic_year: string; semester_index: 'FIRST' | 'SECOND' | 'SUMMER' }): Promise<Semester> {
    let yearId = data.academic_year;
    let displayLabel = data.academic_year;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.academic_year);

    if (!isUuid) {
      try {
        const years = await academicService.getAcademicYears();
        const trimmedInput = data.academic_year.toLowerCase().trim();
        const existing = years.find((y) => y.displayLabel.toLowerCase().trim() === trimmedInput);

        if (existing) {
          yearId = existing.id;
          displayLabel = existing.displayLabel;
        } else {
          const yearsMatch = data.academic_year.match(/(\d{4})[/-](\d{4})/);
          const startYear = yearsMatch ? yearsMatch[1] : '2025';
          const endYear = yearsMatch ? yearsMatch[2] : '2026';

          const newYear = await academicService.createAcademicYear({
            display_label: data.academic_year,
            start_boundary: `${startYear}-09-01`,
            end_boundary: `${endYear}-06-30`,
          });
          yearId = newYear.id;
          displayLabel = newYear.displayLabel;
        }
      } catch (err) {
        console.error('Failed to resolve academic year:', err);
      }
    } else {
      try {
        const years = await academicService.getAcademicYears();
        const existing = years.find((y) => y.id === yearId);
        if (existing) {
          displayLabel = existing.displayLabel;
        }
      } catch (err) {
        console.error('Failed to fetch academic year label:', err);
      }
    }

    const createdSem = await academicService.createSemester({
      academic_year: yearId,
      semester_index: data.semester_index,
    });

    if (!createdSem.academicYearDetail) {
      createdSem.academicYearDetail = {
        id: yearId,
        displayLabel: displayLabel,
        startBoundary: '',
        endBoundary: '',
      };
    }

    return createdSem;
  },

  async updateSemester(id: string, data: Partial<{ semester_index: 'FIRST' | 'SECOND' | 'SUMMER' }>): Promise<Semester> {
    return academicService.updateSemester(id, data);
  },

  async deleteSemester(id: string): Promise<void> {
    return academicService.deleteSemester(id);
  },

  // ─── Courses ───────────────────────────────────────────────────────────────
  async getCourses(): Promise<Course[]> {
    return academicService.getCourses();
  },

  async createCourse(data: { title: string; course_code: string; credit_hours: number; program?: string; intended_class_standing?: string }): Promise<Course> {
    return academicService.createCourse(data);
  },

  async updateCourse(id: string, data: Partial<{ title: string; course_code: string; credit_hours: number }>): Promise<Course> {
    return academicService.updateCourse(id, data);
  },

  async deleteCourse(id: string): Promise<void> {
    return academicService.deleteCourse(id);
  },

  async toggleCourseArchive(id: string): Promise<Course> {
    const courses = await this.getCourses();
    const course = courses.find((c) => c.id === id);
    if (!course) throw new Error('Course not found');
    course.status = course.status === 'active' ? 'archived' : 'active';
    return course;
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

  // ─── Students & Lecturers ──────────────────────────────────────────────────
  async getStudents(): Promise<StudentProfile[]> {
    try {
      const data = await api.get<any>(API_ENDPOINTS.ENROLLMENTS.ROOT).catch(() => []);
      const list = Array.isArray(data) ? data : data?.results || [];
      return list.map((e: any) => ({
        id: e.id,
        studentId: e.student_id || e.student_detail?.student_id || e.student || 'Not assigned',
        firstName: e.student_detail?.first_name || (e.student_name ? e.student_name.split(' ')[0] : 'Student'),
        lastName: e.student_detail?.last_name || (e.student_name ? e.student_name.split(' ').slice(1).join(' ') : ''),
        email: e.student_detail?.email || e.student_email || '—',
        department: e.course_offering_detail?.course_detail?.program_detail?.department_detail?.name || e.course_offering_detail?.department || 'Not assigned',
        program: e.course_offering_detail?.course_detail?.program_detail?.name || '—',
        gpa: e.gpa ?? 0,
        academicYear: e.course_offering_detail?.semester_detail?.academic_year_detail?.display_label || '—',
        enrolledCoursesCount: 1,
        status: e.status === 'ENROLLED' ? 'active' : (e.status ? e.status.toLowerCase() : 'active'),
      }));
    } catch {
      return [];
    }
  },

  async batchImportEnrollments(file: File): Promise<{ message?: string; imported_count?: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(API_ENDPOINTS.ENROLLMENTS.BATCH_IMPORT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Returns lecturer profiles.
   * Currently, the backend does not provide a dedicated lecturer directory endpoint.
   * Returns empty array to prevent displaying fabricated mock data.
   */
  async getLecturers(): Promise<LecturerProfile[]> {
    return [];
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
      totalAdministrators: users.filter((u) => u.role === 'admin').length,
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
