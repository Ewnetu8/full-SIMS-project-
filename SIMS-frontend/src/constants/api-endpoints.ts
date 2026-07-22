// ─── API Endpoint Constants ───────────────────────────────────────────────────
// These are path fragments appended to the Axios base URL.
// The base URL itself is configured via the NEXT_PUBLIC_API_URL env variable.

export const API_ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    ME: '/auth/me',
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  USERS: {
    ROOT: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
  },

  // ── Exams ─────────────────────────────────────────────────────────────────
  EXAMS: {
    ROOT: '/exams',
    BY_ID: (id: string) => `/exams/${id}`,
    SUBMIT: (id: string) => `/exams/${id}/submit`,
    RESULTS: (id: string) => `/exams/${id}/results`,
    QUESTIONS: (id: string) => `/exams/${id}/questions`,
  },

  // ── Grades ────────────────────────────────────────────────────────────────
  GRADES: {
    ROOT: '/grades',
    BY_ID: (id: string) => `/grades/${id}`,
    BY_EXAM: (examId: string) => `/grades/exams/${examId}`,
    BY_STUDENT: (studentId: string) => `/grades/students/${studentId}`,
  },

  // ── Analytics ─────────────────────────────────────────────────────────────
  ANALYTICS: {
    OVERVIEW: '/analytics/overview',
    EXAM: (id: string) => `/analytics/exams/${id}`,
    STUDENT: (id: string) => `/analytics/students/${id}`,
  },

  // ── Departments ───────────────────────────────────────────────────────────
  DEPARTMENTS: {
    ROOT: '/departments',
    BY_ID: (id: string) => `/departments/${id}`,
  },
} as const;
