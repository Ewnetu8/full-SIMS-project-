import { create } from 'zustand';

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
} from '../mock';

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
  AdminNotification,
} from '../types';


interface AdminStoreState {
  // Datasets
  users: AdminUser[];
  students: StudentProfile[];
  lecturers: LecturerProfile[];
  departments: Department[];
  courses: Course[];
  exams: AdminExamOverview[];
  aiJobs: AIGradingJob[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  notifications: AdminNotification[];

  // User filters & state
  userSearchQuery: string;
  userRoleFilter: string;
  userDeptFilter: string;
  userStatusFilter: string;

  // Student filters & state
  studentSearchQuery: string;
  studentDeptFilter: string;

  // Lecturer filters & state
  lecturerSearchQuery: string;
  lecturerDeptFilter: string;

  // Department search
  departmentSearchQuery: string;

  // Course search & filter
  courseSearchQuery: string;
  courseDeptFilter: string;

  // Exam search & filter
  examSearchQuery: string;
  examStatusFilter: string;

  // Audit logs search & filter
  auditSearchQuery: string;
  auditCategoryFilter: string;

  // Actions - Users
  setUsers: (users: AdminUser[]) => void;
  addUser: (user: Omit<AdminUser, 'id' | 'lastLogin' | 'createdAt'>) => void;
  updateUser: (id: string, data: Partial<AdminUser>) => void;
  deleteUser: (id: string) => void;
  setUserSearchQuery: (q: string) => void;
  setUserRoleFilter: (role: string) => void;
  setUserDeptFilter: (dept: string) => void;
  setUserStatusFilter: (status: string) => void;

  // Actions - Students & Lecturers
  setStudentSearchQuery: (q: string) => void;
  setStudentDeptFilter: (dept: string) => void;
  setLecturerSearchQuery: (q: string) => void;
  setLecturerDeptFilter: (dept: string) => void;

  // Actions - Departments
  setDepartmentSearchQuery: (q: string) => void;
  addDepartment: (dept: Omit<Department, 'id' | 'createdAt' | 'lecturerCount' | 'studentCount' | 'courseCount'>) => void;
  updateDepartment: (id: string, data: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  // Actions - Courses
  setCourseSearchQuery: (q: string) => void;
  setCourseDeptFilter: (dept: string) => void;
  addCourse: (course: Omit<Course, 'id' | 'studentCount'>) => void;
  updateCourse: (id: string, data: Partial<Course>) => void;
  toggleCourseArchive: (id: string) => void;

  // Actions - Exams
  setExamSearchQuery: (q: string) => void;
  setExamStatusFilter: (status: string) => void;
  archiveExam: (id: string) => void;
  deleteExam: (id: string) => void;

  // Actions - AI Jobs
  retryAIJob: (id: string) => void;

  // Actions - Settings & Notifications & Audit
  updateSettings: (settings: Partial<SystemSettings>) => void;
  setAuditSearchQuery: (q: string) => void;
  setAuditCategoryFilter: (cat: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

export const useAdminStore = create<AdminStoreState>((set) => ({
  users: INITIAL_USERS,
  students: INITIAL_STUDENTS,
  lecturers: INITIAL_LECTURERS,
  departments: INITIAL_DEPARTMENTS,
  courses: INITIAL_COURSES,
  exams: INITIAL_EXAMS,
  aiJobs: INITIAL_AI_JOBS,
  auditLogs: INITIAL_AUDIT_LOGS,
  settings: INITIAL_SETTINGS,
  notifications: INITIAL_NOTIFICATIONS,

  userSearchQuery: '',
  userRoleFilter: 'ALL',
  userDeptFilter: 'ALL',
  userStatusFilter: 'ALL',

  studentSearchQuery: '',
  studentDeptFilter: 'ALL',

  lecturerSearchQuery: '',
  lecturerDeptFilter: 'ALL',

  departmentSearchQuery: '',

  courseSearchQuery: '',
  courseDeptFilter: 'ALL',

  examSearchQuery: '',
  examStatusFilter: 'ALL',

  auditSearchQuery: '',
  auditCategoryFilter: 'ALL',

  // Actions - Users
  setUsers: (users) => set({ users }),
  addUser: (userData) =>
    set((state) => {
      const dateStr = new Date().toISOString().split('T')[0] || '';
      const newUser: AdminUser = {
        ...userData,
        id: `usr-${Date.now()}`,
        lastLogin: 'Never',
        createdAt: dateStr,
      };
      // Log event to audit logs as well
      const newAudit: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        actorName: 'Marcus Aurelius (Admin)',
        actorEmail: 'admin.marcus@university.edu',
        actorRole: 'admin',
        actionEvent: 'user.created',
        resourceType: 'User',
        resourceName: `${newUser.firstName} ${newUser.lastName} (${newUser.userId})`,
        ipAddress: '192.168.1.100',
        details: `Created user account with role '${newUser.role}' in department '${newUser.department}'.`,
      };
      return {
        users: [newUser, ...state.users],
        auditLogs: [newAudit, ...state.auditLogs],
      };
    }),

  updateUser: (id, data) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
    })),

  deleteUser: (id) =>
    set((state) => {
      const user = state.users.find((u) => u.id === id);
      const updatedUsers = state.users.filter((u) => u.id !== id);
      if (!user) return { users: updatedUsers };

      const newAudit: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        actorName: 'Marcus Aurelius (Admin)',
        actorEmail: 'admin.marcus@university.edu',
        actorRole: 'admin',
        actionEvent: 'user.deleted',
        resourceType: 'User',
        resourceName: `${user.firstName} ${user.lastName} (${user.userId})`,
        ipAddress: '192.168.1.100',
        details: `Deleted user record permanently from institution database.`,
      };
      return {
        users: updatedUsers,
        auditLogs: [newAudit, ...state.auditLogs],
      };
    }),

  setUserSearchQuery: (userSearchQuery) => set({ userSearchQuery }),
  setUserRoleFilter: (userRoleFilter) => set({ userRoleFilter }),
  setUserDeptFilter: (userDeptFilter) => set({ userDeptFilter }),
  setUserStatusFilter: (userStatusFilter) => set({ userStatusFilter }),

  // Actions - Students & Lecturers
  setStudentSearchQuery: (studentSearchQuery) => set({ studentSearchQuery }),
  setStudentDeptFilter: (studentDeptFilter) => set({ studentDeptFilter }),
  setLecturerSearchQuery: (lecturerSearchQuery) => set({ lecturerSearchQuery }),
  setLecturerDeptFilter: (lecturerDeptFilter) => set({ lecturerDeptFilter }),

  // Actions - Departments
  setDepartmentSearchQuery: (departmentSearchQuery) => set({ departmentSearchQuery }),
  addDepartment: (deptData) =>
    set((state) => {
      const dateStr = new Date().toISOString().split('T')[0] || '';
      const newDept: Department = {
        ...deptData,
        id: `dept-${Date.now()}`,
        lecturerCount: 0,
        studentCount: 0,
        courseCount: 0,
        createdAt: dateStr,
      };
      return { departments: [newDept, ...state.departments] };
    }),

  updateDepartment: (id, data) =>
    set((state) => ({
      departments: state.departments.map((d) => (d.id === id ? { ...d, ...data } : d)),
    })),

  deleteDepartment: (id) =>
    set((state) => ({
      departments: state.departments.filter((d) => d.id !== id),
    })),

  // Actions - Courses
  setCourseSearchQuery: (courseSearchQuery) => set({ courseSearchQuery }),
  setCourseDeptFilter: (courseDeptFilter) => set({ courseDeptFilter }),
  addCourse: (courseData) =>
    set((state) => {
      const newCourse: Course = {
        ...courseData,
        id: `crs-${Date.now()}`,
        studentCount: 0,
      };
      return { courses: [newCourse, ...state.courses] };
    }),

  updateCourse: (id, data) =>
    set((state) => ({
      courses: state.courses.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),

  toggleCourseArchive: (id) =>
    set((state) => ({
      courses: state.courses.map((c) =>
        c.id === id ? { ...c, status: c.status === 'active' ? 'archived' : 'active' } : c
      ),
    })),

  // Actions - Exams
  setExamSearchQuery: (examSearchQuery) => set({ examSearchQuery }),
  setExamStatusFilter: (examStatusFilter) => set({ examStatusFilter }),

  archiveExam: (id) =>
    set((state) => ({
      exams: state.exams.map((e) => (e.id === id ? { ...e, status: 'archived' } : e)),
    })),

  deleteExam: (id) =>
    set((state) => ({
      exams: state.exams.filter((e) => e.id !== id),
    })),

  // Actions - AI Jobs
  retryAIJob: (id) =>
    set((state) => ({
      aiJobs: state.aiJobs.map((j) =>
        j.id === id
          ? {
              ...j,
              status: 'processing',
              errorReason: undefined,
              startedAt: new Date().toLocaleString(),
            }
          : j
      ),
    })),

  // Actions - Settings & Notifications & Audit
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  setAuditSearchQuery: (auditSearchQuery) => set({ auditSearchQuery }),
  setAuditCategoryFilter: (auditCategoryFilter) => set({ auditCategoryFilter }),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
}));
