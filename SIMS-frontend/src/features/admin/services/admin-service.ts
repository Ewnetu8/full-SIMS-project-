import { api } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants';
import { INITIAL_SETTINGS, INITIAL_REPORT_DATA } from '../mock';

import type {
  AdminUser,
  StudentProfile,
  LecturerProfile,
  Department,
  Course,
  College,
  Program,
  AcademicYearItem,
  SemesterItem,
  AdminCourseOffering,
  AdminExamOverview,
  AIGradingJob,
  AuditLog,
  SystemSettings,
  AdminDashboardStats,
  AdminNotification,
  AdminReportData,
} from '../types';

export const adminService = {
  // ─── Users ─────────────────────────────────────────────────────────────────
  async getUsers(): Promise<AdminUser[]> {
    return Promise.resolve([]);
  },

  async getUserById(_id: string): Promise<AdminUser | null> {
    return Promise.resolve(null);
  },

  async createUser(data: Omit<AdminUser, 'id' | 'lastLogin' | 'createdAt'>): Promise<AdminUser> {
    const dateStr = new Date().toISOString().split('T')[0] || '';
    return Promise.resolve({
      ...data,
      id: `usr-${Date.now()}`,
      lastLogin: 'Never',
      createdAt: dateStr,
    });
  },

  async updateUser(id: string, data: Partial<AdminUser>): Promise<AdminUser> {
    return Promise.resolve({
      id,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      role: data.role || 'student',
      department: data.department || '',
      status: data.status || 'active',
      userId: data.userId || id,
      lastLogin: 'Never',
      createdAt: new Date().toISOString().split('T')[0] || '',
      phone: data.phone,
    });
  },

  async toggleUserStatus(id: string, status: AdminUser['status']): Promise<AdminUser> {
    return this.updateUser(id, { status });
  },

  async deleteUser(_id: string): Promise<void> {
    return Promise.resolve();
  },

  // ─── Students ──────────────────────────────────────────────────────────────
  async getStudents(): Promise<StudentProfile[]> {
    try {
      const data = await api.get<any>(API_ENDPOINTS.ENROLLMENTS.ROOT);
      const list = Array.isArray(data) ? data : data?.results || [];
      return list.map((e: any) => ({
        id: e.id || String(Math.random()),
        studentId: e.student_id || e.student_detail?.student_id || 'STD-000',
        firstName: e.student_detail?.first_name || e.student_name?.split(' ')[0] || 'Student',
        lastName: e.student_detail?.last_name || e.student_name?.split(' ')[1] || '',
        email: e.student_detail?.email || e.email || 'student@aastu.edu.et',
        department: e.course_offering_detail?.department || 'Engineering',
        program: e.program || 'B.Sc.',
        gpa: e.gpa || 3.5,
        academicYear: e.academic_year || 'Year 2',
        enrolledCoursesCount: 1,
        status: 'active',
      }));
    } catch {
      return [];
    }
  },

  // ─── Lecturers ─────────────────────────────────────────────────────────────
  async getLecturers(): Promise<LecturerProfile[]> {
    return Promise.resolve([]);
  },

  // ─── Departments ───────────────────────────────────────────────────────────
  async getDepartments(): Promise<Department[]> {
    try {
      const data = await api.get<any>(API_ENDPOINTS.DEPARTMENTS.ROOT);
      const list = Array.isArray(data) ? data : data?.results || [];
      return list.map((d: any) => ({
        id: d.id || String(Math.random()),
        code: d.code || d.short_name || 'DEPT',
        name: d.name || d.title || 'Department',
        description: d.description || '',
        headOfDepartment: {
          id: d.hod_id || '',
          name: d.head_of_department || 'Unassigned',
          email: d.hod_email || '',
        },
        lecturerCount: d.lecturer_count || 0,
        studentCount: d.student_count || 0,
        courseCount: d.course_count || 0,
        createdAt: d.created_at ? String(d.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
      }));
    } catch {
      return [];
    }
  },

  async getDepartmentById(id: string): Promise<Department | null> {
    const depts = await this.getDepartments();
    return depts.find((d) => d.id === id) ?? null;
  },

  async createDepartment(data: Omit<Department, 'id' | 'createdAt' | 'lecturerCount' | 'studentCount' | 'courseCount'> & { college?: string }): Promise<Department> {
    try {
      const created = await api.post<any>(API_ENDPOINTS.DEPARTMENTS.ROOT, {
        college: data.college || '00000000-0000-0000-0000-000000000000',
        name: data.name,
        code: data.code,
      });
      return {
        id: created.id || `dept-${Date.now()}`,
        code: created.code || data.code,
        name: created.name || data.name,
        description: created.description || data.description,
        headOfDepartment: {
          id: data.headOfDepartment?.id || '',
          name: data.headOfDepartment?.name || 'Unassigned',
          email: data.headOfDepartment?.email || '',
        },
        lecturerCount: 0,
        studentCount: 0,
        courseCount: 0,
        createdAt: new Date().toISOString().split('T')[0] || '',
      };
    } catch {
      return {
        ...data,
        id: `dept-${Date.now()}`,
        lecturerCount: 0,
        studentCount: 0,
        courseCount: 0,
        createdAt: new Date().toISOString().split('T')[0] || '',
      };
    }
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    return Promise.resolve({
      id,
      code: data.code || 'DEPT',
      name: data.name || 'Department',
      description: data.description || '',
      headOfDepartment: data.headOfDepartment || { id: '', name: 'Unassigned', email: '' },
      lecturerCount: data.lecturerCount || 0,
      studentCount: data.studentCount || 0,
      courseCount: data.courseCount || 0,
      createdAt: data.createdAt || new Date().toISOString().split('T')[0] || '',
    });
  },

  async deleteDepartment(_id: string): Promise<void> {
    return Promise.resolve();
  },

  // ─── Courses ───────────────────────────────────────────────────────────────
  async getCourses(): Promise<Course[]> {
    try {
      const data = await api.get<any>(API_ENDPOINTS.COURSES.ROOT);
      const list = Array.isArray(data) ? data : data?.results || [];
      return list.map((c: any) => ({
        id: c.id || String(Math.random()),
        code: c.course_code || c.code || 'CRS',
        name: c.title || c.name || 'Course',
        department: c.department_detail?.name || c.department || 'General',
        creditHours: c.credit_hours || c.credits || 3,
        assignedLecturer: {
          id: c.lecturer_id || '',
          name: c.lecturer_name || 'Faculty Member',
        },
        studentCount: c.student_count || 0,
        semester: c.semester_detail?.name || c.semester || 'Semester 1',
        status: c.is_active !== false ? 'active' : 'archived',
      }));
    } catch {
      return [];
    }
  },

  async createCourse(data: Omit<Course, 'id' | 'studentCount'> & { programId?: string }): Promise<Course> {
    try {
      const created = await api.post<any>(API_ENDPOINTS.COURSES.ROOT, {
        program: data.programId || '00000000-0000-0000-0000-000000000000',
        title: data.name,
        course_code: data.code,
        credit_hours: Number(data.creditHours),
      });
      return {
        id: created.id || `crs-${Date.now()}`,
        code: created.course_code || data.code,
        name: created.title || data.name,
        department: data.department || 'General',
        creditHours: created.credit_hours || data.creditHours,
        assignedLecturer: data.assignedLecturer || { id: '', name: 'Faculty Member' },
        studentCount: 0,
        semester: data.semester || 'Semester 1',
        status: 'active',
      };
    } catch {
      return {
        ...data,
        id: `crs-${Date.now()}`,
        studentCount: 0,
      };
    }
  },

  async updateCourse(id: string, data: Partial<Course>): Promise<Course> {
    return Promise.resolve({
      id,
      code: data.code || 'CRS',
      name: data.name || 'Course',
      department: data.department || 'General',
      creditHours: data.creditHours || 3,
      assignedLecturer: data.assignedLecturer || { id: '', name: 'Faculty Member' },
      studentCount: data.studentCount || 0,
      semester: data.semester || 'Semester 1',
      status: data.status || 'active',
    });
  },

  async toggleCourseArchive(id: string): Promise<Course> {
    const courses = await this.getCourses();
    const course = courses.find((c) => c.id === id);
    if (!course) throw new Error('Course not found');
    course.status = course.status === 'active' ? 'archived' : 'active';
    return course;
  },

  // ─── Exams Overview ────────────────────────────────────────────────────────
  async getAllExams(): Promise<AdminExamOverview[]> {
    try {
      const data = await api.get<any>(API_ENDPOINTS.EXAMS.ROOT);
      const list = Array.isArray(data) ? data : data?.results || [];
      return list.map((e: any) => ({
        id: e.id || String(Math.random()),
        title: e.title || 'Examination',
        courseCode: e.course_offering_detail?.course_code || e.course_code || 'EXAM',
        courseName: e.course_offering_detail?.course_title || e.course_title || 'Assessment',
        department: e.department || 'Academic Department',
        lecturerName: e.created_by_detail?.full_name || e.lecturer_name || 'Examiner',
        status: String(e.status || 'DRAFT').toLowerCase() as any,
        startDate: e.start_time || e.start_date || 'Scheduled',
        endDate: e.end_time || e.end_date || 'Scheduled',
        durationMinutes: e.duration_minutes || e.duration || 60,
        participatedStudents: e.submission_count || 0,
        totalStudents: e.total_enrolled || 0,
      }));
    } catch {
      return [];
    }
  },

  async archiveExam(id: string): Promise<AdminExamOverview> {
    const exams = await this.getAllExams();
    const exam = exams.find((e) => e.id === id);
    if (!exam) throw new Error('Exam not found');
    exam.status = 'archived';
    return exam;
  },

  async deleteExam(_id: string): Promise<void> {
    return Promise.resolve();
  },

  // ─── AI Grading Monitor ────────────────────────────────────────────────────
  async getAIGradingJobs(): Promise<AIGradingJob[]> {
    return Promise.resolve([]);
  },

  async retryAIGradingJob(jobId: string): Promise<AIGradingJob> {
    return Promise.resolve({
      id: jobId,
      examId: 'exam-1',
      examTitle: 'Examination',
      courseName: 'Course',
      department: 'Engineering',
      status: 'processing',
      totalSubmissions: 0,
      processedSubmissions: 0,
      startedAt: new Date().toLocaleString(),
    });
  },

  // ─── Audit Logs ────────────────────────────────────────────────────────────
  async getAuditLogs(): Promise<AuditLog[]> {
    return Promise.resolve([]);
  },

  // ─── System Settings ──────────────────────────────────────────────────────
  async getSettings(): Promise<SystemSettings> {
    return Promise.resolve(INITIAL_SETTINGS);
  },

  async updateSettings(newSettings: Partial<SystemSettings>): Promise<SystemSettings> {
    const current = await this.getSettings();
    return Promise.resolve({ ...current, ...newSettings });
  },

  // ─── Notifications & Stats ─────────────────────────────────────────────────
  async getNotifications(): Promise<AdminNotification[]> {
    return Promise.resolve([]);
  },

  async markNotificationRead(_id: string): Promise<void> {
    return Promise.resolve();
  },

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [users, students, lecturers, depts, courses, exams, aiJobs] = await Promise.all([
      this.getUsers(),
      this.getStudents(),
      this.getLecturers(),
      this.getDepartments(),
      this.getCourses(),
      this.getAllExams(),
      this.getAIGradingJobs(),
    ]);

    return {
      totalStudents: students.length,
      totalLecturers: lecturers.length,
      totalAdministrators: users.filter((u) => u.role === 'admin').length,
      totalCourses: courses.length,
      totalDepartments: depts.length,
      totalExams: exams.length,
      activeExams: exams.filter((e) => e.status === 'published' || e.status === 'active').length,
      pendingAIGrading: aiJobs.filter((j) => j.status === 'processing' || j.status === 'pending').length,
      publishedResults: exams.filter((e) => e.status === 'published').length,
      systemHealth: {
        status: 'healthy',
        cpuUsage: 25.0,
        memoryUsage: 45.0,
        activeDbConnections: 12,
        apiLatencyMs: 15,
        aiEngineStatus: 'online',
        lastBackupTimestamp: new Date().toISOString(),
      },
    };
  },

  async getReportsData(): Promise<AdminReportData> {
    return Promise.resolve({
      performanceTrends: [],
      departmentPassRates: [],
      aiGradingStats: [],
      systemUsage: [],
      gradeDistribution: [],
    });
  },

  // ─── Academic Structure (Colleges, Programs, Academic Years, Semesters) ───
  async getColleges(): Promise<College[]> {
    try {
      const data = await api.get<any>(API_ENDPOINTS.ACADEMICS.COLLEGES);
      const list = Array.isArray(data) ? data : data?.results || [];
      return list.map((c: any) => ({
        id: c.id || String(Math.random()),
        name: c.name || 'College',
        code: c.code || 'COL',
        university: c.university || '',
        createdAt: c.created_at ? String(c.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
      }));
    } catch {
      return [];
    }
  },

  async createCollege(data: { name: string; code: string; university?: string }): Promise<College> {
    const created = await api.post<any>(API_ENDPOINTS.ACADEMICS.COLLEGES, {
      name: data.name,
      code: data.code.toUpperCase(),
      university: data.university || '00000000-0000-0000-0000-000000000000',
    });
    return {
      id: created.id || `col-${Date.now()}`,
      name: created.name || data.name,
      code: created.code || data.code,
      university: created.university,
      createdAt: new Date().toISOString().split('T')[0],
    };
  },

  async updateCollege(id: string, data: Partial<College>): Promise<College> {
    const updated = await api.patch<any>(API_ENDPOINTS.ACADEMICS.COLLEGE_BY_ID(id), {
      ...(data.name ? { name: data.name } : {}),
      ...(data.code ? { code: data.code.toUpperCase() } : {}),
    });
    return {
      id,
      name: updated.name || data.name || 'College',
      code: updated.code || data.code || 'COL',
    };
  },

  async deleteCollege(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.ACADEMICS.COLLEGE_BY_ID(id));
  },

  async getPrograms(): Promise<Program[]> {
    try {
      const data = await api.get<any>(API_ENDPOINTS.PROGRAMS.ROOT);
      const list = Array.isArray(data) ? data : data?.results || [];
      return list.map((p: any) => ({
        id: p.id || String(Math.random()),
        name: p.name || 'Program',
        code: p.code || 'PRG',
        department: p.department || p.department_detail?.name || '',
        degreeLevel: p.degree_level || 'B.Sc.',
        totalCreditHoursRequired: p.total_credit_hours_required || 120,
        createdAt: p.created_at ? String(p.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
      }));
    } catch {
      return [];
    }
  },

  async createProgram(data: { department: string; name: string; code: string; degreeLevel: string; totalCreditHoursRequired: number }): Promise<Program> {
    const created = await api.post<any>(API_ENDPOINTS.PROGRAMS.ROOT, {
      department: data.department,
      name: data.name,
      code: data.code.toUpperCase(),
      degree_level: data.degreeLevel,
      total_credit_hours_required: Number(data.totalCreditHoursRequired),
    });
    return {
      id: created.id || `prg-${Date.now()}`,
      name: created.name || data.name,
      code: created.code || data.code,
      department: created.department || data.department,
      degreeLevel: created.degree_level || data.degreeLevel,
      totalCreditHoursRequired: created.total_credit_hours_required || data.totalCreditHoursRequired,
      createdAt: new Date().toISOString().split('T')[0],
    };
  },

  async updateProgram(id: string, data: Partial<Program>): Promise<Program> {
    const updated = await api.patch<any>(API_ENDPOINTS.PROGRAMS.BY_ID(id), {
      ...(data.name ? { name: data.name } : {}),
      ...(data.code ? { code: data.code.toUpperCase() } : {}),
      ...(data.degreeLevel ? { degree_level: data.degreeLevel } : {}),
      ...(data.totalCreditHoursRequired ? { total_credit_hours_required: Number(data.totalCreditHoursRequired) } : {}),
    });
    return {
      id,
      name: updated.name || data.name || 'Program',
      code: updated.code || data.code || 'PRG',
      department: updated.department || data.department || '',
      degreeLevel: updated.degree_level || data.degreeLevel || 'B.Sc.',
      totalCreditHoursRequired: updated.total_credit_hours_required || data.totalCreditHoursRequired || 120,
    };
  },

  async deleteProgram(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.PROGRAMS.BY_ID(id));
  },

  async getAcademicYears(): Promise<AcademicYearItem[]> {
    try {
      const data = await api.get<any>(API_ENDPOINTS.ACADEMIC_YEARS.ROOT);
      const list = Array.isArray(data) ? data : data?.results || [];
      return list.map((y: any) => ({
        id: y.id || String(Math.random()),
        displayLabel: y.display_label || '2025/2026',
        startBoundary: y.start_boundary || '2025-09-01',
        endBoundary: y.end_boundary || '2026-06-30',
        createdAt: y.created_at ? String(y.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
      }));
    } catch {
      return [];
    }
  },

  async createAcademicYear(data: { displayLabel: string; startBoundary: string; endBoundary: string }): Promise<AcademicYearItem> {
    const created = await api.post<any>(API_ENDPOINTS.ACADEMIC_YEARS.ROOT, {
      display_label: data.displayLabel,
      start_boundary: data.startBoundary,
      end_boundary: data.endBoundary,
    });
    return {
      id: created.id || `ay-${Date.now()}`,
      displayLabel: created.display_label || data.displayLabel,
      startBoundary: created.start_boundary || data.startBoundary,
      endBoundary: created.end_boundary || data.endBoundary,
      createdAt: new Date().toISOString().split('T')[0],
    };
  },

  async updateAcademicYear(id: string, data: Partial<AcademicYearItem>): Promise<AcademicYearItem> {
    const updated = await api.patch<any>(API_ENDPOINTS.ACADEMIC_YEARS.BY_ID(id), {
      ...(data.displayLabel ? { display_label: data.displayLabel } : {}),
      ...(data.startBoundary ? { start_boundary: data.startBoundary } : {}),
      ...(data.endBoundary ? { end_boundary: data.endBoundary } : {}),
    });
    return {
      id,
      displayLabel: updated.display_label || data.displayLabel || '2025/2026',
      startBoundary: updated.start_boundary || data.startBoundary || '2025-09-01',
      endBoundary: updated.end_boundary || data.endBoundary || '2026-06-30',
    };
  },

  async deleteAcademicYear(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.ACADEMIC_YEARS.BY_ID(id));
  },

  async getSemesters(): Promise<SemesterItem[]> {
    try {
      const data = await api.get<any>(API_ENDPOINTS.SEMESTERS.ROOT);
      const list = Array.isArray(data) ? data : data?.results || [];
      return list.map((s: any) => ({
        id: s.id || String(Math.random()),
        academicYear: s.academic_year || '',
        academicYearLabel: s.academic_year_detail?.display_label || '2025/2026',
        semesterIndex: s.semester_index || 1,
        createdAt: s.created_at ? String(s.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
      }));
    } catch {
      return [];
    }
  },

  async createSemester(data: { academicYear: string; semesterIndex: number }): Promise<SemesterItem> {
    const created = await api.post<any>(API_ENDPOINTS.SEMESTERS.ROOT, {
      academic_year: data.academicYear,
      semester_index: Number(data.semesterIndex),
    });
    return {
      id: created.id || `sem-${Date.now()}`,
      academicYear: created.academic_year || data.academicYear,
      semesterIndex: created.semester_index || data.semesterIndex,
      createdAt: new Date().toISOString().split('T')[0],
    };
  },

  async updateSemester(id: string, data: Partial<SemesterItem>): Promise<SemesterItem> {
    const updated = await api.patch<any>(API_ENDPOINTS.SEMESTERS.BY_ID(id), {
      ...(data.semesterIndex ? { semester_index: Number(data.semesterIndex) } : {}),
    });
    return {
      id,
      academicYear: updated.academic_year || data.academicYear || '',
      semesterIndex: updated.semester_index || data.semesterIndex || 1,
    };
  },

  async deleteSemester(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.SEMESTERS.BY_ID(id));
  },

  async getCourseOfferings(): Promise<AdminCourseOffering[]> {
    try {
      const data = await api.get<any>(API_ENDPOINTS.COURSE_OFFERINGS.ROOT);
      const list = Array.isArray(data) ? data : data?.results || [];
      return list.map((co: any) => ({
        id: co.id || String(Math.random()),
        course: co.course || '',
        courseCode: co.course_detail?.course_code || 'CRS',
        courseTitle: co.course_detail?.title || 'Course Offering',
        semester: co.semester || '',
        semesterLabel: co.semester_detail?.academic_year_detail?.display_label || 'Semester 1',
        section: co.section || 'Sec 01',
        capacity: co.capacity || 40,
        createdAt: co.created_at ? String(co.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
      }));
    } catch {
      return [];
    }
  },

  async createCourseOffering(data: { course: string; semester: string; section: string; capacity: number }): Promise<AdminCourseOffering> {
    const created = await api.post<any>(API_ENDPOINTS.COURSE_OFFERINGS.ROOT, {
      course: data.course,
      semester: data.semester,
      section: data.section,
      capacity: Number(data.capacity),
    });
    return {
      id: created.id || `co-${Date.now()}`,
      course: created.course || data.course,
      semester: created.semester || data.semester,
      section: created.section || data.section,
      capacity: created.capacity || data.capacity,
      createdAt: new Date().toISOString().split('T')[0],
    };
  },

  async deleteCourseOffering(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.COURSE_OFFERINGS.BY_ID(id));
  },

  async batchImportEnrollments(file: File): Promise<{ message?: string; imported_count?: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<any>(API_ENDPOINTS.ACADEMICS.BATCH_ENROLLMENT_IMPORT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res;
  },
};
