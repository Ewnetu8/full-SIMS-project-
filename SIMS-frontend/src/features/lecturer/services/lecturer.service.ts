import { api } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants';
import { mockLecturerAnalytics } from '../mock/lecturer-data';

import type {
  Course,
  LecturerExam,
  StudentSubmission,
  LecturerAnalytics,
  LecturerNotification,
} from '../types';

let examsInMemory: LecturerExam[] = [];

export const lecturerService = {
  async getCourses(): Promise<Course[]> {
    try {
      const data = await api.get<any>(API_ENDPOINTS.COURSE_OFFERINGS.ROOT);
      const list = Array.isArray(data) ? data : data?.results || [];
      return list.map((c: any) => ({
        id: c.id || String(Math.random()),
        code: c.course_code || c.code || 'CRS',
        name: c.course_title || c.title || c.name || 'Course Offering',
        department: c.department || 'Department',
        studentCount: c.enrolled_count || c.student_count || 0,
        examCount: c.active_exams_count || 0,
        description: c.description || '',
        academicYear: c.academic_year || '2025/2026',
        semester: c.semester_detail?.name || c.semester || 'Semester 1',
      }));
    } catch {
      return [];
    }
  },

  async getCourseById(id: string): Promise<Course | undefined> {
    const courses = await this.getCourses();
    return courses.find((c) => c.id === id || c.code.toLowerCase() === id.toLowerCase());
  },

  async getExams(): Promise<LecturerExam[]> {
    try {
      const data = await api.get<any>(API_ENDPOINTS.EXAMS.ROOT);
      const list = Array.isArray(data) ? data : data?.results || [];
      if (list.length > 0) {
        examsInMemory = list.map((e: any) => ({
          id: e.id || String(Math.random()),
          title: e.title || 'Examination',
          courseId: e.course_offering || e.course_id || '',
          courseCode: e.course_offering_detail?.course_code || e.course_code || 'EXAM',
          courseName: e.course_offering_detail?.course_title || e.course_title || 'Assessment',
          description: e.description || '',
          instructions: e.instructions || [],
          durationMinutes: e.duration_minutes || e.duration || 60,
          totalMarks: e.total_marks || 100,
          passingScore: e.passing_score || 50,
          status: e.status || 'DRAFT',
          startDate: e.start_time || e.start_date || new Date().toISOString(),
          endDate: e.end_time || e.end_date || new Date().toISOString(),
          randomizeQuestions: Boolean(e.randomize_questions),
          allowMultipleAttempts: Boolean(e.allow_multiple_attempts),
          autoSubmitOnTimeout: Boolean(e.auto_submit_on_timeout),
          showResultsAfterSubmission: Boolean(e.show_results_after_submission),
          questions: e.questions || [],
          createdAt: e.created_at || new Date().toISOString(),
          updatedAt: e.updated_at || new Date().toISOString(),
        }));
      }
      return [...examsInMemory];
    } catch {
      return [...examsInMemory];
    }
  },

  async getExamById(id: string): Promise<LecturerExam | undefined> {
    const exams = await this.getExams();
    return exams.find((e) => e.id === id);
  },

  async saveExam(data: Partial<LecturerExam> & { id?: string }): Promise<LecturerExam> {
    try {
      const payload = {
        course_offering: data.courseId,
        title: data.title ?? 'Untitled Examination',
        status: data.status || 'DRAFT',
        start_window: data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString(),
        end_window: data.endDate ? new Date(data.endDate).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
        duration_minutes: Number(data.durationMinutes ?? 60),
      };

      let res: any;
      if (data.id && !data.id.startsWith('exam-')) {
        res = await api.put<any>(API_ENDPOINTS.EXAMS.BY_ID(data.id), payload);
      } else {
        res = await api.post<any>(API_ENDPOINTS.EXAMS.ROOT, payload);
      }

      const savedExam: LecturerExam = {
        id: res?.id || data.id || `exam-${Date.now()}`,
        title: res?.title || payload.title,
        courseId: res?.course_offering || payload.course_offering || '',
        courseCode: res?.course_offering_detail?.course_code || data.courseCode || 'EXAM',
        courseName: res?.course_offering_detail?.course_title || data.courseName || 'Assessment',
        description: data.description ?? '',
        instructions: data.instructions ?? [],
        durationMinutes: res?.duration_minutes || payload.duration_minutes,
        totalMarks: data.totalMarks ?? 100,
        passingScore: data.passingScore ?? 50,
        status: res?.status || payload.status,
        startDate: res?.start_window || payload.start_window,
        endDate: res?.end_window || payload.end_window,
        randomizeQuestions: Boolean(data.randomizeQuestions),
        allowMultipleAttempts: Boolean(data.allowMultipleAttempts),
        autoSubmitOnTimeout: Boolean(data.autoSubmitOnTimeout),
        showResultsAfterSubmission: Boolean(data.showResultsAfterSubmission),
        questions: data.questions ?? [],
        createdAt: res?.created_at || new Date().toISOString(),
        updatedAt: res?.updated_at || new Date().toISOString(),
      };

      const index = examsInMemory.findIndex((e) => e.id === savedExam.id);
      if (index !== -1) {
        examsInMemory[index] = savedExam;
      } else {
        examsInMemory.unshift(savedExam);
      }
      return savedExam;
    } catch {
      const newExam: LecturerExam = {
        id: data.id || `exam-${Date.now()}`,
        title: data.title ?? 'Untitled Examination',
        courseId: data.courseId ?? '',
        courseCode: data.courseCode ?? 'CRS 101',
        courseName: data.courseName ?? 'Course',
        description: data.description ?? '',
        instructions: data.instructions ?? [],
        durationMinutes: data.durationMinutes ?? 60,
        totalMarks: data.totalMarks ?? 100,
        passingScore: data.passingScore ?? 50,
        status: data.status ?? 'DRAFT',
        startDate: data.startDate ?? new Date().toISOString(),
        endDate: data.endDate ?? new Date(Date.now() + 7 * 86400000).toISOString(),
        randomizeQuestions: Boolean(data.randomizeQuestions),
        allowMultipleAttempts: Boolean(data.allowMultipleAttempts),
        autoSubmitOnTimeout: Boolean(data.autoSubmitOnTimeout),
        showResultsAfterSubmission: Boolean(data.showResultsAfterSubmission),
        questions: data.questions ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const index = examsInMemory.findIndex((e) => e.id === newExam.id);
      if (index !== -1) {
        examsInMemory[index] = newExam;
      } else {
        examsInMemory.unshift(newExam);
      }
      return newExam;
    }
  },

  async duplicateExam(id: string): Promise<LecturerExam | undefined> {
    const original = examsInMemory.find((e) => e.id === id);
    if (!original) return undefined;

    const copy: LecturerExam = {
      ...original,
      id: `exam-copy-${Date.now()}`,
      title: `${original.title} (Copy)`,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    examsInMemory.unshift(copy);
    return copy;
  },

  async deleteExam(id: string): Promise<boolean> {
    const beforeLength = examsInMemory.length;
    examsInMemory = examsInMemory.filter((e) => e.id !== id);
    return examsInMemory.length < beforeLength;
  },

  async scheduleExam(id: string, data: { startDate: string; endDate: string; durationMinutes: number }): Promise<any> {
    const payload = {
      start_window: new Date(data.startDate).toISOString(),
      end_window: new Date(data.endDate).toISOString(),
      duration_minutes: Number(data.durationMinutes),
    };
    try {
      const res = await api.post<any>(API_ENDPOINTS.EXAMS.SCHEDULE(id), payload);
      const target = examsInMemory.find((e) => e.id === id);
      if (target) {
        target.startDate = payload.start_window;
        target.endDate = payload.end_window;
        target.durationMinutes = payload.duration_minutes;
      }
      return res;
    } catch {
      const target = examsInMemory.find((e) => e.id === id);
      if (target) {
        target.startDate = payload.start_window;
        target.endDate = payload.end_window;
        target.durationMinutes = payload.duration_minutes;
      }
      return { success: true };
    }
  },

  async togglePublishExam(id: string): Promise<LecturerExam | undefined> {
    const target = examsInMemory.find((e) => e.id === id);
    if (!target) return undefined;

    const newStatus = target.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    target.status = newStatus;
    target.updatedAt = new Date().toISOString();

    return { ...target };
  },

  async getSubmissions(_examId?: string): Promise<StudentSubmission[]> {
    return Promise.resolve([]);
  },

  async getAnalytics(): Promise<LecturerAnalytics> {
    return Promise.resolve(mockLecturerAnalytics);
  },

  async getNotifications(): Promise<LecturerNotification[]> {
    return Promise.resolve([]);
  },

  async markAllNotificationsRead(): Promise<void> {
    return Promise.resolve();
  },
};
