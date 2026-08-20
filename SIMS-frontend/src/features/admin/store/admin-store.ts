import { create } from 'zustand';

import { getUserFriendlyErrorMessage } from '@/lib/errors';
import { adminService, type RegisterUserPayload } from '../services/admin-service';

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
  College,
  Program,
  AcademicYear,
  Semester,
} from '../types';

interface AdminStoreState {
  // Datasets
  users: AdminUser[];
  students: StudentProfile[];
  lecturers: LecturerProfile[];
  colleges: College[];
  departments: Department[];
  programs: Program[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  courses: Course[];
  exams: AdminExamOverview[];
  aiJobs: AIGradingJob[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  notifications: AdminNotification[];
  isLoadingData: boolean;

  // Loading states
  isLoadingUsers: boolean;
  usersError: string | null;
  isLoadingColleges: boolean;
  isLoadingDepartments: boolean;
  departmentsError: string | null;
  isLoadingPrograms: boolean;
  isLoadingAcademicYears: boolean;
  isLoadingSemesters: boolean;
  isLoadingCourses: boolean;
  isLoadingExams: boolean;

  // Search & Filter States
  userSearchQuery: string;
  userRoleFilter: string;
  userDeptFilter: string;
  userStatusFilter: string;

  studentSearchQuery: string;
  studentDeptFilter: string;

  lecturerSearchQuery: string;
  lecturerDeptFilter: string;

  collegeSearchQuery: string;
  departmentSearchQuery: string;
  programSearchQuery: string;
  academicYearSearchQuery: string;
  semesterSearchQuery: string;

  courseSearchQuery: string;
  courseDeptFilter: string;

  examSearchQuery: string;
  examStatusFilter: string;

  auditSearchQuery: string;
  auditCategoryFilter: string;

  // Fetch Actions
  fetchAdminData: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchStudents: () => Promise<void>;
  fetchLecturers: () => Promise<void>;
  fetchColleges: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
  fetchPrograms: () => Promise<void>;
  fetchAcademicYears: () => Promise<void>;
  fetchSemesters: () => Promise<void>;
  fetchCourses: () => Promise<void>;
  fetchExams: () => Promise<void>;

  // Actions - Users
  setUsers: (users: AdminUser[]) => void;
  addUser: (user: RegisterUserPayload) => Promise<AdminUser>;
  updateUser: (id: string, data: Partial<AdminUser>) => Promise<AdminUser>;
  deleteUser: (id: string) => Promise<void>;
  setUserSearchQuery: (q: string) => void;
  setUserRoleFilter: (role: string) => void;
  setUserDeptFilter: (dept: string) => void;
  setUserStatusFilter: (status: string) => void;

  // Actions - Colleges
  setCollegeSearchQuery: (q: string) => void;
  addCollege: (data: { name: string; code: string; university?: string }) => Promise<College>;
  updateCollege: (id: string, data: Partial<{ name: string; code: string }>) => Promise<College>;
  deleteCollege: (id: string) => Promise<void>;

  // Actions - Departments
  setDepartmentSearchQuery: (q: string) => void;
  addDepartment: (data: { name: string; code: string; college?: string }) => Promise<Department>;
  updateDepartment: (id: string, data: Partial<{ name: string; code: string; college?: string }>) => Promise<Department>;
  deleteDepartment: (id: string) => Promise<void>;

  // Actions - Programs
  setProgramSearchQuery: (q: string) => void;
  addProgram: (data: { department: string; name: string; code: string; degree_level?: string; total_credit_hours_required?: number }) => Promise<Program>;
  updateProgram: (id: string, data: Partial<{ department?: string; name: string; code: string; degree_level?: string; total_credit_hours_required?: number }>) => Promise<Program>;
  deleteProgram: (id: string) => Promise<void>;

  // Actions - Academic Years
  setAcademicYearSearchQuery: (q: string) => void;
  addAcademicYear: (data: { display_label: string; start_boundary: string; end_boundary: string }) => Promise<AcademicYear>;
  updateAcademicYear: (id: string, data: Partial<{ display_label: string; start_boundary: string; end_boundary: string }>) => Promise<AcademicYear>;
  deleteAcademicYear: (id: string) => Promise<void>;

  // Actions - Semesters
  setSemesterSearchQuery: (q: string) => void;
  addSemester: (data: { academic_year: string; semester_index: 'FIRST' | 'SECOND' }) => Promise<Semester>;
  updateSemester: (id: string, data: Partial<{ semester_index: 'FIRST' | 'SECOND' }>) => Promise<Semester>;
  deleteSemester: (id: string) => Promise<void>;

  // Actions - Courses
  setCourseSearchQuery: (q: string) => void;
  setCourseDeptFilter: (dept: string) => void;
  addCourse: (data: { title: string; course_code: string; credit_hours: number; program?: string; intended_class_standing?: string }) => Promise<Course>;
  updateCourse: (id: string, data: Partial<{ title: string; course_code: string; credit_hours: number }>) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  toggleCourseArchive: (id: string) => void;

  // Actions - Exams
  setExamSearchQuery: (q: string) => void;
  setExamStatusFilter: (status: string) => void;
  addExam: (data: { title: string; duration_minutes: number; course_offering?: string }) => Promise<AdminExamOverview>;
  scheduleExam: (id: string, data: { start_window: string; end_window: string; duration_minutes: number }) => Promise<void>;
  archiveExam: (id: string) => void;
  deleteExam: (id: string) => Promise<void>;

  // Actions - Students & Lecturers
  setStudentSearchQuery: (q: string) => void;
  setStudentDeptFilter: (dept: string) => void;
  setLecturerSearchQuery: (q: string) => void;
  setLecturerDeptFilter: (dept: string) => void;

  // Actions - AI Jobs, Audit, Settings & Notifications
  retryAIJob: (id: string) => void;
  updateSettings: (settings: Partial<SystemSettings>) => void;
  setAuditSearchQuery: (q: string) => void;
  setAuditCategoryFilter: (cat: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

export const useAdminStore = create<AdminStoreState>((set, get) => ({
  users: [],
  students: [],
  lecturers: [],
  colleges: [],
  departments: [],
  programs: [],
  academicYears: [],
  semesters: [],
  courses: [],
  exams: [],
  aiJobs: [],
  auditLogs: [],
  settings: {
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
  },
  notifications: [],
  isLoadingData: false,

  isLoadingUsers: false,
  usersError: null,
  isLoadingColleges: false,
  isLoadingDepartments: false,
  departmentsError: null,
  isLoadingPrograms: false,
  isLoadingAcademicYears: false,
  isLoadingSemesters: false,
  isLoadingCourses: false,
  isLoadingExams: false,

  userSearchQuery: '',
  userRoleFilter: 'ALL',
  userDeptFilter: 'ALL',
  userStatusFilter: 'ALL',

  studentSearchQuery: '',
  studentDeptFilter: 'ALL',

  lecturerSearchQuery: '',
  lecturerDeptFilter: 'ALL',

  collegeSearchQuery: '',
  departmentSearchQuery: '',
  programSearchQuery: '',
  academicYearSearchQuery: '',
  semesterSearchQuery: '',

  courseSearchQuery: '',
  courseDeptFilter: 'ALL',

  examSearchQuery: '',
  examStatusFilter: 'ALL',

  auditSearchQuery: '',
  auditCategoryFilter: 'ALL',

  fetchAdminData: async () => {
    set({ isLoadingData: true });
    try {
      const [departments, courses, exams, students, users, lecturers, colleges, programs, academicYears, semesters] = await Promise.all([
        adminService.getDepartments().catch(() => []),
        adminService.getCourses().catch(() => []),
        adminService.getAllExams().catch(() => []),
        adminService.getStudents().catch(() => []),
        adminService.getUsers().catch(() => []),
        adminService.getLecturers().catch(() => []),
        adminService.getColleges().catch(() => []),
        adminService.getPrograms().catch(() => []),
        adminService.getAcademicYears().catch(() => []),
        adminService.getSemesters().catch(() => []),
      ]);

      set({
        departments,
        courses,
        exams,
        students,
        users,
        lecturers,
        colleges,
        programs,
        academicYears,
        semesters,
        isLoadingData: false,
      });
    } catch {
      set({ isLoadingData: false });
    }
  },

  fetchUsers: async () => {
    set({ isLoadingUsers: true, usersError: null });
    try {
      const users = await adminService.getUsers();
      set({ users, isLoadingUsers: false, usersError: null });
    } catch (err: unknown) {
      set({ users: [], isLoadingUsers: false, usersError: getUserFriendlyErrorMessage(err) });
    }
  },

  fetchStudents: async () => {
    try {
      const students = await adminService.getStudents();
      set({ students });
    } catch {}
  },

  fetchLecturers: async () => {
    try {
      const lecturers = await adminService.getLecturers();
      set({ lecturers });
    } catch {}
  },

  fetchColleges: async () => {
    set({ isLoadingColleges: true });
    try {
      const colleges = await adminService.getColleges();
      set({ colleges, isLoadingColleges: false });
    } catch {
      set({ isLoadingColleges: false });
    }
  },

  fetchDepartments: async () => {
    set({ isLoadingDepartments: true, departmentsError: null });
    try {
      const departments = await adminService.getDepartments();
      set({ departments, isLoadingDepartments: false, departmentsError: null });
    } catch (err: unknown) {
      set({ departments: [], isLoadingDepartments: false, departmentsError: getUserFriendlyErrorMessage(err) });
    }
  },

  fetchPrograms: async () => {
    set({ isLoadingPrograms: true });
    try {
      const programs = await adminService.getPrograms();
      set({ programs, isLoadingPrograms: false });
    } catch {
      set({ isLoadingPrograms: false });
    }
  },

  fetchAcademicYears: async () => {
    set({ isLoadingAcademicYears: true });
    try {
      const academicYears = await adminService.getAcademicYears();
      set({ academicYears, isLoadingAcademicYears: false });
    } catch {
      set({ isLoadingAcademicYears: false });
    }
  },

  fetchSemesters: async () => {
    set({ isLoadingSemesters: true });
    try {
      const semesters = await adminService.getSemesters();
      set({ semesters, isLoadingSemesters: false });
    } catch {
      set({ isLoadingSemesters: false });
    }
  },

  fetchCourses: async () => {
    set({ isLoadingCourses: true });
    try {
      const courses = await adminService.getCourses();
      set({ courses, isLoadingCourses: false });
    } catch {
      set({ isLoadingCourses: false });
    }
  },

  fetchExams: async () => {
    set({ isLoadingExams: true });
    try {
      const exams = await adminService.getAllExams();
      set({ exams, isLoadingExams: false });
    } catch {
      set({ isLoadingExams: false });
    }
  },

  // Actions - Users
  setUsers: (users) => set({ users }),
  addUser: async (payload) => {
    const newUser = await adminService.createUser(payload);
    return newUser;
  },

  updateUser: async (id, data) => {
    const updated = await adminService.updateUser(id, data);
    return updated;
  },

  deleteUser: async (id) => {
    await adminService.deleteUser(id);
  },

  setUserSearchQuery: (userSearchQuery) => set({ userSearchQuery }),
  setUserRoleFilter: (userRoleFilter) => set({ userRoleFilter }),
  setUserDeptFilter: (userDeptFilter) => set({ userDeptFilter }),
  setUserStatusFilter: (userStatusFilter) => set({ userStatusFilter }),

  // Actions - Colleges
  setCollegeSearchQuery: (collegeSearchQuery) => set({ collegeSearchQuery }),
  addCollege: async (data) => {
    const college = await adminService.createCollege(data);
    set((state) => ({ colleges: [college, ...state.colleges] }));
    return college;
  },
  updateCollege: async (id, data) => {
    const updated = await adminService.updateCollege(id, data);
    set((state) => ({ colleges: state.colleges.map((c) => (c.id === id ? updated : c)) }));
    return updated;
  },
  deleteCollege: async (id) => {
    await adminService.deleteCollege(id);
    set((state) => ({ colleges: state.colleges.filter((c) => c.id !== id) }));
  },

  // Actions - Departments
  setDepartmentSearchQuery: (departmentSearchQuery) => set({ departmentSearchQuery }),
  addDepartment: async (data) => {
    const newDept = await adminService.createDepartment(data);
    set((state) => ({ departments: [newDept, ...state.departments] }));
    return newDept;
  },
  updateDepartment: async (id, data) => {
    const updated = await adminService.updateDepartment(id, data);
    set((state) => ({ departments: state.departments.map((d) => (d.id === id ? updated : d)) }));
    return updated;
  },
  deleteDepartment: async (id) => {
    await adminService.deleteDepartment(id);
    set((state) => ({ departments: state.departments.filter((d) => d.id !== id) }));
  },

  // Actions - Programs
  setProgramSearchQuery: (programSearchQuery) => set({ programSearchQuery }),
  addProgram: async (data) => {
    const program = await adminService.createProgram(data);
    set((state) => ({ programs: [program, ...state.programs] }));
    return program;
  },
  updateProgram: async (id, data) => {
    const updated = await adminService.updateProgram(id, data);
    set((state) => ({ programs: state.programs.map((p) => (p.id === id ? updated : p)) }));
    return updated;
  },
  deleteProgram: async (id) => {
    await adminService.deleteProgram(id);
    set((state) => ({ programs: state.programs.filter((p) => p.id !== id) }));
  },

  // Actions - Academic Years
  setAcademicYearSearchQuery: (academicYearSearchQuery) => set({ academicYearSearchQuery }),
  addAcademicYear: async (data) => {
    const year = await adminService.createAcademicYear(data);
    set((state) => ({ academicYears: [year, ...state.academicYears] }));
    return year;
  },
  updateAcademicYear: async (id, data) => {
    const updated = await adminService.updateAcademicYear(id, data);
    set((state) => ({ academicYears: state.academicYears.map((y) => (y.id === id ? updated : y)) }));
    return updated;
  },
  deleteAcademicYear: async (id) => {
    await adminService.deleteAcademicYear(id);
    set((state) => ({ academicYears: state.academicYears.filter((y) => y.id !== id) }));
  },

  // Actions - Semesters
  setSemesterSearchQuery: (semesterSearchQuery) => set({ semesterSearchQuery }),
  addSemester: async (data) => {
    const sem = await adminService.createSemester(data);
    set((state) => ({ semesters: [sem, ...state.semesters] }));
    return sem;
  },
  updateSemester: async (id, data) => {
    const updated = await adminService.updateSemester(id, data);
    set((state) => ({ semesters: state.semesters.map((s) => (s.id === id ? updated : s)) }));
    return updated;
  },
  deleteSemester: async (id) => {
    await adminService.deleteSemester(id);
    set((state) => ({ semesters: state.semesters.filter((s) => s.id !== id) }));
  },

  // Actions - Courses
  setCourseSearchQuery: (courseSearchQuery) => set({ courseSearchQuery }),
  setCourseDeptFilter: (courseDeptFilter) => set({ courseDeptFilter }),
  addCourse: async (data) => {
    const course = await adminService.createCourse(data);
    set((state) => ({ courses: [course, ...state.courses] }));
    return course;
  },
  updateCourse: async (id, data) => {
    const updated = await adminService.updateCourse(id, data);
    set((state) => ({ courses: state.courses.map((c) => (c.id === id ? updated : c)) }));
    return updated;
  },
  deleteCourse: async (id) => {
    await adminService.deleteCourse(id);
    set((state) => ({ courses: state.courses.filter((c) => c.id !== id) }));
  },
  toggleCourseArchive: (id) =>
    set((state) => ({
      courses: state.courses.map((c) =>
        c.id === id ? { ...c, status: c.status === 'active' ? 'archived' : 'active' } : c
      ),
    })),

  // Actions - Exams
  setExamSearchQuery: (examSearchQuery) => set({ examSearchQuery }),
  setExamStatusFilter: (examStatusFilter) => set({ examStatusFilter }),
  addExam: async (data) => {
    const exam = await adminService.createExam(data);
    set((state) => ({ exams: [exam, ...state.exams] }));
    return exam;
  },
  scheduleExam: async (id, data) => {
    await adminService.scheduleExam(id, data);
    get().fetchExams();
  },
  archiveExam: (id) =>
    set((state) => ({
      exams: state.exams.map((e) => (e.id === id ? { ...e, status: 'archived' } : e)),
    })),
  deleteExam: async (id) => {
    await adminService.deleteExam(id);
    set((state) => ({ exams: state.exams.filter((e) => e.id !== id) }));
  },

  // Actions - Students & Lecturers
  setStudentSearchQuery: (studentSearchQuery) => set({ studentSearchQuery }),
  setStudentDeptFilter: (studentDeptFilter) => set({ studentDeptFilter }),
  setLecturerSearchQuery: (lecturerSearchQuery) => set({ lecturerSearchQuery }),
  setLecturerDeptFilter: (lecturerDeptFilter) => set({ lecturerDeptFilter }),

  // Actions - AI Jobs, Audit, Settings & Notifications
  retryAIJob: (id) =>
    set((state) => ({
      aiJobs: state.aiJobs.map((j) =>
        j.id === id
          ? { ...j, status: 'processing', errorReason: undefined, startedAt: new Date().toLocaleString() }
          : j
      ),
    })),

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
