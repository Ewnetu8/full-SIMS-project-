import { api } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { useAuthStore } from '@/features/auth/store';
import { resolveStudentIdentifier, isValidUuid } from '@/lib/user-identifier';
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
  Result,
  CourseOfferingMarksGroup,
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
   * GET /api/v1/enrollments/{id}
   * Retrieves a single enrollment record for the authenticated student.
   */
  getEnrollmentById: async (id: string): Promise<Enrollment> => {
    return await api.get<Enrollment>(API_ENDPOINTS.ENROLLMENTS.BY_ID(id));
  },

  /**
   * GET /api/v1/courses/{id}
   * Retrieves course details.
   */
  getCourseById: async (id: string): Promise<Course> => {
    return await api.get<Course>(API_ENDPOINTS.COURSES.BY_ID(id));
  },

  /**
   * GET /api/v1/course-offerings/{id}
   * Retrieves course offering details.
   */
  getCourseOfferingById: async (id: string): Promise<CourseOffering> => {
    return await api.get<CourseOffering>(API_ENDPOINTS.COURSE_OFFERINGS.BY_ID(id));
  },

  /**
   * GET /api/v1/exams/active
   * Returns active examinations available to the student for their enrolled courses.
   */
  getActiveExams: async (): Promise<Examination[]> => {
    try {
      const activeData = await api.get<Examination[]>(API_ENDPOINTS.EXAMS.ACTIVE);
      if (Array.isArray(activeData) && activeData.length > 0) {
        return activeData;
      }
    } catch (err) {
      console.warn('GET /api/v1/exams/active failed or returned error, falling back to /exams:', err);
    }

    try {
      const listData = await api.get<Examination[]>(API_ENDPOINTS.EXAMS.ROOT, {
        params: { status: 'ACTIVE' },
      });
      return Array.isArray(listData) ? listData : [];
    } catch {
      return [];
    }
  },

  /**
   * GET /api/v1/exams
   * Lists examinations for student's enrolled courses.
   */
  getExams: async (params?: { status?: string; course_offering?: string }): Promise<Examination[]> => {
    const data = await api.get<Examination[]>(API_ENDPOINTS.EXAMS.ROOT, { params });
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
   * Fetches real user notifications from Django REST backend.
   */
  getNotifications: async (isRead?: boolean): Promise<Notification[]> => {
    const query = typeof isRead === 'boolean' ? `?is_read=${isRead}` : '';
    const response = await api.get<any>(`${API_ENDPOINTS.NOTIFICATIONS.ROOT}${query}`);
    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray(response.results)) {
      return response.results;
    }
    return [];
  },

  /**
   * PATCH /api/v1/notifications/{id}/
   * Marks a single notification as read on backend.
   */
  markNotificationAsRead: async (id: string): Promise<NotificationMarkRead> => {
    return await api.patch<NotificationMarkRead>(
      API_ENDPOINTS.NOTIFICATIONS.BY_ID(id),
      { is_read: true }
    );
  },

  /**
   * Aggregates real academic profile details from backend endpoints.
   */
  getAcademicProfileDetails: async (): Promise<AcademicProfileDetails> => {
    try {
      const enrollments = await studentService.getEnrollments();
      const authUser = useAuthStore.getState().user;

      // Resolve student identifier authentically (ensuring UUID is never used)
      let studentId: string | null = resolveStudentIdentifier(authUser);
      let department: string | null = null;
      let college: string | null = null;
      let program: string | null = null;
      let academicYear: string | null = null;
      let classStanding: string | null = null;

      if (enrollments.length > 0) {
        const first = enrollments[0];
        if (first) {
          // If first.student is a human-readable identifier and not a UUID, use it
          if (first.student && !isValidUuid(first.student)) {
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

  /**
   * GET /api/v1/results/me
   * Retrieves official graded examination results for the authenticated student.
   */
  getMyResults: async (): Promise<Result[]> => {
    const data = await api.get<Result[]>(API_ENDPOINTS.RESULTS.ME);
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/v1/my-marks
   * Retrieves continuous assessment marks grouped by course offering for the authenticated student.
   */
  getMyMarks: async (): Promise<CourseOfferingMarksGroup[]> => {
    const data = await api.get<CourseOfferingMarksGroup[]>(API_ENDPOINTS.RESULTS.MY_MARKS);
    return Array.isArray(data) ? data : [];
  },
};