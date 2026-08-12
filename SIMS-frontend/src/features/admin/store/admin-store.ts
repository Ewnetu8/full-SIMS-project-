import { create } from 'zustand';
import { INITIAL_SETTINGS } from '../mock';
import { adminService } from '../services/admin-service';

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

const defaultSettings: SystemSettings = INITIAL_SETTINGS;

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
  isLoadingData: boolean;

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

  // Actions
  fetchAdminData: () => Promise<void>;

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
  users: [],
  students: [],
  lecturers: [],
  departments: [],
  courses: [],
  exams: [],
  aiJobs: [],
  auditLogs: [],
  settings: defaultSettings,
  notifications: [],
  isLoadingData: false,

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

  fetchAdminData: async () => {
    set({ isLoadingData: true });
    try {
      const [departments, courses, exams, students] = await Promise.all([
        adminService.getDepartments(),
        adminService.getCourses(),
        adminService.getAllExams(),
        adminService.getStudents(),
      ]);

      set({
        departments,
        courses,
        exams,
        students,
        isLoadingData: false,
      });
    } catch {
      set({ isLoadingData: false });
    }
  },

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
      return {
        users: [newUser, ...state.users],
      };
    }),

  updateUser: (id, data) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
    })),

  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    })),

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
          ? { ...j, status: 'processing', errorReason: undefined, startedAt: new Date().toLocaleString() }
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
