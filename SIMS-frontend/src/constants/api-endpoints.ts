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
