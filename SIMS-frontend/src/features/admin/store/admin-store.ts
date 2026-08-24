import { create } from 'zustand';

import { getUserFriendlyErrorMessage } from '@/lib/errors';

import { adminService, type RegisterUserPayload } from '../services/admin-service';

import type {
  UserCompact,
  UserDetail,
  UpdateUserPayload,
  StudentProfile,
  Department,
  Course,
  ClassStanding,
  AdminExamOverview,
  AIGradingJob,
  AuditLog,
  SystemSettings,
  AdminNotification,
  College,
  Program,
  AcademicYear,
  Semester,
  CreateSemesterPayload,
  UpdateSemesterPayload,
  AdminCourseOffering,
  AdminEnrollment,
  CreateEnrollmentPayload,
  UpdateEnrollmentPayload,
  BatchImportResponse,
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

interface AdminStoreState {
  // Datasets
  users: UserCompact[];
  students: StudentProfile[];
  lecturers: ApiLecturerListItem[];
  colleges: College[];
  departments: Department[];
  programs: Program[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  courses: Course[];
  courseOfferings: AdminCourseOffering[];
  enrollments: AdminEnrollment[];
  exams: AdminExamOverview[];
  aiJobs: AIGradingJob[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  notifications: AdminNotification[];
  tags: Tag[];
  isLoadingData: boolean;

  // Loading states
  isLoadingUsers: boolean;
  usersError: string | null;
  isLoadingStudents: boolean;
  studentsError: string | null;
  isLoadingLecturers: boolean;
  lecturersError: string | null;
  isLoadingTags: boolean;
  tagsError: string | null;
  isLoadingColleges: boolean;
  collegesError: string | null;
  isLoadingDepartments: boolean;
  departmentsError: string | null;
  isLoadingPrograms: boolean;
  programsError: string | null;
  isLoadingAcademicYears: boolean;
  isLoadingSemesters: boolean;
  semestersError: string | null;
  isLoadingCourses: boolean;
  coursesError: string | null;
  isLoadingCourseOfferings: boolean;
  courseOfferingsError: string | null;
  isLoadingEnrollments: boolean;
  enrollmentsError: string | null;
  isLoadingExams: boolean;

  // Search & Filter States
  userSearchQuery: string;
  userRoleFilter: string;
  userDeptFilter: string;
  userStatusFilter: string;

  studentSearchQuery: string;
  studentDeptFilter: string;
  studentClassStandingFilter: string;

  lecturerSearchQuery: string;
  lecturerDeptFilter: string;

  collegeSearchQuery: string;
  departmentSearchQuery: string;
  programSearchQuery: string;
  programDeptFilter: string;
  programDegreeFilter: string;
  academicYearSearchQuery: string;
  semesterSearchQuery: string;
  semesterYearFilter: string;

  courseSearchQuery: string;
  courseProgramFilter: string;
  courseStandingFilter: string;
  courseDeptFilter: string;

  enrollmentSearchQuery: string;
  enrollmentStatusFilter: string;
  enrollmentSemesterFilter: string;
  enrollmentCourseFilter: string;

  examSearchQuery: string;
  examStatusFilter: string;

  auditSearchQuery: string;
  auditCategoryFilter: string;

  tagSearchQuery: string;

  // Fetch Actions
  fetchAdminData: () => Promise<void>;
  fetchUsers: (params?: { search?: string; role?: string }) => Promise<void>;
  fetchUserById: (id: string) => Promise<UserDetail>;
  fetchStudents: (params?: StudentFilterParams) => Promise<void>;
  fetchStudentById: (id: string) => Promise<ApiStudentDetail>;
  updateStudent: (id: string, payload: UpdateStudentPayload) => Promise<ApiStudentDetail>;
  fetchLecturers: (params?: LecturerFilterParams) => Promise<void>;
  fetchLecturerById: (id: string) => Promise<ApiLecturerDetail>;
  updateLecturer: (id: string, payload: UpdateLecturerPayload) => Promise<ApiLecturerDetail>;
  fetchTags: () => Promise<void>;
  fetchTagById: (id: string) => Promise<Tag>;
  addTag: (data: CreateTagPayload) => Promise<Tag>;
  updateTag: (id: string, data: UpdateTagPayload) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
  setTagSearchQuery: (q: string) => void;
  fetchColleges: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
  fetchPrograms: () => Promise<void>;
  fetchProgramById: (id: string) => Promise<Program>;
  fetchAcademicYears: () => Promise<void>;
  fetchSemesters: () => Promise<void>;
  fetchSemesterById: (id: string) => Promise<Semester>;
  addSemester: (data: CreateSemesterPayload) => Promise<Semester>;
  updateSemester: (id: string, data: UpdateSemesterPayload) => Promise<Semester>;
  deleteSemester: (id: string) => Promise<void>;
  setSemesterSearchQuery: (q: string) => void;
  setSemesterYearFilter: (yearId: string) => void;
  fetchCourses: () => Promise<void>;
  fetchCourseById: (id: string) => Promise<Course>;
  fetchCourseOfferings: () => Promise<void>;
  fetchEnrollments: () => Promise<void>;
  fetchExams: () => Promise<void>;

  // Actions - Users
  setUsers: (users: UserCompact[]) => void;
  addUser: (user: RegisterUserPayload) => Promise<UserCompact>;
  updateUser: (id: string, data: UpdateUserPayload) => Promise<UserDetail>;
  deleteUser: (id: string) => Promise<void>;
  setUserSearchQuery: (q: string) => void;
  setUserRoleFilter: (role: string) => void;
  setUserDeptFilter: (dept: string) => void;
  setUserStatusFilter: (status: string) => void;

  // Actions - Colleges
  setCollegeSearchQuery: (q: string) => void;
  addCollege: (data: { name: string; code: string; university: string }) => Promise<College>;
  updateCollege: (id: string, data: Partial<{ name: string; code: string; university: string }>) => Promise<College>;
  deleteCollege: (id: string) => Promise<void>;

  // Actions - Departments
  setDepartmentSearchQuery: (q: string) => void;
  addDepartment: (data: { name: string; code: string; college?: string | null }) => Promise<Department>;
  updateDepartment: (id: string, data: Partial<{ name: string; code: string; college?: string | null }>) => Promise<Department>;
  deleteDepartment: (id: string) => Promise<void>;

  // Actions - Programs
  setProgramSearchQuery: (q: string) => void;
  setProgramDeptFilter: (deptId: string) => void;
  setProgramDegreeFilter: (degree: string) => void;
  addProgram: (data: { department: string; name: string; code: string; degree_level?: string; total_credit_hours_required?: number }) => Promise<Program>;
  updateProgram: (id: string, data: Partial<{ department?: string; name: string; code: string; degree_level?: string; total_credit_hours_required?: number }>) => Promise<Program>;
  deleteProgram: (id: string) => Promise<void>;

  // Actions - Academic Years
  setAcademicYearSearchQuery: (q: string) => void;
  addAcademicYear: (data: { display_label: string; start_boundary: string; end_boundary: string }) => Promise<AcademicYear>;
  updateAcademicYear: (id: string, data: Partial<{ display_label: string; start_boundary: string; end_boundary: string }>) => Promise<AcademicYear>;
  deleteAcademicYear: (id: string) => Promise<void>;

  // Actions - Courses
  setCourseSearchQuery: (q: string) => void;
  setCourseProgramFilter: (progId: string) => void;
  setCourseStandingFilter: (standing: string) => void;
  setCourseDeptFilter: (dept: string) => void;
  addCourse: (data: { title: string; course_code: string; credit_hours: number; program?: string | null; intended_class_standing?: ClassStanding }) => Promise<Course>;
  updateCourse: (id: string, data: Partial<{ title: string; course_code: string; credit_hours: number; program?: string | null; intended_class_standing?: ClassStanding }>) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  toggleCourseArchive: (id: string) => void;

  // Actions - Course Offerings & Enrollments
  setEnrollmentSearchQuery: (q: string) => void;
  setEnrollmentStatusFilter: (status: string) => void;
  setEnrollmentSemesterFilter: (semesterId: string) => void;
  setEnrollmentCourseFilter: (courseId: string) => void;
  addEnrollment: (data: CreateEnrollmentPayload) => Promise<AdminEnrollment>;
  updateEnrollment: (id: string, data: UpdateEnrollmentPayload) => Promise<AdminEnrollment>;
  deleteEnrollment: (id: string) => Promise<void>;
  batchImportEnrollments: (file: File) => Promise<BatchImportResponse>;

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
  setStudentClassStandingFilter: (standing: string) => void;
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
  courseOfferings: [],
  enrollments: [],
  exams: [],
  aiJobs: [],
  auditLogs: [],
  tags: [],
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
  isLoadingStudents: false,
  studentsError: null,
  isLoadingLecturers: false,
  lecturersError: null,
  isLoadingTags: false,
  tagsError: null,
  isLoadingColleges: false,
  collegesError: null,
  isLoadingDepartments: false,
  departmentsError: null,
  isLoadingPrograms: false,
  programsError: null,
  isLoadingAcademicYears: false,
  isLoadingSemesters: false,
  semestersError: null,
  isLoadingCourses: false,
  coursesError: null,
  isLoadingCourseOfferings: false,
  courseOfferingsError: null,
  isLoadingEnrollments: false,
  enrollmentsError: null,
  isLoadingExams: false,

  userSearchQuery: '',
  userRoleFilter: 'ALL',
  userDeptFilter: 'ALL',
  userStatusFilter: 'ALL',

  studentSearchQuery: '',
  studentDeptFilter: 'ALL',
  studentClassStandingFilter: 'ALL',

  lecturerSearchQuery: '',
  lecturerDeptFilter: 'ALL',

  collegeSearchQuery: '',
  departmentSearchQuery: '',
  programSearchQuery: '',
  programDeptFilter: 'ALL',
  programDegreeFilter: 'ALL',
  academicYearSearchQuery: '',
  semesterSearchQuery: '',
  semesterYearFilter: 'ALL',

  courseSearchQuery: '',
  courseProgramFilter: 'ALL',
  courseStandingFilter: 'ALL',
  courseDeptFilter: 'ALL',

  enrollmentSearchQuery: '',
  enrollmentStatusFilter: 'ALL',
  enrollmentSemesterFilter: 'ALL',
  enrollmentCourseFilter: 'ALL',

  examSearchQuery: '',
  examStatusFilter: 'ALL',

  auditSearchQuery: '',
  auditCategoryFilter: 'ALL',

  tagSearchQuery: '',

  fetchAdminData: async () => {
    set({ isLoadingData: true });
    try {
      const [departments, courses, exams, students, users, lecturers, colleges, programs, academicYears, semesters, courseOfferings, enrollments, tags] = await Promise.all([
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
        adminService.getCourseOfferings().catch(() => []),
        adminService.getEnrollments().catch(() => []),
        adminService.getTags().catch(() => []),
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
        courseOfferings,
        enrollments,
        tags,
        isLoadingData: false,
      });
    } catch {
      set({ isLoadingData: false });
    }
  },

  fetchUsers: async (params) => {
    set({ isLoadingUsers: true, usersError: null });
    try {
      const search = params?.search !== undefined ? params.search : get().userSearchQuery;
      const role = params?.role !== undefined ? params.role : get().userRoleFilter;
      const users = await adminService.getUsers({ search, role });
      set({ users, isLoadingUsers: false, usersError: null });
    } catch (err: unknown) {
      set({ users: [], isLoadingUsers: false, usersError: getUserFriendlyErrorMessage(err) });
    }
  },

  fetchUserById: async (id) => {
    return adminService.getUserById(id);
  },

  fetchStudents: async (params) => {
    set({ isLoadingStudents: true, studentsError: null });
    try {
      const search = params?.search !== undefined ? params.search : get().studentSearchQuery;
      const department = params?.department !== undefined ? params.department : get().studentDeptFilter;
      const class_standing = params?.class_standing !== undefined ? params.class_standing : get().studentClassStandingFilter;
      const students = await adminService.getStudents({ search, department, class_standing });
      set({ students, isLoadingStudents: false, studentsError: null });
    } catch (err: unknown) {
      set({ students: [], isLoadingStudents: false, studentsError: getUserFriendlyErrorMessage(err) });
    }
  },

  fetchStudentById: async (id) => {
    return adminService.getStudentById(id);
  },

  updateStudent: async (id, payload) => {
    const updated = await adminService.updateStudent(id, payload);
    set((state) => ({
      students: state.students.map((s) =>
        s.id === id
          ? {
              ...s,
              student_identifier: updated.student_identifier,
              class_standing: updated.class_standing,
              department: updated.department,
              department_detail: updated.department_detail,
            }
          : s
      ),
    }));
    return updated;
  },

  fetchLecturers: async (params) => {
    set({ isLoadingLecturers: true, lecturersError: null });
    try {
      const search = params?.search !== undefined ? params.search : get().lecturerSearchQuery;
      const department = params?.department !== undefined ? params.department : get().lecturerDeptFilter;
      const lecturers = await adminService.getLecturers({ search, department });
      set({ lecturers, isLoadingLecturers: false, lecturersError: null });
    } catch (err: unknown) {
      set({ lecturers: [], isLoadingLecturers: false, lecturersError: getUserFriendlyErrorMessage(err) });
    }
  },

  fetchLecturerById: async (id) => {
    return adminService.getLecturerById(id);
  },

  updateLecturer: async (id, payload) => {
    const updated = await adminService.updateLecturer(id, payload);
    set((state) => ({
      lecturers: state.lecturers.map((l) =>
        l.id === id
          ? {
              ...l,
              faculty_identifier: updated.faculty_identifier,
              department: updated.department,
              department_detail: updated.department_detail,
            }
          : l
      ),
    }));
    return updated;
  },

  fetchTags: async () => {
    set({ isLoadingTags: true, tagsError: null });
    try {
      const tags = await adminService.getTags();
      set({ tags, isLoadingTags: false, tagsError: null });
    } catch (err: unknown) {
      set({ tags: [], isLoadingTags: false, tagsError: getUserFriendlyErrorMessage(err) });
    }
  },

  fetchTagById: async (id) => {
    return adminService.getTagById(id);
  },

  fetchColleges: async () => {
    set({ isLoadingColleges: true, collegesError: null });
    try {
      const colleges = await adminService.getColleges();
      set({ colleges, isLoadingColleges: false, collegesError: null });
    } catch (err: unknown) {
      set({ colleges: [], isLoadingColleges: false, collegesError: getUserFriendlyErrorMessage(err) });
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
    set({ isLoadingPrograms: true, programsError: null });
    try {
      const programs = await adminService.getPrograms();
      set({ programs, isLoadingPrograms: false, programsError: null });
    } catch (err: unknown) {
      set({ programs: [], isLoadingPrograms: false, programsError: getUserFriendlyErrorMessage(err) });
    }
  },

  fetchProgramById: async (id) => {
    return adminService.getProgramById(id);
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
    set({ isLoadingSemesters: true, semestersError: null });
    try {
      const semesters = await adminService.getSemesters();
      set({ semesters, isLoadingSemesters: false, semestersError: null });
    } catch (err: unknown) {
      set({ semesters: [], isLoadingSemesters: false, semestersError: getUserFriendlyErrorMessage(err) });
    }
  },

  fetchCourses: async () => {
    set({ isLoadingCourses: true, coursesError: null });
    try {
      const courses = await adminService.getCourses();
      set({ courses, isLoadingCourses: false, coursesError: null });
    } catch (err: unknown) {
      set({ courses: [], isLoadingCourses: false, coursesError: getUserFriendlyErrorMessage(err) });
    }
  },

  fetchCourseById: async (id) => {
    return adminService.getCourseById(id);
  },

  fetchCourseOfferings: async () => {
    set({ isLoadingCourseOfferings: true, courseOfferingsError: null });
    try {
      const courseOfferings = await adminService.getCourseOfferings();
      set({ courseOfferings, isLoadingCourseOfferings: false, courseOfferingsError: null });
    } catch (err: unknown) {
      set({ courseOfferings: [], isLoadingCourseOfferings: false, courseOfferingsError: getUserFriendlyErrorMessage(err) });
    }
  },

  fetchEnrollments: async () => {
    set({ isLoadingEnrollments: true, enrollmentsError: null });
    try {
      const enrollments = await adminService.getEnrollments();
      set({ enrollments, isLoadingEnrollments: false, enrollmentsError: null });
    } catch (err: unknown) {
      set({ enrollments: [], isLoadingEnrollments: false, enrollmentsError: getUserFriendlyErrorMessage(err) });
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
    set((state) => ({ users: [newUser, ...state.users.filter((u) => u.id !== newUser.id)] }));
    return newUser;
  },

  updateUser: async (id, data) => {
    const updated = await adminService.updateUser(id, data);
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id
          ? {
              ...u,
              first_name: updated.first_name,
              last_name: updated.last_name,
              role: updated.role,
              is_active: updated.is_active,
            }
          : u,
      ),
    }));
    return updated;
  },

  deleteUser: async (id) => {
    await adminService.deleteUser(id);
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, is_active: false } : u)),
    }));
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
  setProgramDeptFilter: (programDeptFilter) => set({ programDeptFilter }),
  setProgramDegreeFilter: (programDegreeFilter) => set({ programDegreeFilter }),
  addProgram: async (data) => {
    const program = await adminService.createProgram(data);
    set((state) => ({ programs: [program, ...state.programs.filter((p) => p.id !== program.id)] }));
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
  setSemesterYearFilter: (semesterYearFilter) => set({ semesterYearFilter }),
  fetchSemesterById: async (id) => {
    return adminService.getSemesterById(id);
  },
  addSemester: async (data) => {
    const sem = await adminService.createSemester(data);
    set((state) => ({ semesters: [sem, ...state.semesters.filter((s) => s.id !== sem.id)] }));
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
  setCourseProgramFilter: (courseProgramFilter) => set({ courseProgramFilter }),
  setCourseStandingFilter: (courseStandingFilter) => set({ courseStandingFilter }),
  setCourseDeptFilter: (courseDeptFilter) => set({ courseDeptFilter }),
  addCourse: async (data) => {
    const course = await adminService.createCourse(data);
    set((state) => ({ courses: [course, ...state.courses.filter((c) => c.id !== course.id)] }));
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
  toggleCourseArchive: (_id) => {},

  // Actions - Course Offerings & Enrollments
  setEnrollmentSearchQuery: (enrollmentSearchQuery) => set({ enrollmentSearchQuery }),
  setEnrollmentStatusFilter: (enrollmentStatusFilter) => set({ enrollmentStatusFilter }),
  setEnrollmentSemesterFilter: (enrollmentSemesterFilter) => set({ enrollmentSemesterFilter }),
  setEnrollmentCourseFilter: (enrollmentCourseFilter) => set({ enrollmentCourseFilter }),

  addEnrollment: async (payload) => {
    const newEnrollment = await adminService.createEnrollment(payload);
    await get().fetchEnrollments();
    return newEnrollment;
  },

  updateEnrollment: async (id, data) => {
    const updated = await adminService.updateEnrollment(id, data);
    await get().fetchEnrollments();
    return updated;
  },

  deleteEnrollment: async (id) => {
    await adminService.deleteEnrollment(id);
    await get().fetchEnrollments();
  },

  batchImportEnrollments: async (file) => {
    const res = await adminService.batchImportEnrollments(file);
    await get().fetchEnrollments();
    return res;
  },

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
  setStudentClassStandingFilter: (studentClassStandingFilter) => set({ studentClassStandingFilter }),
  setLecturerSearchQuery: (lecturerSearchQuery) => set({ lecturerSearchQuery }),
  setLecturerDeptFilter: (lecturerDeptFilter) => set({ lecturerDeptFilter }),

  // Actions - Tags
  setTagSearchQuery: (tagSearchQuery) => set({ tagSearchQuery }),
  addTag: async (data) => {
    const tag = await adminService.createTag(data);
    set((state) => ({ tags: [tag, ...state.tags] }));
    return tag;
  },
  updateTag: async (id, data) => {
    const updated = await adminService.updateTag(id, data);
    set((state) => ({ tags: state.tags.map((t) => (t.id === id ? updated : t)) }));
    return updated;
  },
  deleteTag: async (id) => {
    await adminService.deleteTag(id);
    set((state) => ({ tags: state.tags.filter((t) => t.id !== id) }));
  },

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
