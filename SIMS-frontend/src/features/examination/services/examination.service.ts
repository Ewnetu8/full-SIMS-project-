import { studentService } from '@/features/student/services/student.service';
import type {
  ExaminationAnswer,
  ExaminationQuestion,
  ExaminationSession,
  SubmissionReceipt,
} from '../types/examination.types';
import type { Examination, ExamAttempt, Question } from '@/features/student/types';

export const examinationService = {
  /**
   * Loads real exam details and starts an attempt via DRF endpoints.
   */
  startExamSession: async (examId: string): Promise<ExaminationSession> => {
    // 1. Get Exam details from backend
    const exam: Examination = await studentService.getExamDetails(examId);

    // 2. Start Exam Attempt (returns { attempt, questions })
    const startResponse = await studentService.startExam(examId);
    console.log('[START EXAM RESPONSE]', startResponse);

    const attempt: ExamAttempt = (startResponse as any)?.attempt || (startResponse as any);
    console.log('[START EXAM ATTEMPT]', attempt);
    console.log('[START EXAM ATTEMPT ID]', attempt?.id);

    const rawQuestions: Question[] =
      Array.isArray((startResponse as any)?.questions) && (startResponse as any).questions.length > 0
        ? (startResponse as any).questions
        : exam.questions || [];

    // 3. Map Questions
    const mappedQuestions: ExaminationQuestion[] = rawQuestions.map((q: Question) => ({
      id: q.id,
      type: (q.question_type as any) || 'MCQ',
      prompt: q.question_text,
      marks: typeof q.total_points === 'number' ? q.total_points : parseFloat(String(q.total_points || 1)),
      options: (q.options || []).map((opt) => ({
        id: opt.id,
        text: opt.option_text,
      })),
    }));

    console.log(
      '[MAPPED QUESTIONS]',
      mappedQuestions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        marks: q.marks,
        options: q.options,
      }))
    );

    const durationSeconds = (exam.duration_minutes || 60) * 60;
    const totalMarks = mappedQuestions.reduce((acc, q) => acc + q.marks, 0);

    const courseTitle =
      exam.course_offering_detail?.course_title ||
      exam.course_offering_detail?.course_detail?.title ||
      'Course Assessment';
    const courseCode =
      exam.course_offering_detail?.course_code ||
      exam.course_offering_detail?.course_detail?.course_code ||
      'COURSES';

    return {
      examId: exam.id,
      attemptId: attempt.id,
      examTitle: exam.title,
      course: courseTitle,
      courseCode: courseCode,
      lecturer: exam.lecturer || 'Course Instructor',
      durationSeconds,
      totalMarks,
      instructions: [
        'Read every question carefully before answering.',
        'Your answers are auto-saved automatically while the exam is in progress.',
        'Submit before the examination timer expires.',
      ],
      academicIntegrityNotice:
        'By starting this examination, you affirm on your honor that all submitted work is purely your own, executed without unauthorized collaboration or external assistance.',
      questions: mappedQuestions,
      rawExam: exam,
      rawAttempt: attempt,
    };
  },

  /**
   * Save a single answer to backend via PUT /api/v1/attempts/{attempt_pk}/answers/{question_pk}
   */
  saveSingleAnswer: async (
    attemptId: string,
    questionId: string,
    questionType: string,
    answerValue: ExaminationAnswer
  ): Promise<void> => {
    if (!attemptId || !questionId) return;

    const payload: { selected_option?: string | null; submitted_text?: string | null } = {};

    if (questionType === 'MCQ' || questionType === 'multiple_choice') {
      payload.selected_option = answerValue || null;
    } else {
      payload.submitted_text = answerValue || null;
    }

    await studentService.saveAnswer(attemptId, questionId, payload);
  },

  /**
   * Final submission call to backend POST /api/v1/exams/{id}/submit
   */
  submit: async (
    session: ExaminationSession,
    answers: Record<string, ExaminationAnswer>,
    isDisrupted = false
  ): Promise<SubmissionReceipt> => {
    // Submit exam attempt to backend
    await studentService.submitExam(session.examId, { is_disrupted: isDisrupted });

    const answeredCount = Object.values(answers).filter((a) => Boolean(String(a || '').trim())).length;

    return {
      receiptId: `REC-${session.examId.slice(0, 8).toUpperCase()}`,
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