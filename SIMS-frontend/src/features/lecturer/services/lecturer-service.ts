/**
 * Lecturer Service - Real API Integration Layer
 * 
 * Connects frontend lecturer dashboard and management components to real
 * Django REST Framework backend APIs via academic-api, examinations-api, and questions-api.
 */

import { getExamAnalytics, getExamResults } from '@/features/analytics/services/analytics-api';

import {
  listMyCourses,
  listCourseOfferings,
  getCourseOffering,
  listEnrollments,
  listDepartments,
} from './academic-api';
import {
  listExaminations,
  getExamination,
  createExamination,
  patchExamination,
  publishExamination,
  scheduleExamination,
  deleteExamination,
} from './examinations-api';
import {
  createQuestion,
  createQuestionOption,
} from './questions-api';

import type {
  Course,
  LecturerExam,
  LecturerNotification,
  LecturerStats,
  Question as UiQuestion,
  StudentSubmission,
} from '../types';
import type {
  Examination,
  Question as BackendQuestion,
  CourseOffering,
  CourseOfferingBrief,
  Enrollment,
  ListExaminationsParams,
} from '@/types/lecturer';

/**
 * Maps a Django backend Question object to the UI Question interface
 */
function transformQuestionToUi(q: BackendQuestion): UiQuestion {
  let uiType: UiQuestion['type'] = 'essay';
  if (q.question_type === 'MCQ') uiType = 'multiple_choice';
  else if (q.question_type === 'SHORT_ANSWER') uiType = 'short_answer';

  return {
    id: q.id,
    type: uiType,
    prompt: q.question_text || '',
    marks: Number(q.total_points) || 1,
    required: true,
    options: q.options?.map((o) => ({ id: o.id, text: o.option_text })),
    correctAnswer: q.options?.filter((o) => o.is_correct).map((o) => o.id),
  };
}

/**
 * Maps a Django backend Examination object to the UI LecturerExam interface
 */
function transformExamToUi(exam: Examination): LecturerExam {
  const questions = (exam.questions || []).map(transformQuestionToUi);
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0) || 100;

  return {
    id: exam.id,
    title: exam.title || 'Untitled Exam',
    courseId: exam.course_offering || '',
    courseCode: exam.course_offering_detail?.course_code || 'COURSE',
    courseName: exam.course_offering_detail?.course_title || 'Course Examination',
    description: exam.title || '',
    instructions: [
      'Ensure a stable internet connection.',
      'Answer all required questions before the timer expires.',
    ],
    durationMinutes: exam.duration_minutes || 60,
    totalMarks,
    passingScore: Math.round(totalMarks * 0.5),
    status: exam.status,
    startDate: exam.start_window || '',
    endDate: exam.end_window || '',
    randomizeQuestions: false,
    allowMultipleAttempts: false,
    autoSubmitOnTimeout: true,
    showResultsAfterSubmission: false,
    questions,
    createdAt: exam.created_at || '',
    updatedAt: exam.updated_at || '',
  };
}

/**
 * Maps a Django CourseOfferingBrief (from GET /api/v1/my-courses) + enrollments + exams into the UI Course interface
 */
function transformBriefToUiCourse(
  brief: CourseOfferingBrief,
  allEnrollments: Enrollment[],
  allExams: Examination[]
): Course {
  const offeringEnrollments = allEnrollments.filter(
    (e) => e.course_offering === brief.id && e.status === 'ENROLLED'
  );
  const offeringExams = allExams.filter((e) => e.course_offering === brief.id);

  return {
    id: brief.id,
    code: brief.course_code || 'COURSE',
    name: brief.course_title || 'Unnamed Course',
    semester: brief.semester_index || 'FIRST',
    academicYear: brief.semester || '2024-2025',
    studentCount: offeringEnrollments.length,
    examCount: offeringExams.length,
    description: brief.course_title || '',
    section: brief.section,
  };
}

/**
 * Maps a Django CourseOffering + enrollments + exams into the UI Course interface
 */
function transformOfferingToUiCourse(
  offering: CourseOffering,
  allEnrollments: Enrollment[],
  allExams: Examination[]
): Course {
  const offeringEnrollments = allEnrollments.filter(
    (e) => e.course_offering === offering.id && e.status === 'ENROLLED'
  );
  const offeringExams = allExams.filter((e) => e.course_offering === offering.id);

  return {
    id: offering.id,
    code: offering.course_detail?.course_code || 'COURSE',
    name: offering.course_detail?.title || 'Unnamed Course',
    semester: offering.semester_detail?.semester_index || 'FIRST',
    academicYear: offering.semester_detail?.academic_year_detail?.display_label || '2024-2025',
    studentCount: offeringEnrollments.length,
    examCount: offeringExams.length,
    description: offering.course_detail?.title || '',
    section: offering.section || 'A',
    capacity: offering.capacity,
    creditHours: offering.course_detail?.credit_hours,
    intendedClassStanding: offering.course_detail?.intended_class_standing,
    programName: offering.course_detail?.program_detail?.name,
  };
}

export const lecturerService = {
  /**
   * Get lecturer dashboard statistics calculated from real backend data.
   * Total courses count is derived from the lecturer's assigned courses (/api/v1/my-courses).
   */
  async getStats(): Promise<LecturerStats> {
    try {
      const [myCoursesRes, enrollmentsRes, examsRes] = await Promise.allSettled([
        listMyCourses(),
        listEnrollments(),
        listExaminations(),
      ]);

      const myCourses = myCoursesRes.status === 'fulfilled' ? myCoursesRes.value : [];
      const enrollments = enrollmentsRes.status === 'fulfilled' ? enrollmentsRes.value : [];
      const exams = examsRes.status === 'fulfilled' ? examsRes.value : [];

      const assignedCourseIds = new Set(myCourses.map((c) => c.id));
      const activeExams = exams.filter(
        (e) => (e.status === 'ACTIVE' || e.status === 'PUBLISHED') && (assignedCourseIds.size === 0 || assignedCourseIds.has(e.course_offering))
      ).length;
      const enrolledStudentsCount = enrollments.filter(
        (e) => e.status === 'ENROLLED' && (assignedCourseIds.size === 0 || assignedCourseIds.has(e.course_offering))
      ).length;

      return {
        totalStudents: enrolledStudentsCount,
        totalCourses: myCourses.length,
        activeExams,
        pendingGrading: 0,
      };
    } catch (err) {
      console.error('Error fetching stats:', err);
      return {
        totalStudents: 0,
        totalCourses: 0,
        activeExams: 0,
        pendingGrading: 0,
      };
    }
  },

  /**
   * Get raw course offerings from backend
   */
  async getCourseOfferings(): Promise<CourseOffering[]> {
    return listCourseOfferings();
  },

  /**
   * Get single course offering by ID from backend
   */
  async getCourseOfferingById(id: string): Promise<CourseOffering> {
    return getCourseOffering(id);
  },

  /**
   * Get lecturer's active assigned course offerings mapped to UI Course domain.
   * Source of truth: GET /api/v1/my-courses
   */
  async getCourses(): Promise<Course[]> {
    const [myCourses, enrollments, exams] = await Promise.all([
      listMyCourses().catch((err) => {
        console.error('Error fetching lecturer assigned courses:', err);
        throw err;
      }),
      listEnrollments().catch(() => [] as Enrollment[]),
      listExaminations().catch(() => [] as Examination[]),
    ]);

    return myCourses.map((brief) => transformBriefToUiCourse(brief, enrollments, exams));
  },

  /**
   * Get course offering by ID mapped to UI Course domain
   */
  async getCourseById(id: string): Promise<Course | null> {
    try {
      const [offering, enrollments, exams] = await Promise.all([
        getCourseOffering(id),
        listEnrollments().catch(() => [] as Enrollment[]),
        listExaminations().catch(() => [] as Examination[]),
      ]);

      if (!offering) return null;
      return transformOfferingToUiCourse(offering, enrollments, exams);
    } catch (err) {
      console.error(`Error fetching course ${id}:`, err);
      throw err;
    }
  },

  /**
   * Get course offering full details including real enrollments and associated examinations
   */
  async getCourseOfferingWithDetails(id: string): Promise<{
    offering: CourseOffering;
    course: Course;
    enrollments: Enrollment[];
    exams: LecturerExam[];
  }> {
    const [offering, allEnrollments, courseExamsList] = await Promise.all([
      getCourseOffering(id),
      listEnrollments().catch(() => [] as Enrollment[]),
      listExaminations({ course_offering: id }).catch(() => [] as Examination[]),
    ]);

    const courseEnrollments = allEnrollments.filter((e) => e.course_offering === id);
    const courseExams = courseExamsList.map(transformExamToUi);
    const course = transformOfferingToUiCourse(offering, allEnrollments, courseExamsList);

    return {
      offering,
      course,
      enrollments: courseEnrollments,
      exams: courseExams,
    };
  },

  /**
   * Get lecturer's exams from backend with optional filters (status, course_offering)
   */
  async getExams(params?: ListExaminationsParams): Promise<LecturerExam[]> {
    try {
      const exams = await listExaminations(params);
      return exams.map(transformExamToUi);
    } catch (err) {
      console.error('Error fetching examinations:', err);
      throw err;
    }
  },

  /**
   * Get exam by ID from backend
   */
  async getExamById(id: string): Promise<LecturerExam | null> {
    try {
      const exam = await getExamination(id);
      if (!exam) return null;
      return transformExamToUi(exam);
    } catch {
      return null;
    }
  },

  /**
   * Delete an exam (only allowed for DRAFT exams in backend)
   */
  async deleteExam(id: string): Promise<void> {
    await deleteExamination(id);
  },

  /**
   * Publish examination results.
   * Only allowed when status is CLOSED and all attempts are fully graded.
   */
  async publishExamResults(id: string): Promise<LecturerExam> {
    const published = await publishExamination(id);
    return transformExamToUi(published);
  },

  /**
   * Legacy alias for publishExamResults
   */
  async togglePublishExam(id: string): Promise<LecturerExam> {
    return this.publishExamResults(id);
  },

  /**
   * Save (create or update) an examination and its questions to backend.
   * New examinations are always created in DRAFT.
   */
  async saveExam(data: Partial<LecturerExam>): Promise<LecturerExam> {
    const courseOfferingId = data.courseId;
    if (!courseOfferingId) {
      throw new Error('Course offering is required to save an examination.');
    }

    const now = new Date();
    const startWindow = data.startDate || now.toISOString();
    const endDateObj = data.endDate ? new Date(data.endDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endWindow = endDateObj.toISOString();

    let exam: Examination;

    if (data.id) {
      exam = await patchExamination(data.id, {
        title: data.title || 'Untitled Exam',
        start_window: startWindow,
        end_window: endWindow,
        duration_minutes: data.durationMinutes || 60,
      });
    } else {
      exam = await createExamination({
        course_offering: courseOfferingId,
        title: data.title || 'Untitled Exam',
        start_window: startWindow,
        end_window: endWindow,
        duration_minutes: data.durationMinutes || 60,
      });
    }

    // Persist questions if provided
    if (data.questions && data.questions.length > 0) {
      for (const q of data.questions) {
        let backendType: 'MCQ' | 'SHORT_ANSWER' | 'ESSAY' = 'ESSAY';
        if (q.type === 'multiple_choice' || q.type === 'multiple_select' || q.type === 'true_false') {
          backendType = 'MCQ';
        } else if (q.type === 'short_answer') {
          backendType = 'SHORT_ANSWER';
        }

        const createdQuestion = await createQuestion({
          examination: exam.id,
          question_text: q.prompt,
          question_type: backendType,
          total_points: q.marks,
        });

        // Add MCQ options if available
        if (backendType === 'MCQ' && q.options && q.options.length > 0) {
          for (const opt of q.options) {
            const isCorrect = Array.isArray(q.correctAnswer)
              ? q.correctAnswer.includes(opt.id)
              : q.correctAnswer === opt.id;

            await createQuestionOption({
              question: createdQuestion.id,
              option_text: opt.text,
              is_correct: Boolean(isCorrect),
            });
          }
        }
      }

      // Re-fetch exam to get nested updated questions
      exam = await getExamination(exam.id);
    }

    return transformExamToUi(exam);
  },

  /**
   * Duplicate an exam through supported frontend API orchestration:
   * 1. Fetches the existing exam.
   * 2. Creates a new DRAFT examination with copied fields and fresh timestamps.
   * 3. Clones the questions and options for the new exam.
   */
  async duplicateExam(examId: string): Promise<LecturerExam | null> {
    try {
      const original = await getExamination(examId);
      if (!original) return null;

      const now = new Date();
      const defaultStart = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      const defaultEnd = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString();

      const duplicated = await createExamination({
        course_offering: original.course_offering,
        title: `${original.title} (Copy)`,
        start_window: original.start_window || defaultStart,
        end_window: original.end_window || defaultEnd,
        duration_minutes: original.duration_minutes || 60,
      });

      // Clone questions if present
      if (original.questions && original.questions.length > 0) {
        for (const q of original.questions) {
          const createdQ = await createQuestion({
            examination: duplicated.id,
            question_text: q.question_text,
            question_type: q.question_type,
            total_points: q.total_points,
          });

          if (q.options && q.options.length > 0) {
            for (const opt of q.options) {
              await createQuestionOption({
                question: createdQ.id,
                option_text: opt.option_text,
                is_correct: opt.is_correct,
              });
            }
          }
        }
      }

      const finalExam = await getExamination(duplicated.id);
      return transformExamToUi(finalExam);
    } catch (err) {
      console.error('Failed to duplicate exam:', err);
      throw err;
    }
  },

  /**
   * Get student submissions for an exam.
   * Fallback for backend routes not available.
   */
  async getSubmissions(examId?: string): Promise<StudentSubmission[]> {
    return [];
  },

  /**
   * Get notifications.
   * Fallback for backend routes not available.
   */
  async getNotifications(): Promise<LecturerNotification[]> {
    return [];
  },

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(id: string): Promise<void> {
    // No-op
  },

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<void> {
    // No-op
  },

  /**
   * Get exam analytics directly from backend endpoint GET /api/v1/analytics/exam/{id}
   */
  async getExamAnalytics(examId: string) {
    return getExamAnalytics(examId);
  },

  /**
   * Get exam results directly from backend endpoint GET /api/v1/results/exam/{id}
   */
  async getExamResults(examId: string) {
    return getExamResults(examId);
  },

  /**
   * Get recent activity
   */
  async getRecentActivity(): Promise<unknown[]> {
    return [];
  },

  /**
   * Schedule exam window via POST /api/v1/exams/{id}/schedule
   */
  async scheduleExam(
    examId: string,
    data: {
      start_window?: string;
      end_window?: string;
      duration_minutes?: number;
      startDate?: string;
      endDate?: string;
      durationMinutes?: number;
    }
  ): Promise<LecturerExam> {
    const startWindow = data.start_window || data.startDate;
    const endWindow = data.end_window || data.endDate;
    const durationMinutes = data.duration_minutes ?? data.durationMinutes ?? 60;

    if (!startWindow || !endWindow) {
      throw new Error('Start and End dates are required for scheduling.');
    }

    const scheduled = await scheduleExamination(examId, {
      start_window: new Date(startWindow).toISOString(),
      end_window: new Date(endWindow).toISOString(),
      duration_minutes: Number(durationMinutes),
    });

    return transformExamToUi(scheduled);
  },

  /**
   * Get academic profile details for the authenticated lecturer from real backend endpoints
   */
  async getProfileDetails(): Promise<{
    departmentName?: string;
    collegeName?: string;
    assignedCoursesCount: number;
    totalStudentsCount: number;
    activeExamsCount: number;
    courses: Course[];
  }> {
    try {
      const [courses, stats] = await Promise.all([
        this.getCourses(),
        this.getStats(),
      ]);

      let departmentName: string | undefined = undefined;
      let collegeName: string | undefined = undefined;

      try {
        const departments = await listDepartments();
        if (departments.length > 0 && departments[0]) {
          departmentName = departments[0].name;
          const college = departments[0].college_detail;
          if (college && typeof college === 'object' && 'name' in college && college.name) {
            collegeName = college.name;
          }
        }
      } catch {
        // Silently ignore if department list fails or requires admin scope
      }

      return {
        departmentName,
        collegeName,
        assignedCoursesCount: courses.length,
        totalStudentsCount: stats.totalStudents,
        activeExamsCount: stats.activeExams,
        courses,
      };
    } catch (err) {
      console.error('Error fetching lecturer profile details:', err);
      return {
        assignedCoursesCount: 0,
        totalStudentsCount: 0,
        activeExamsCount: 0,
        courses: [],
      };
    }
  },
};
