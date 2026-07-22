import {
  mockCourses,
  mockLecturerExams,
  mockSubmissions,
  mockLecturerAnalytics,
  mockLecturerNotifications,
} from '../mock';

import type {
  Course,
  LecturerExam,
  StudentSubmission,
  LecturerAnalytics,
  LecturerNotification,
  ExamWizardData,
} from '../types';

let examsInMemory = [...mockLecturerExams];
let notificationsInMemory = [...mockLecturerNotifications];

export const lecturerService = {
  async getCourses(): Promise<Course[]> {
    await new Promise((res) => setTimeout(res, 200));
    return mockCourses;
  },

  async getCourseById(id: string): Promise<Course | undefined> {
    await new Promise((res) => setTimeout(res, 150));
    return mockCourses.find((c) => c.id === id || c.code.toLowerCase() === id.toLowerCase());
  },

  async getExams(): Promise<LecturerExam[]> {
    await new Promise((res) => setTimeout(res, 200));
    return [...examsInMemory];
  },

  async getExamById(id: string): Promise<LecturerExam | undefined> {
    await new Promise((res) => setTimeout(res, 150));
    return examsInMemory.find((e) => e.id === id);
  },

  async saveExam(data: Partial<LecturerExam> & { id?: string }): Promise<LecturerExam> {
    await new Promise((res) => setTimeout(res, 300));
    const course = mockCourses.find((c) => c.id === data.courseId) ?? mockCourses[0];
    const courseCode = course?.code ?? 'CS 101';
    const courseName = course?.name ?? 'Course';

    if (data.id) {
      const index = examsInMemory.findIndex((e) => e.id === data.id);
      if (index !== -1) {
        const updated: LecturerExam = {
          ...examsInMemory[index]!,
          ...data,
          courseCode,
          courseName,
          updatedAt: new Date().toISOString(),
        };
        examsInMemory[index] = updated;
        return updated;
      }
    }

    const newExam: LecturerExam = {
      id: `exam-${Date.now()}`,
      title: data.title ?? 'Untitled Examination',
      courseId: course?.id ?? 'course-cs101',
      courseCode,
      courseName,
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

    examsInMemory.unshift(newExam);
    return newExam;
  },

  async duplicateExam(id: string): Promise<LecturerExam | undefined> {
    await new Promise((res) => setTimeout(res, 250));
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
    await new Promise((res) => setTimeout(res, 200));
    const beforeLength = examsInMemory.length;
    examsInMemory = examsInMemory.filter((e) => e.id !== id);
    return examsInMemory.length < beforeLength;
  },

  async togglePublishExam(id: string): Promise<LecturerExam | undefined> {
    await new Promise((res) => setTimeout(res, 250));
    const target = examsInMemory.find((e) => e.id === id);
    if (!target) return undefined;

    const newStatus = target.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    target.status = newStatus;
    target.updatedAt = new Date().toISOString();

    if (newStatus === 'PUBLISHED') {
      notificationsInMemory.unshift({
        id: `notif-${Date.now()}`,
        title: 'Exam Published',
        message: `"${target.title}" is now published and active for students.`,
        timestamp: 'Just now',
        type: 'published',
        read: false,
        link: `/lecturer/exams/${target.id}`,
      });
    }

    return { ...target };
  },

  async getSubmissions(examId?: string): Promise<StudentSubmission[]> {
    await new Promise((res) => setTimeout(res, 200));
    if (examId) {
      return mockSubmissions.filter((s) => s.examId === examId);
    }
    return mockSubmissions;
  },

  async getAnalytics(): Promise<LecturerAnalytics> {
    await new Promise((res) => setTimeout(res, 200));
    return mockLecturerAnalytics;
  },

  async getNotifications(): Promise<LecturerNotification[]> {
    await new Promise((res) => setTimeout(res, 150));
    return [...notificationsInMemory];
  },

  async markAllNotificationsRead(): Promise<void> {
    await new Promise((res) => setTimeout(res, 100));
    notificationsInMemory = notificationsInMemory.map((n) => ({ ...n, read: true }));
  },
};
