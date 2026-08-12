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
  },

  // ── SIMS DRF API v1 Endpoints ──────────────────────────────────────────────
  ENROLLMENTS: {
    ROOT: '/api/v1/enrollments',
    BY_ID: (id: string) => `/api/v1/enrollments/${id}`,
  },
  EXAMS: {
    ROOT: '/api/v1/exams',
    ACTIVE: '/api/v1/exams/active',
    BY_ID: (id: string) => `/api/v1/exams/${id}`,
    SCHEDULE: (id: string) => `/api/v1/exams/${id}/schedule`,
    START: (id: string) => `/api/v1/exams/${id}/start`,
    SUBMIT: (id: string) => `/api/v1/exams/${id}/submit`,
  },
  ATTEMPTS: {
    ANSWER: (attemptId: string, questionId: string) =>
      `/api/v1/attempts/${attemptId}/answers/${questionId}`,
  },
  COURSES: {
    ROOT: '/api/v1/courses',
    BY_ID: (id: string) => `/api/v1/courses/${id}`,
  },
  COURSE_OFFERINGS: {
    ROOT: '/api/v1/course-offerings',
    BY_ID: (id: string) => `/api/v1/course-offerings/${id}`,
  },
  ACADEMIC_YEARS: {
    ROOT: '/api/v1/academic-years',
    BY_ID: (id: string) => `/api/v1/academic-years/${id}`,
  },
  SEMESTERS: {
    ROOT: '/api/v1/semesters',
    BY_ID: (id: string) => `/api/v1/semesters/${id}`,
  },
  PROGRAMS: {
    ROOT: '/api/v1/programs',
    BY_ID: (id: string) => `/api/v1/programs/${id}`,
  },
  DEPARTMENTS: {
    ROOT: '/api/v1/departments',
    BY_ID: (id: string) => `/api/v1/departments/${id}`,
  },
  NOTIFICATIONS: {
    ROOT: '/api/v1/notifications/',
    BY_ID: (id: string) => `/api/v1/notifications/${id}/`,
  },
  // Legacy alias support
  USERS: {
    ROOT: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
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
    TAGS: '/api/v1/tags',
    TAG_BY_ID: (id: string) => `/api/v1/tags/${id}`,
  },

  // ── Grades ────────────────────────────────────────────────────────────────
  GRADES: {
    ROOT: '/grades',
    BY_ID: (id: string) => `/grades/${id}`,
    BY_EXAM: (examId: string) => `/grades/exams/${examId}`,
    BY_STUDENT: (studentId: string) => `/grades/students/${studentId}`,
  },
  ANALYTICS: {
    OVERVIEW: '/analytics/overview',
    EXAM: (id: string) => `/analytics/exams/${id}`,
    STUDENT: (id: string) => `/analytics/students/${id}`,
  },
} as const;
