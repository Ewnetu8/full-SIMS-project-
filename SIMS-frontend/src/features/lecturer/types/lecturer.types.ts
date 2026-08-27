export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'CLOSED' | 'PUBLISHED';

export type QuestionType =
  | 'MCQ'
  | 'TRUE_FALSE'
  | 'multiple_choice'
  | 'true_false';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface RubricCriterionItem {
  id: string;
  criterionText: string;
  pointWeight: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  marks: number;
  required: boolean;
  options?: QuestionOption[];
  correctAnswer?: string | string[];
  explanationNote?: string;
  rubricCriteria?: RubricCriterionItem[];
}

export interface LecturerExam {
  id: string;
  title: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  description: string;
  instructions: string[];
  durationMinutes: number;
  totalMarks: number;
  passingScore: number;
  status: ExamStatus;
  startDate: string;
  endDate: string;
  randomizeQuestions: boolean;
  allowMultipleAttempts: boolean;
  autoSubmitOnTimeout: boolean;
  showResultsAfterSubmission: boolean;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  academicYear: string;
  studentCount: number;
  examCount: number;
  description: string;
  section?: string;
  capacity?: number;
  creditHours?: number;
  intendedClassStanding?: string;
  programName?: string;
}

export type AIGradingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED';

export interface StudentSubmission {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  score?: number;
  totalMarks: number;
  status: 'SUBMITTED' | 'GRADED';
  aiGradingStatus: AIGradingStatus;
  answers: Record<string, string | string[]>;
}

export interface LecturerAnalytics {
  classAverage: number;
  passRate: number;
  submissionRate: number;
  completionRate: number;
  scoreDistribution: { range: string; count: number }[];
  questionDifficulty: { questionId: string; prompt: string; averageScorePct: number; difficulty: 'Easy' | 'Medium' | 'Hard' }[];
}

export interface LecturerStats {
  totalStudents: number;
  totalCourses: number;
  activeExams: number;
  pendingGrading: number;
}

export interface LecturerNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'published' | 'submission' | 'ai_grading' | 'system';
  read: boolean;
  link?: string;
}

export type ExamWizardStep = 'basic_info' | 'settings' | 'questions' | 'review';

export interface ExamWizardData {
  title: string;
  courseId: string;
  description: string;
  instructions: string;
  durationMinutes: number;
  totalMarks: number;
  passingScore: number;
  startDate: string;
  endDate: string;
  randomizeQuestions: boolean;
  allowMultipleAttempts: boolean;
  autoSubmitOnTimeout: boolean;
  showResultsAfterSubmission: boolean;
  questions: Question[];
}

export type {
  ExamResults,
  ExamResultRow,
  ExamAnalytics,
  ExamAnalyticsResponse,
  ScoreBand,
  ScoreSummary,
  QuestionAnalytics,
} from '@/types/api';
