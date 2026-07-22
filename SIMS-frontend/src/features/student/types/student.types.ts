export type ExamStatus = 'available' | 'upcoming' | 'completed';

export interface StudentProfile {
  fullName: string;
  studentId: string;
  email: string;
  department: string;
  program: string;
  yearOfStudy: string;
  semester: string;
}

export interface StudentExam {
  id: string;
  course: string;
  courseCode: string;
  lecturer: string;
  title: string;
  duration: string;
  totalMarks: number;
  startAt: string;
  endAt: string;
  status: ExamStatus;
  questions: number;
  passingScore: number;
  instructions: string[];
  rules: string[];
}

export interface StudentResult {
  id: string;
  examId: string;
  course: string;
  courseCode: string;
  examTitle: string;
  completedAt: string;
  score: number;
  grade: string;
  status: 'graded' | 'pending';
  feedback: string;
  strengths: string[];
  improvements: string[];
  questions: Array<{ question: string; score: number; total: number; note: string }>;
}

export interface StudentNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'ai';
  read: boolean;
}