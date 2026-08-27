// ─── API Endpoint Constants ───────────────────────────────────────────────────
// These are path fragments appended to the Axios base URL.
// The base URL itself is configured via the NEXT_PUBLIC_API_URL env variable.

export const API_ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    ME: '/api/v1/auth/me',
    LECTURER_PROTECTED: '/api/v1/auth/protected/lecturer-only',
  },

  // ── Academics ─────────────────────────────────────────────────────────────
  ACADEMICS: {
    UNIVERSITIES: '/api/v1/universities',
    UNIVERSITY_BY_ID: (id: string) => `/api/v1/universities/${id}`,
    COLLEGES: '/api/v1/colleges',
    COLLEGE_BY_ID: (id: string) => `/api/v1/colleges/${id}`,
    DEPARTMENTS: '/api/v1/departments',
    DEPARTMENT_BY_ID: (id: string) => `/api/v1/departments/${id}`,
    PROGRAMS: '/api/v1/programs',
    PROGRAM_BY_ID: (id: string) => `/api/v1/programs/${id}`,
    ACADEMIC_YEARS: '/api/v1/academic-years',
    ACADEMIC_YEAR_BY_ID: (id: string) => `/api/v1/academic-years/${id}`,
    SEMESTERS: '/api/v1/semesters',
    SEMESTER_BY_ID: (id: string) => `/api/v1/semesters/${id}`,
    COURSES: '/api/v1/courses',
    COURSE_BY_ID: (id: string) => `/api/v1/courses/${id}`,
    COURSE_OFFERINGS: '/api/v1/course-offerings',
    COURSE_OFFERING_BY_ID: (id: string) => `/api/v1/course-offerings/${id}`,
    ENROLLMENTS: '/api/v1/enrollments',
    ENROLLMENT_BY_ID: (id: string) => `/api/v1/enrollments/${id}`,
    BATCH_ENROLLMENT_IMPORT: '/api/v1/enrollments/batch-import',
  },

  // ── Questions ─────────────────────────────────────────────────────────────
  QUESTIONS: {
    ROOT: '/api/v1/questions',
    BY_ID: (id: string) => `/api/v1/questions/${id}`,
    OPTIONS: '/api/v1/questions/options',
    OPTION_BY_ID: (id: string) => `/api/v1/questions/options/${id}`,
    RUBRIC_CRITERIA: '/api/v1/questions/rubric-criteria',
    RUBRIC_CRITERION_BY_ID: (id: string) => `/api/v1/questions/rubric-criteria/${id}`,
    TAGS: '/api/v1/tags',
    TAG_BY_ID: (id: string) => `/api/v1/tags/${id}`,
  },

  // ── Tags ──────────────────────────────────────────────────────────────────
  TAGS: {
    ROOT: '/api/v1/tags',
    BY_ID: (id: string) => `/api/v1/tags/${id}`,
  },

  // ── Examinations ──────────────────────────────────────────────────────────
  EXAMS: {
    ROOT: '/api/v1/exams',
    ACTIVE: '/api/v1/exams/active',
    BY_ID: (id: string) => `/api/v1/exams/${id}`,
    SCHEDULE: (id: string) => `/api/v1/exams/${id}/schedule`,
    PUBLISH: (id: string) => `/api/v1/exams/${id}/publish`,
    START: (id: string) => `/api/v1/exams/${id}/start`,
    SUBMIT: (id: string) => `/api/v1/exams/${id}/submit`,
  },

  // ── Exam Attempts (Student & Lecturer) ────────────────────────────────────
  ATTEMPTS: {
    ANSWER: (attemptId: string, questionId: string) =>
      `/api/v1/attempts/${attemptId}/answers/${questionId}`,
    AUTO_SAVE_ANSWER: (attemptId: string, questionId: string) =>
      `/api/v1/attempts/${attemptId}/answers/${questionId}`,
  },

  // ── Academic Hierarchy ───────────────────────────────────────────────────
  UNIVERSITIES: {
    ROOT: '/api/v1/universities',
    BY_ID: (id: string) => `/api/v1/universities/${id}`,
  },

  COLLEGES: {
    ROOT: '/api/v1/colleges',
    BY_ID: (id: string) => `/api/v1/colleges/${id}`,
  },

  DEPARTMENTS: {
    ROOT: '/api/v1/departments',
    BY_ID: (id: string) => `/api/v1/departments/${id}`,
  },

  PROGRAMS: {
    ROOT: '/api/v1/programs',
    BY_ID: (id: string) => `/api/v1/programs/${id}`,
  },

  ACADEMIC_YEARS: {
    ROOT: '/api/v1/academic-years',
    BY_ID: (id: string) => `/api/v1/academic-years/${id}`,
  },

  SEMESTERS: {
    ROOT: '/api/v1/semesters',
    BY_ID: (id: string) => `/api/v1/semesters/${id}`,
  },

  // ── Courses & Offerings ───────────────────────────────────────────────────
  COURSES: {
    ROOT: '/api/v1/courses',
    BY_ID: (id: string) => `/api/v1/courses/${id}`,
    PREREQUISITES: '/api/v1/course-prerequisites',
    PREREQUISITE_BY_ID: (id: string) => `/api/v1/course-prerequisites/${id}`,
    MY_COURSES: '/api/v1/my-courses',
  },

  COURSE_OFFERINGS: {
    ROOT: '/api/v1/course-offerings',
    BY_ID: (id: string) => `/api/v1/course-offerings/${id}`,
    MY_COURSES: '/api/v1/my-courses',
  },

  // ── Teaching Assignments (SIMS API 7) ───────────────────────────────────────
  TEACHING_ASSIGNMENTS: {
    ROOT: '/api/v1/teaching-assignments',
    BY_ID: (id: string) => `/api/v1/teaching-assignments/${id}`,
    MY_COURSES: '/api/v1/my-courses',
  },

  // ── Enrollments ───────────────────────────────────────────────────────────
  ENROLLMENTS: {
    ROOT: '/api/v1/enrollments',
    BY_ID: (id: string) => `/api/v1/enrollments/${id}`,
    BATCH_IMPORT: '/api/v1/enrollments/batch-import',
  },

  // ── Credit Policies & Overrides (Admin) ───────────────────────────────────
  CREDIT_POLICIES: {
    ROOT: '/api/v1/credit-hour-policies',
    BY_ID: (id: string) => `/api/v1/credit-hour-policies/${id}`,
  },

  ENROLLMENT_OVERRIDES: {
    ROOT: '/api/v1/enrollment-overrides',
    BY_ID: (id: string) => `/api/v1/enrollment-overrides/${id}`,
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  NOTIFICATIONS: {
    ROOT: '/api/v1/notifications/',
    BY_ID: (id: string) => `/api/v1/notifications/${id}/`,
  },

  // ── Results & Marks ────────────────────────────────────────────────────────
  RESULTS: {
    ME: '/api/v1/results/me',
    EXAM: (id: string) => `/api/v1/results/exam/${id}`,
    MY_MARKS: '/api/v1/my-marks',
  },

  // ── Users / Students / Grades / Analytics ──────────────────────────────────────────
  USERS: {
    ROOT: '/api/v1/users',
    BY_ID: (id: string) => `/api/v1/users/${id}`,
    PROFILE: '/api/v1/users/profile',
  },

  STUDENTS: {
    ROOT: '/api/v1/students',
    BY_ID: (id: string) => `/api/v1/students/${id}`,
  },

  LECTURERS: {
    ROOT: '/api/v1/lecturers',
    BY_ID: (id: string) => `/api/v1/lecturers/${id}`,
  },

  GRADES: {
    ROOT: '/grades',
    BY_ID: (id: string) => `/grades/${id}`,
    BY_EXAM: (examId: string) => `/grades/exams/${examId}`,
    BY_STUDENT: (studentId: string) => `/grades/students/${studentId}`,
  },

  ANALYTICS: {
    ADMIN: '/api/v1/analytics/admin',
    OVERVIEW: '/analytics/overview',
    EXAM: (id: string) => `/analytics/exams/${id}`,
    EXAM_ANALYTICS: (id: string) => `/api/v1/analytics/exam/${id}`,
    ADVISING: '/api/v1/analytics/advising',
    STUDENT: (id: string) => `/analytics/students/${id}`,
  },
} as const;
