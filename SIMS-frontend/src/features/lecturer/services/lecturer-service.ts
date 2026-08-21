/**
 * Lecturer Service - Real API Integration Layer
 * 
 * Connects frontend lecturer dashboard and management components to real
 * Django REST Framework backend APIs via academic-api, examinations-api, and questions-api.
 */

import {
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
  deleteExamination,
} from './examinations-api';
import {
  createQuestion,
  createQuestionOption,
  deleteQuestion,
} from './questions-api';
import { getExamAnalytics, getExamResults } from '@/features/analytics/services/analytics-api';

import type { Examination, Question as BackendQuestion, CourseOffering, Enrollment } from '@/types/lecturer';
import type { Course, LecturerExam, LecturerNotification, LecturerStats, LecturerAnalytics, Question as UiQuestion, StudentSubmission } from '../types';

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
  };
}

export const lecturerService = {
  /**
   * Get lecturer dashboard statistics calculated from real backend data
   */
  async getStats(): Promise<LecturerStats> {
    try {
      const [offeringsRes, enrollmentsRes, examsRes] = await Promise.allSettled([
        listCourseOfferings(),
        listEnrollments(),
        listExaminations(),
      ]);

      const offerings = offeringsRes.status === 'fulfilled' ? offeringsRes.value : [];
      const enrollments = enrollmentsRes.status === 'fulfilled' ? enrollmentsRes.value : [];
      const exams = examsRes.status === 'fulfilled' ? examsRes.value : [];

      const activeExams = exams.filter((e) => e.status === 'ACTIVE' || e.status === 'PUBLISHED').length;
      const enrolledStudentsCount = enrollments.filter((e) => e.status === 'ENROLLED').length;

      return {
        totalStudents: enrolledStudentsCount,
        totalCourses: offerings.length,
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
   * Get lecturer's course offerings
   */
  async getCourses(): Promise<Course[]> {
    try {
      const [offeringsRes, enrollmentsRes, examsRes] = await Promise.allSettled([
        listCourseOfferings(),
        listEnrollments(),
        listExaminations(),
      ]);

      const offerings = offeringsRes.status === 'fulfilled' ? offeringsRes.value : [];
      const enrollments = enrollmentsRes.status === 'fulfilled' ? enrollmentsRes.value : [];
      const exams = examsRes.status === 'fulfilled' ? examsRes.value : [];

      return offerings.map((o) => transformOfferingToUiCourse(o, enrollments, exams));
    } catch (err) {
      console.error('Error fetching courses:', err);
      return [];
    }
  },

  /**
   * Get course offering by ID
   */
  async getCourseById(id: string): Promise<Course | null> {
    try {
      const [offeringRes, enrollmentsRes, examsRes] = await Promise.allSettled([
        getCourseOffering(id),
        listEnrollments(),
        listExaminations(),
      ]);

      const offering = offeringRes.status === 'fulfilled' ? offeringRes.value : null;
      const enrollments = enrollmentsRes.status === 'fulfilled' ? enrollmentsRes.value : [];
      const exams = examsRes.status === 'fulfilled' ? examsRes.value : [];

      if (!offering) return null;
      return transformOfferingToUiCourse(offering, enrollments, exams);
    } catch (err) {
      console.error(`Error fetching course ${id}:`, err);
      return null;
    }
  },

  /**
   * Get lecturer's exams from backend
   */
  async getExams(): Promise<LecturerExam[]> {
    try {
      const exams = await listExaminations();
      return exams.map(transformExamToUi);
    } catch {
      return [];
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
   * Toggle or transition exam status strictly enforcing Django lifecycle:
   * DRAFT -> SCHEDULED -> ACTIVE -> CLOSED -> PUBLISHED (via publish endpoint)
   */
  async togglePublishExam(id: string): Promise<LecturerExam | null> {
    try {
      const current = await getExamination(id);
      if (!current) return null;

      if (current.status === 'CLOSED') {
        const published = await publishExamination(id);
        return transformExamToUi(published);
      }

      let nextStatus: Examination['status'] = 'SCHEDULED';
      if (current.status === 'DRAFT') nextStatus = 'SCHEDULED';
      else if (current.status === 'SCHEDULED') nextStatus = 'ACTIVE';
      else if (current.status === 'ACTIVE') nextStatus = 'CLOSED';
      else if (current.status === 'PUBLISHED') nextStatus = 'DRAFT';

      const updated = await patchExamination(id, { status: nextStatus });
      return transformExamToUi(updated);
    } catch (err: any) {
      console.error('Failed to update/publish exam status:', err);
      throw err;
    }
  },


  /**
   * Save (create or update) an examination and its questions to backend
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
   * Duplicate an exam
   */
  async duplicateExam(examId: string): Promise<LecturerExam | null> {
    try {
      const original = await getExamination(examId);
      if (!original) return null;

      const duplicated = await createExamination({
        course_offering: original.course_offering,
        title: `${original.title} (Copy)`,
        start_window: original.start_window,
        end_window: original.end_window,
        duration_minutes: original.duration_minutes,
      });

      return transformExamToUi(duplicated);
    } catch {
      return null;
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
  async getRecentActivity(): Promise<any[]> {
    return [];
  },

  /**
   * Schedule exam window
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
  ): Promise<void> {
    const startWindow = data.start_window || data.startDate || new Date().toISOString();
    const endWindow = data.end_window || data.endDate || new Date(Date.now() + 86400000).toISOString();
    const durationMinutes = data.duration_minutes ?? data.durationMinutes ?? 60;

    await patchExamination(examId, {
      start_window: startWindow,
      end_window: endWindow,
      duration_minutes: durationMinutes,
    });
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
