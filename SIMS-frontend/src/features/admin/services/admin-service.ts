import { api } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { useAuthStore } from '@/features/auth/store';
import { academicService } from './academic-service';
import { examApiService } from './exam-api-service';

import type {
  AdminUser,
  StudentProfile,
  LecturerProfile,
  Department,
  Course,
  AdminExamOverview,
  AIGradingJob,
  AuditLog,
  SystemSettings,
  AdminDashboardStats,
  AdminNotification,
  AdminReportData,
  College,
  Program,
  AcademicYear,
  Semester,
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
}

// In-memory store for newly registered users during session
const registeredUsersCache: AdminUser[] = [];

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
function isValidUuid(id?: string | null): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export const adminService = {
  // ─── Users ─────────────────────────────────────────────────────────────────
  async getUsers(): Promise<AdminUser[]> {
    const list: AdminUser[] = [];
    const authUser = useAuthStore.getState().user;

    if (authUser) {
      const currentUser: AdminUser = {
        id: authUser.id,
        userId: authUser.id,
        firstName: authUser.firstName || 'User',
        lastName: authUser.lastName || '',
        email: authUser.email,
        role: (authUser.role ? authUser.role.toLowerCase() : 'admin') as any,
        department: '—',
        status: 'active',
        lastLogin: 'Active session',
        createdAt: authUser.createdAt || new Date().toISOString(),
      };
      list.push(currentUser);
    }

    list.push(...registeredUsersCache);

    const unique = Array.from(new Map(list.map((u) => [u.id, u])).values());
    return unique;
  },

  async createUser(data: RegisterUserPayload): Promise<AdminUser> {
    const roleUpper = data.role.toUpperCase() as 'STUDENT' | 'LECTURER' | 'ADMIN';

    // Build payload exactly matching UserRegisterRequest schema
    const payload: Record<string, any> = {
      email: data.email.trim(),
      password: data.password || 'Temp!Pass2026',
      first_name: data.first_name ? data.first_name.trim() : '',
      last_name: data.last_name ? data.last_name.trim() : '',
      role: roleUpper,
    };

    // Dynamic Role-Specific Fields
    if (roleUpper === 'STUDENT') {
      payload.student_identifier = data.student_identifier ? data.student_identifier.trim() : '';
      payload.department_id = data.department_id && isValidUuid(data.department_id) ? data.department_id : null;
    } else if (roleUpper === 'LECTURER') {
      payload.faculty_identifier = data.faculty_identifier ? data.faculty_identifier.trim() : '';
      payload.department_id = data.department_id && isValidUuid(data.department_id) ? data.department_id : null;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG] POST', API_ENDPOINTS.AUTH.REGISTER, payload);
    }

    try {
      const res = await api.post<any>(API_ENDPOINTS.AUTH.REGISTER, payload);

      if (process.env.NODE_ENV !== 'production') {
        console.log('[DEBUG] Registration Response 201:', res);
      }

      const registeredUser = res.user || res;

      // Resolve real department name from backend departments if department_id was provided
      let resolvedDepartment = 'Not assigned';
      if (data.department_id) {
        const depts = await academicService.getDepartments().catch(() => []);
        const found = depts.find((d) => d.id === data.department_id);
        if (found) {
          resolvedDepartment = found.name;
        }
      }

      const studentId = data.student_identifier || registeredUser.student_identifier || undefined;
      const facultyId = data.faculty_identifier || registeredUser.faculty_identifier || undefined;
      const displayUserId = studentId || facultyId || registeredUser.id;

      const newUser: AdminUser = {
        id: registeredUser.id || `usr-${Date.now()}`,
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

      registeredUsersCache.unshift(newUser);
      return newUser;
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[DEBUG] Registration Error:', error?.statusCode || error?.status, error?.errors || error?.message || error);
      }
      throw error;
    }
  },

  async updateUser(id: string, data: Partial<AdminUser>): Promise<AdminUser> {
    const index = registeredUsersCache.findIndex((u) => u.id === id);
    if (index !== -1) {
      registeredUsersCache[index] = { ...registeredUsersCache[index]!, ...data };
      return registeredUsersCache[index]!;
    }
    throw new Error('User not found in live session cache');
  },

  async deleteUser(id: string): Promise<void> {
    const index = registeredUsersCache.findIndex((u) => u.id === id);
    if (index !== -1) registeredUsersCache.splice(index, 1);
  },

  // ─── Colleges ───────────────────────────────────────────────────────────────
  async getColleges(): Promise<College[]> {
    return academicService.getColleges();
  },

  async createCollege(data: { name: string; code: string; university?: string }): Promise<College> {
    return academicService.createCollege(data);
  },

  async updateCollege(id: string, data: Partial<{ name: string; code: string }>): Promise<College> {
    return academicService.updateCollege(id, data);
  },

  async deleteCollege(id: string): Promise<void> {
    return academicService.deleteCollege(id);
  },

  // ─── Departments ───────────────────────────────────────────────────────────
  async getDepartments(): Promise<Department[]> {
    return academicService.getDepartments();
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

  async createSemester(data: { academic_year: string; semester_index: 'FIRST' | 'SECOND' }): Promise<Semester> {
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
          // Parse start and end years if in format YYYY/YYYY or YYYY-YYYY, fallback to default dates
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

  async updateSemester(id: string, data: Partial<{ semester_index: 'FIRST' | 'SECOND' }>): Promise<Semester> {
    return academicService.updateSemester(id, data);
  },

  async deleteSemester(id: string): Promise<void> {
    return academicService.deleteSemester(id);
  },

  // ─── Courses ───────────────────────────────────────────────────────────────
  async getCourses(): Promise<Course[]> {
    return academicService.getCourses();
  },

  async createCourse(data: { title: string; course_code: string; credit_hours: number; program?: string }): Promise<Course> {
    return academicService.createCourse(data);
  },

  async updateCourse(id: string, data: Partial<{ title: string; course_code: string; credit_hours: number }>): Promise<Course> {
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

  async deleteExam(id: string): Promise<void> {
    return examApiService.deleteExam(id);
  },

  // ─── Students & Lecturers ──────────────────────────────────────────────────
  async getStudents(): Promise<StudentProfile[]> {
    try {
      const raw = await api.get<any[]>(API_ENDPOINTS.ACADEMICS.ENROLLMENTS).catch(() => []);
      return raw.map((e) => ({
        id: e.id,
        studentId: e.student || `STD-${e.id.slice(0, 6)}`,
        firstName: e.student_name ? e.student_name.split(' ')[0] : 'Student',
        lastName: e.student_name ? e.student_name.split(' ')[1] || '' : '',
        email: e.student_email || `student.${e.id.slice(0, 4)}@aastu.edu.et`,
        department: e.course_offering_detail?.course_code ? 'Academic Dept' : 'General',
        program: 'B.Sc. Program',
        academicYear: 'Current Year',
        status: 'active',
        gpa: 3.5,
        enrolledCoursesCount: 1,
      }));
    } catch {
      return [];
    }
  },

  async getLecturers(): Promise<LecturerProfile[]> {
    try {
      const raw = await api.get<any[]>(API_ENDPOINTS.ACADEMICS.COURSE_OFFERINGS).catch(() => []);
      return raw.map((co) => ({
        id: co.id,
        lecturerId: `LEC-${co.id.slice(0, 6)}`,
        firstName: 'Faculty',
        lastName: 'Member',
        email: `faculty.${co.id.slice(0, 4)}@aastu.edu.et`,
        department: 'Academic Dept',
        office: 'Block 201',
        coursesAssigned: [co.course_detail?.course_code || 'Course'],
        status: 'active',
      }));
    } catch {
      return [];
    }
  },

  // ─── AI Jobs, Settings, Reports, Notifications ────────────────────────────
  async getAIGradingJobs(): Promise<AIGradingJob[]> {
    return [];
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

  async markNotificationRead(_id: string): Promise<void> {},

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [colleges, departments, programs, courses, academicYears, exams, students, lecturers, users] = await Promise.all([
      academicService.getColleges().catch(() => []),
      academicService.getDepartments().catch(() => []),
      academicService.getPrograms().catch(() => []),
      academicService.getCourses().catch(() => []),
      academicService.getAcademicYears().catch(() => []),
      examApiService.getExams().catch(() => []),
      this.getStudents().catch(() => []),
      this.getLecturers().catch(() => []),
      this.getUsers().catch(() => []),
    ]);

    return {
      totalStudents: students.length,
      totalLecturers: lecturers.length,
      totalAdministrators: users.filter((u) => u.role === 'admin').length || (users.length > 0 ? users.length : 1),
      totalCourses: courses.length,
      totalDepartments: departments.length,
      totalExams: exams.length,
      activeExams: exams.filter((e) => e.status === 'active').length,
      pendingAIGrading: 0,
      publishedResults: exams.filter((e) => e.status === 'published').length,
      systemHealth: {
        status: 'healthy',
        cpuUsage: 12,
        memoryUsage: 35,
        activeDbConnections: 6,
        apiLatencyMs: 28,
        aiEngineStatus: 'online',
        lastBackupTimestamp: new Date().toISOString(),
      },
    };
  },

  async getReportsData(): Promise<AdminReportData> {
    return {
      performanceTrends: [],
      departmentPassRates: [],
      aiGradingStats: [],
      systemUsage: [],
      gradeDistribution: [],
    };
  },
};
