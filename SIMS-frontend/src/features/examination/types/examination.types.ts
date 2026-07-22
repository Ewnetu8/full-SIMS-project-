export type ExaminationQuestionType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'true_false'
  | 'short_answer'
  | 'essay';

export type ExaminationAnswer = string | string[];

export interface ExaminationOption {
  id: string;
  text: string;
}

export interface ExaminationQuestion {
  id: string;
  type: ExaminationQuestionType;
  prompt: string;
  marks: number;
  required: boolean;
  options?: ExaminationOption[];
  maxCharacters?: number;
  codeSnippet?: string;
  explanationNote?: string;
}

export interface ExaminationSession {
  examId: string;
  examTitle: string;
  course: string;
  courseCode: string;
  lecturer: string;
  durationSeconds: number;
  totalMarks: number;
  passingScore: number;
  allowedAttempts: number;
  attemptNumber: number;
  instructions: string[];
  academicIntegrityNotice: string;
  questions: ExaminationQuestion[];
}

export interface SubmissionReceipt {
  receiptId: string;
  examId: string;
  examTitle: string;
  course: string;
  courseCode: string;
  lecturer: string;
  submittedAt: string;
  answeredCount: number;
  totalQuestions: number;
}