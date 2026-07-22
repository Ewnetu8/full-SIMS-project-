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
} from '../types';

import {
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_LECTURERS,
  INITIAL_DEPARTMENTS,
  INITIAL_COURSES,
  INITIAL_EXAMS,
  INITIAL_AI_JOBS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SETTINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_DASHBOARD_STATS,
  INITIAL_REPORT_DATA,
} from '../mock';

// Helper to simulate asynchronous API delay
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export const adminService = {
  // ─── Users ─────────────────────────────────────────────────────────────────
  async getUsers(): Promise<AdminUser[]> {
    await delay();
    return [...INITIAL_USERS];
  },

  async getUserById(id: string): Promise<AdminUser | null> {
    await delay();
    return INITIAL_USERS.find((u) => u.id === id) ?? null;
  },

  async createUser(data: Omit<AdminUser, 'id' | 'lastLogin' | 'createdAt'>): Promise<AdminUser> {
    await delay();
    const dateStr = new Date().toISOString().split('T')[0] || '';
    const newUser: AdminUser = {
      ...data,
      id: `usr-${Date.now()}`,
      lastLogin: 'Never',
      createdAt: dateStr,
    };
    INITIAL_USERS.unshift(newUser);
    return newUser;
  },

  async updateUser(id: string, data: Partial<AdminUser>): Promise<AdminUser> {
    await delay();
    const index = INITIAL_USERS.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('User not found');
    const existing = INITIAL_USERS[index]!;
    const updated: AdminUser = { ...existing, ...data };
    INITIAL_USERS[index] = updated;
    return updated;
  },

  async toggleUserStatus(id: string, status: AdminUser['status']): Promise<AdminUser> {
    return this.updateUser(id, { status });
  },

  async deleteUser(id: string): Promise<void> {
    await delay();
    const index = INITIAL_USERS.findIndex((u) => u.id === id);
    if (index !== -1) INITIAL_USERS.splice(index, 1);
  },

  // ─── Students ──────────────────────────────────────────────────────────────
  async getStudents(): Promise<StudentProfile[]> {
    await delay();
    return [...INITIAL_STUDENTS];
  },

  // ─── Lecturers ─────────────────────────────────────────────────────────────
  async getLecturers(): Promise<LecturerProfile[]> {
    await delay();
    return [...INITIAL_LECTURERS];
  },

  // ─── Departments ───────────────────────────────────────────────────────────
  async getDepartments(): Promise<Department[]> {
    await delay();
    return [...INITIAL_DEPARTMENTS];
  },

  async getDepartmentById(id: string): Promise<Department | null> {
    await delay();
    return INITIAL_DEPARTMENTS.find((d) => d.id === id) ?? null;
  },

  async createDepartment(data: Omit<Department, 'id' | 'createdAt' | 'lecturerCount' | 'studentCount' | 'courseCount'>): Promise<Department> {
    await delay();
    const dateStr = new Date().toISOString().split('T')[0] || '';
    const newDept: Department = {
      ...data,
      id: `dept-${Date.now()}`,
      lecturerCount: 0,
      studentCount: 0,
      courseCount: 0,
      createdAt: dateStr,
    };
    INITIAL_DEPARTMENTS.unshift(newDept);
    return newDept;
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    await delay();
    const index = INITIAL_DEPARTMENTS.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('Department not found');
    const existing = INITIAL_DEPARTMENTS[index]!;
    const updated: Department = { ...existing, ...data };
    INITIAL_DEPARTMENTS[index] = updated;
    return updated;
  },

  async deleteDepartment(id: string): Promise<void> {
    await delay();
    const index = INITIAL_DEPARTMENTS.findIndex((d) => d.id === id);
    if (index !== -1) INITIAL_DEPARTMENTS.splice(index, 1);
  },

  // ─── Courses ───────────────────────────────────────────────────────────────
  async getCourses(): Promise<Course[]> {
    await delay();
    return [...INITIAL_COURSES];
  },

  async createCourse(data: Omit<Course, 'id' | 'studentCount'>): Promise<Course> {
    await delay();
    const newCourse: Course = {
      ...data,
      id: `crs-${Date.now()}`,
      studentCount: 0,
    };
    INITIAL_COURSES.unshift(newCourse);
    return newCourse;
  },

  async updateCourse(id: string, data: Partial<Course>): Promise<Course> {
    await delay();
    const index = INITIAL_COURSES.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Course not found');
    const existing = INITIAL_COURSES[index]!;
    const updated: Course = { ...existing, ...data };
    INITIAL_COURSES[index] = updated;
    return updated;
  },

  async toggleCourseArchive(id: string): Promise<Course> {
    await delay();
    const course = INITIAL_COURSES.find((c) => c.id === id);
    if (!course) throw new Error('Course not found');
    course.status = course.status === 'active' ? 'archived' : 'active';
    return course;
  },

  // ─── Exams Overview ────────────────────────────────────────────────────────
  async getAllExams(): Promise<AdminExamOverview[]> {
    await delay();
    return [...INITIAL_EXAMS];
  },

  async archiveExam(id: string): Promise<AdminExamOverview> {
    await delay();
    const exam = INITIAL_EXAMS.find((e) => e.id === id);
    if (!exam) throw new Error('Exam not found');
    exam.status = 'archived';
    return exam;
  },

  async deleteExam(id: string): Promise<void> {
    await delay();
    const index = INITIAL_EXAMS.findIndex((e) => e.id === id);
    if (index !== -1) INITIAL_EXAMS.splice(index, 1);
  },

  // ─── AI Grading Monitor ────────────────────────────────────────────────────
  async getAIGradingJobs(): Promise<AIGradingJob[]> {
    await delay();
    return [...INITIAL_AI_JOBS];
  },

  async retryAIGradingJob(jobId: string): Promise<AIGradingJob> {
    await delay();
    const job = INITIAL_AI_JOBS.find((j) => j.id === jobId);
    if (!job) throw new Error('Job not found');
    job.status = 'processing';
    job.errorReason = undefined;
    job.startedAt = new Date().toLocaleString();
    return job;
  },

  // ─── Audit Logs ────────────────────────────────────────────────────────────
  async getAuditLogs(): Promise<AuditLog[]> {
    await delay();
    return [...INITIAL_AUDIT_LOGS];
  },

  // ─── System Settings ──────────────────────────────────────────────────────
  async getSettings(): Promise<SystemSettings> {
    await delay();
    return { ...INITIAL_SETTINGS };
  },

  async updateSettings(newSettings: Partial<SystemSettings>): Promise<SystemSettings> {
    await delay();
    Object.assign(INITIAL_SETTINGS, newSettings);
    return { ...INITIAL_SETTINGS };
  },

  // ─── Notifications & Stats ─────────────────────────────────────────────────
  async getNotifications(): Promise<AdminNotification[]> {
    await delay();
    return [...INITIAL_NOTIFICATIONS];
  },

  async markNotificationRead(id: string): Promise<void> {
    await delay();
    const notif = INITIAL_NOTIFICATIONS.find((n) => n.id === id);
    if (notif) notif.read = true;
  },

  async getDashboardStats(): Promise<AdminDashboardStats> {
    await delay();
    return { ...INITIAL_DASHBOARD_STATS };
  },

  async getReportsData(): Promise<AdminReportData> {
    await delay();
    return { ...INITIAL_REPORT_DATA };
  },
};
