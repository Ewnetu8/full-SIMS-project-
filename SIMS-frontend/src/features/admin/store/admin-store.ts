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
  CreateExaminationPayload,
  UpdateExaminationPayload,
  ScheduleExaminationPayload,
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
  CreateCourseOfferingPayload,
  UpdateCourseOfferingPayload,
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
  CoursePrerequisite,
  CreateCoursePrerequisitePayload,
  CreditHourPolicy,
  CreditHourPolicyPayload,
  EnrollmentOverride,
  CreateEnrollmentOverridePayload,
  OverrideType,
} from '../types';
import type { AdminAnalyticsResponse } from '@/types/api';

interface AdminStoreState {
  // Datasets
  adminAnalytics: AdminAnalyticsResponse | null;
  users: UserCompact[];
  students: StudentProfile[];
  lecturers: ApiLecturerListItem[];
  colleges: College[];
  departments: Department[];
  programs: Program[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  courses: Course[];
  coursePrerequisites: CoursePrerequisite[];
  creditHourPolicies: CreditHourPolicy[];
  enrollmentOverrides: EnrollmentOverride[];
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
  isLoadingAnalytics: boolean;
  analyticsError: string | null;
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
  isLoadingCoursePrerequisites: boolean;
  coursePrerequisitesError: string | null;
  isLoadingCreditHourPolicies: boolean;
  creditHourPoliciesError: string | null;
  isLoadingEnrollmentOverrides: boolean;
  enrollmentOverridesError: string | null;
  isLoadingCourseOfferings: boolean;
  courseOfferingsError: string | null;
  isLoadingEnrollments: boolean;
  enrollmentsError: string | null;
  isLoadingExams: boolean;
  examsError: string | null;

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
  departmentCollegeFilter: string;
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
  coursePrerequisiteSearchQuery: string;
  creditHourPolicySearchQuery: string;
  enrollmentOverrideSearchQuery: string;

  enrollmentSearchQuery: string;
  enrollmentStatusFilter: string;
  enrollmentSemesterFilter: string;
  enrollmentCourseFilter: string;

  examSearchQuery: string;
  examStatusFilter: string;
  examCourseOfferingFilter: string;

  auditSearchQuery: string;
  auditCategoryFilter: string;

  tagSearchQuery: string;

  // Fetch Actions
  fetchAdminData: () => Promise<void>;
  fetchAdminAnalytics: () => Promise<void>;
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
  fetchDepartmentById: (id: string) => Promise<Department>;
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
  fetchCoursePrerequisites: () => Promise<void>;
  fetchCoursePrerequisiteById: (id: string) => Promise<CoursePrerequisite>;
  fetchCreditHourPolicies: () => Promise<void>;
  fetchCreditHourPolicyById: (id: string) => Promise<CreditHourPolicy>;
  fetchEnrollmentOverrides: () => Promise<void>;
  fetchEnrollmentOverrideById: (id: string) => Promise<EnrollmentOverride>;
  fetchCourseOfferings: () => Promise<void>;
  fetchCourseOfferingById: (id: string) => Promise<AdminCourseOffering>;
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
  setDepartmentCollegeFilter: (collegeId: string) => void;
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

  // Actions - Course Prerequisites
  setCoursePrerequisiteSearchQuery: (q: string) => void;
  addCoursePrerequisite: (data: CreateCoursePrerequisitePayload) => Promise<CoursePrerequisite>;
  deleteCoursePrerequisite: (id: string) => Promise<void>;

  // Actions - Credit Hour Policies
  setCreditHourPolicySearchQuery: (q: string) => void;
  addCreditHourPolicy: (data: CreditHourPolicyPayload) => Promise<CreditHourPolicy>;
  updateCreditHourPolicy: (id: string, data: CreditHourPolicyPayload) => Promise<CreditHourPolicy>;
  deleteCreditHourPolicy: (id: string) => Promise<void>;

  // Actions - Enrollment Overrides
  setEnrollmentOverrideSearchQuery: (q: string) => void;
  addEnrollmentOverride: (data: CreateEnrollmentOverridePayload) => Promise<EnrollmentOverride>;
  deleteEnrollmentOverride: (id: string) => Promise<void>;

  // Actions - Course Offerings & Enrollments
  addCourseOffering: (data: CreateCourseOfferingPayload) => Promise<AdminCourseOffering>;
  updateCourseOffering: (id: string, data: UpdateCourseOfferingPayload) => Promise<AdminCourseOffering>;
  deleteCourseOffering: (id: string) => Promise<void>;
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
  setExamCourseOfferingFilter: (offeringId: string) => void;
  fetchExams: (params?: { status?: string; course_offering?: string }) => Promise<void>;
  fetchExamById: (id: string) => Promise<AdminExamOverview>;
  addExam: (data: CreateExaminationPayload) => Promise<AdminExamOverview>;
  createExam: (data: CreateExaminationPayload) => Promise<AdminExamOverview>;
  updateExam: (id: string, data: UpdateExaminationPayload) => Promise<AdminExamOverview>;
  scheduleExam: (id: string, data: ScheduleExaminationPayload) => Promise<AdminExamOverview>;
  publishExam: (id: string) => Promise<AdminExamOverview>;
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
  adminAnalytics: null,
  users: [],
  students: [],
  lecturers: [],
  colleges: [],
  departments: [],
  programs: [],
  academicYears: [],
  semesters: [],
  courses: [],
  coursePrerequisites: [],
  creditHourPolicies: [],
  enrollmentOverrides: [],
  courseOfferings: [],
  enrollments: [],
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
  tags: [],
  isLoadingData: false,

  isLoadingAnalytics: false,
  analyticsError: null,
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
  isLoadingCoursePrerequisites: false,
  coursePrerequisitesError: null,
  isLoadingCreditHourPolicies: false,
  creditHourPoliciesError: null,
  isLoadingEnrollmentOverrides: false,
  enrollmentOverridesError: null,
  isLoadingCourseOfferings: false,
  courseOfferingsError: null,
  isLoadingEnrollments: false,
  enrollmentsError: null,
  isLoadingExams: false,
  examsError: null,

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
  departmentCollegeFilter: 'ALL',
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
  coursePrerequisiteSearchQuery: '',
  creditHourPolicySearchQuery: '',
  enrollmentOverrideSearchQuery: '',

  enrollmentSearchQuery: '',
  enrollmentStatusFilter: 'ALL',
  enrollmentSemesterFilter: 'ALL',
  enrollmentCourseFilter: 'ALL',

  examSearchQuery: '',
  examStatusFilter: 'ALL',
  examCourseOfferingFilter: 'ALL',

  auditSearchQuery: '',
  auditCategoryFilter: 'ALL',

  tagSearchQuery: '',

  fetchAdminData: async () => {
    set({ isLoadingData: true });
    try {
      const [analytics, departments, courses, coursePrerequisites, creditHourPolicies, enrollmentOverrides, exams, students, users, lecturers, colleges, programs, academicYears, semesters, courseOfferings, enrollments, tags] = await Promise.all([
        adminService.getAdminAnalytics().catch(() => null),
        adminService.getDepartments().catch(() => []),
        adminService.getCourses().catch(() => []),
        adminService.getCoursePrerequisites().catch(() => []),
        adminService.getCreditHourPolicies().catch(() => []),
        adminService.getEnrollmentOverrides().catch(() => []),
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
        adminAnalytics: analytics,
        departments,
        courses,
        coursePrerequisites,
        creditHourPolicies,
        enrollmentOverrides,
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

  fetchAdminAnalytics: async () => {
    set({ isLoadingAnalytics: true, analyticsError: null });
    try {
      const adminAnalytics = await adminService.getAdminAnalytics();
      set({ adminAnalytics, isLoadingAnalytics: false, analyticsError: null });
    } catch (err: unknown) {
      set({ adminAnalytics: null, isLoadingAnalytics: false, analyticsError: getUserFriendlyErrorMessage(err) });
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

  fetchDepartmentById: async (id) => {
    return adminService.getDepartmentById(id);
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

  fetchCoursePrerequisites: async () => {
    set({ isLoadingCoursePrerequisites: true, coursePrerequisitesError: null });
    try {
      const coursePrerequisites = await adminService.getCoursePrerequisites();
      set({ coursePrerequisites, isLoadingCoursePrerequisites: false, coursePrerequisitesError: null });
    } catch (err: unknown) {
      set({ coursePrerequisites: [], isLoadingCoursePrerequisites: false, coursePrerequisitesError: getUserFriendlyErrorMessage(err) });
    }
  },

  fetchCoursePrerequisiteById: async (id) => {
    return adminService.getCoursePrerequisiteById(id);
  },

  fetchCreditHourPolicies: async () => {
    set({ isLoadingCreditHourPolicies: true, creditHourPoliciesError: null });
    try {
      const creditHourPolicies = await adminService.getCreditHourPolicies();
      set({ creditHourPolicies, isLoadingCreditHourPolicies: false, creditHourPoliciesError: null });
    } catch (err: unknown) {
      set({ creditHourPolicies: [], isLoadingCreditHourPolicies: false, creditHourPoliciesError: getUserFriendlyErrorMessage(err) });
    }
  },

  fetchCreditHourPolicyById: async (id) => {
    return adminService.getCreditHourPolicyById(id);
  },

  fetchEnrollmentOverrides: async () => {
    set({ isLoadingEnrollmentOverrides: true, enrollmentOverridesError: null });
    try {
      const enrollmentOverrides = await adminService.getEnrollmentOverrides();
      set({ enrollmentOverrides, isLoadingEnrollmentOverrides: false, enrollmentOverridesError: null });
    } catch (err: unknown) {
      set({ enrollmentOverrides: [], isLoadingEnrollmentOverrides: false, enrollmentOverridesError: getUserFriendlyErrorMessage(err) });
    }
  },

  fetchEnrollmentOverrideById: async (id) => {
    return adminService.getEnrollmentOverrideById(id);
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

  fetchCourseOfferingById: async (id) => {
    return adminService.getCourseOfferingById(id);
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

  fetchExams: async (params) => {
    set({ isLoadingExams: true, examsError: null });
    try {
      const exams = await adminService.getAllExams(params);
      set({ exams, isLoadingExams: false, examsError: null });
    } catch (err: unknown) {
      set({ exams: [], isLoadingExams: false, examsError: getUserFriendlyErrorMessage(err) });
    }
  },

  fetchExamById: async (id) => {
    return adminService.getExamById(id);
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
  setDepartmentCollegeFilter: (departmentCollegeFilter) => set({ departmentCollegeFilter }),
  addDepartment: async (data) => {
    const newDept = await adminService.createDepartment(data);
    set((state) => ({ departments: [newDept, ...state.departments.filter((d) => d.id !== newDept.id)] }));
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

  // Actions - Course Prerequisites
  setCoursePrerequisiteSearchQuery: (coursePrerequisiteSearchQuery) => set({ coursePrerequisiteSearchQuery }),
  addCoursePrerequisite: async (data) => {
    const newPrereq = await adminService.createCoursePrerequisite(data);
    set((state) => ({ coursePrerequisites: [newPrereq, ...state.coursePrerequisites.filter((p) => p.id !== newPrereq.id)] }));
    return newPrereq;
  },
  deleteCoursePrerequisite: async (id) => {
    await adminService.deleteCoursePrerequisite(id);
    set((state) => ({ coursePrerequisites: state.coursePrerequisites.filter((p) => p.id !== id) }));
  },

  // Actions - Credit Hour Policies
  setCreditHourPolicySearchQuery: (creditHourPolicySearchQuery) => set({ creditHourPolicySearchQuery }),
  addCreditHourPolicy: async (data) => {
    const newPolicy = await adminService.createCreditHourPolicy(data);
    set((state) => ({ creditHourPolicies: [newPolicy, ...state.creditHourPolicies.filter((p) => p.id !== newPolicy.id)] }));
    return newPolicy;
  },
  updateCreditHourPolicy: async (id, data) => {
    const updated = await adminService.updateCreditHourPolicy(id, data);
    set((state) => ({ creditHourPolicies: state.creditHourPolicies.map((p) => (p.id === id ? updated : p)) }));
    return updated;
  },
  deleteCreditHourPolicy: async (id) => {
    await adminService.deleteCreditHourPolicy(id);
    set((state) => ({ creditHourPolicies: state.creditHourPolicies.filter((p) => p.id !== id) }));
  },

  // Actions - Enrollment Overrides
  setEnrollmentOverrideSearchQuery: (enrollmentOverrideSearchQuery) => set({ enrollmentOverrideSearchQuery }),
  addEnrollmentOverride: async (data) => {
    const newOverride = await adminService.createEnrollmentOverride(data);
    set((state) => ({ enrollmentOverrides: [newOverride, ...state.enrollmentOverrides.filter((p) => p.id !== newOverride.id)] }));
    return newOverride;
  },
  deleteEnrollmentOverride: async (id) => {
    await adminService.deleteEnrollmentOverride(id);
    set((state) => ({ enrollmentOverrides: state.enrollmentOverrides.filter((p) => p.id !== id) }));
  },

  // Actions - Course Offerings & Enrollments
  addCourseOffering: async (data) => {
    const newOffering = await adminService.createCourseOffering(data);
    await get().fetchCourseOfferings();
    return newOffering;
  },

  updateCourseOffering: async (id, data) => {
    const updated = await adminService.updateCourseOffering(id, data);
    await get().fetchCourseOfferings();
    return updated;
  },

  deleteCourseOffering: async (id) => {
    await adminService.deleteCourseOffering(id);
    await get().fetchCourseOfferings();
  },

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
  setExamCourseOfferingFilter: (examCourseOfferingFilter) => set({ examCourseOfferingFilter }),
  addExam: async (data) => {
    const exam = await adminService.createExam(data);
    set((state) => ({ exams: [exam, ...state.exams] }));
    return exam;
  },
  createExam: async (data) => {
    const exam = await adminService.createExam(data);
    set((state) => ({ exams: [exam, ...state.exams] }));
    return exam;
  },
  updateExam: async (id, data) => {
    const updated = await adminService.updateExam(id, data);
    set((state) => ({ exams: state.exams.map((e) => (e.id === id ? updated : e)) }));
    return updated;
  },
  scheduleExam: async (id, data) => {
    const updated = await adminService.scheduleExam(id, data);
    set((state) => ({ exams: state.exams.map((e) => (e.id === id ? updated : e)) }));
    return updated;
  },
  publishExam: async (id) => {
    const updated = await adminService.publishExam(id);
    set((state) => ({ exams: state.exams.map((e) => (e.id === id ? updated : e)) }));
    return updated;
  },
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
