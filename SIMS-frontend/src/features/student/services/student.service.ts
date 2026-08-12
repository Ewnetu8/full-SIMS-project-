import { api } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type {
  Enrollment,
  Examination,
  ExamAttempt,
  StudentAnswerRequest,
  StudentAnswer,
  SubmitExamRequest,
  Semester,
  AcademicYear,
  Program,
  Department,
  Course,
  CourseOffering,
  Notification,
  NotificationMarkRead,
  NotificationMarkReadRequest,
} from '../types/student.types';

export const studentService = {
  /**
   * GET /api/v1/enrollments
   * Returns student's enrollments containing course offering, status, and grade.
   */
  getEnrollments: async (): Promise<Enrollment[]> => {
    const data = await api.get<Enrollment[]>(API_ENDPOINTS.ENROLLMENTS.ROOT);
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/v1/exams/active
   * Returns active examinations available to the student.
   */
  getActiveExams: async (): Promise<Examination[]> => {
    const data = await api.get<Examination[]>(API_ENDPOINTS.EXAMS.ACTIVE);
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/v1/exams/{id}
   * Retrieves exam details.
   */
  getExamDetails: async (id: string): Promise<Examination> => {
    return await api.get<Examination>(API_ENDPOINTS.EXAMS.BY_ID(id));
  },

  /**
   * POST /api/v1/exams/{id}/start
   * Starts an examination attempt for the logged-in student.
   */
  startExam: async (id: string): Promise<ExamAttempt> => {
    return await api.post<ExamAttempt>(API_ENDPOINTS.EXAMS.START(id), {});
  },

  /**
   * PUT /api/v1/attempts/{attempt_pk}/answers/{question_pk}
   * Auto-save a student answer (upsert).
   */
  saveAnswer: async (
    attemptId: string,
    questionId: string,
    payload: StudentAnswerRequest
  ): Promise<StudentAnswer> => {
    return await api.put<StudentAnswer>(
      API_ENDPOINTS.ATTEMPTS.ANSWER(attemptId, questionId),
      payload
    );
  },

  /**
   * POST /api/v1/exams/{id}/submit
   * Submits and freezes an exam attempt.
   */
  submitExam: async (
    id: string,
    payload: SubmitExamRequest = { is_disrupted: false }
  ): Promise<ExamAttempt> => {
    return await api.post<ExamAttempt>(
      API_ENDPOINTS.EXAMS.SUBMIT(id),
      payload
    );
  },

  /**
   * GET /api/v1/semesters
   */
  getSemesters: async (): Promise<Semester[]> => {
    const data = await api.get<Semester[]>(API_ENDPOINTS.SEMESTERS.ROOT);
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/v1/academic-years
   */
  getAcademicYears: async (): Promise<AcademicYear[]> => {
    const data = await api.get<AcademicYear[]>(API_ENDPOINTS.ACADEMIC_YEARS.ROOT);
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/v1/programs
   */
  getPrograms: async (): Promise<Program[]> => {
    const data = await api.get<Program[]>(API_ENDPOINTS.PROGRAMS.ROOT);
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/v1/departments
   */
  getDepartments: async (): Promise<Department[]> => {
    const data = await api.get<Department[]>(API_ENDPOINTS.DEPARTMENTS.ROOT);
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/v1/courses
   */
  getCourses: async (): Promise<Course[]> => {
    const data = await api.get<Course[]>(API_ENDPOINTS.COURSES.ROOT);
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/v1/course-offerings
   */
  getCourseOfferings: async (): Promise<CourseOffering[]> => {
    const data = await api.get<CourseOffering[]>(API_ENDPOINTS.COURSE_OFFERINGS.ROOT);
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/v1/notifications/
   * Returns notifications for authenticated student, ordered by newest first.
   */
  getNotifications: async (isRead?: boolean): Promise<Notification[]> => {
    const query = typeof isRead === 'boolean' ? `?is_read=${isRead}` : '';
    const url = `${API_ENDPOINTS.NOTIFICATIONS.ROOT}${query}`;
    const data = await api.get<Notification[]>(url);
    return Array.isArray(data) ? data : [];
  },

  /**
   * PATCH /api/v1/notifications/{id}/
   * Marks a single notification as read.
   */
  markNotificationAsRead: async (
    id: string
  ): Promise<NotificationMarkRead> => {
    return await api.patch<NotificationMarkRead>(
      API_ENDPOINTS.NOTIFICATIONS.BY_ID(id),
      { is_read: true }
    );
  },

  /**
   * Helper to get initial student profile details.
   */
  getProfile: () => ({
    fullName: 'Amina Njeri',
    studentId: 'ETS0001/16',
    email: 'student@sims.com',
    department: 'Software Engineering & AI',
    program: 'B.Sc. in Software Engineering',
    yearOfStudy: 'Year 2 (Sophomore)',
  }),
};