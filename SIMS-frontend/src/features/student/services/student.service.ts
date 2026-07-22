import { studentExams, studentNotifications, studentProfile, studentResults } from '../mock/student-data';

/** API-shaped data boundary: replace these calls with DRF requests when the backend is available. */
export const studentService = {
  getProfile: () => studentProfile,
  getExams: () => studentExams,
  getExam: (id: string) => studentExams.find((exam) => exam.id === id),
  getResults: () => studentResults,
  getResult: (id: string) => studentResults.find((result) => result.id === id),
  getNotifications: () => studentNotifications,
};