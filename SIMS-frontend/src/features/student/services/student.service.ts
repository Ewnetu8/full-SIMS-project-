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
  AcademicProfileDetails,
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
   * Notifications endpoint is currently unavailable on the backend.
   * Returns empty array to maintain UI stability without dispatching invalid requests.
   */
  getNotifications: async (_isRead?: boolean): Promise<Notification[]> => {
    return Promise.resolve([]);
  },

  /**
   * No-op implementation for notification mark-as-read since endpoint is unavailable.
   */
  markNotificationAsRead: async (
    id: string
  ): Promise<NotificationMarkRead> => {
    return Promise.resolve({ id, is_read: true });
  },

  /**
   * Aggregates real academic profile details from backend endpoints.
   */
  getAcademicProfileDetails: async (): Promise<AcademicProfileDetails> => {
    try {
      const enrollments = await studentService.getEnrollments();
      
      let studentId: string | null = null;
      let department: string | null = null;
      let college: string | null = null;
      let program: string | null = null;
      let academicYear: string | null = null;
      let classStanding: string | null = null;

      if (enrollments.length > 0) {
        const first = enrollments[0];
        if (first) {
          if (first.student) {
            studentId = first.student;
          }
          const offering = first.course_offering_detail;
          if (offering) {
          const course = offering.course_detail;
          if (course) {
            if (course.intended_class_standing) {
              classStanding = course.intended_class_standing;
            }
            const prog = course.program_detail;
            if (prog) {
              program = prog.name ? `${prog.name}${prog.code ? ` (${prog.code})` : ''}` : prog.code || null;
              const dept = prog.department_detail;
              if (dept) {
                department = dept.name ? `${dept.name}${dept.code ? ` (${dept.code})` : ''}` : dept.code || null;
                if (typeof dept.college === 'string') {
                  college = dept.college;
                }
              }
            }
          }
          const semester = offering.semester_detail;
          if (semester) {
            const yearObj = semester.academic_year_detail;
            if (yearObj?.display_label) {
              academicYear = yearObj.display_label;
            } else if (semester.academic_year) {
              academicYear = semester.academic_year;
            }
          }
        }
      }
    }

      return {
        studentId,
        department,
        college,
        program,
        academicYear,
        classStanding,
        totalEnrolledCourses: enrollments.length,
      };
    } catch {
      return {
        studentId: null,
        department: null,
        college: null,
        program: null,
        academicYear: null,
        classStanding: null,
        totalEnrolledCourses: 0,
      };
    }
  },
};