import { mockExaminationSessions } from '../mock/examination-data';
import type { ExaminationAnswer, ExaminationSession, SubmissionReceipt } from '../types';

/** Replace these mock operations with Django REST Framework requests when the API is available. */
export const examinationService = {
  getSession: (examId: string): ExaminationSession | undefined =>
    mockExaminationSessions.find((session) => session.examId === examId) ?? mockExaminationSessions[0],

  saveAnswers: async (_examId: string, _answers: Record<string, ExaminationAnswer>): Promise<void> => {
    // Simulated background REST API / draft save request
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  },

  submit: async (session: ExaminationSession, answers: Record<string, ExaminationAnswer>): Promise<SubmissionReceipt> => {
    // Simulated final submission REST API call
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    const answeredCount = Object.values(answers).filter((answer) =>
      Array.isArray(answer) ? answer.length > 0 : Boolean(answer?.trim())
    ).length;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    return {
      receiptId: `REC-${session.courseCode.replace(/\s+/g, '')}-${randomSuffix}`,
      examId: session.examId,
      examTitle: session.examTitle,
      course: session.course,
      courseCode: session.courseCode,
      lecturer: session.lecturer,
      submittedAt: new Date().toISOString(),
      answeredCount,
      totalQuestions: session.questions.length,
    };
  },
};