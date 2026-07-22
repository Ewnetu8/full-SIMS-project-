import type { StudentExam, StudentNotification, StudentProfile, StudentResult } from '../types/student.types';

export const studentProfile: StudentProfile = {
  fullName: 'Amina Njeri', studentId: 'STU/2024/0817', email: 'amina.njeri@examsphere.edu',
  department: 'Computer Science', program: 'BSc. Computer Science', yearOfStudy: 'Year 2', semester: 'Semester 2, 2025/26',
};

export const studentExams: StudentExam[] = [
  { id: 'data-structures-midterm', course: 'Data Structures & Algorithms', courseCode: 'CSC 220', lecturer: 'Dr. Samuel Otieno', title: 'Mid-Semester Examination', duration: '1 hour 30 minutes', totalMarks: 60, startAt: '2026-07-24T09:00:00', endAt: '2026-07-24T10:30:00', status: 'available', questions: 30, passingScore: 50, instructions: ['Read every question carefully before answering.', 'Your answers are saved automatically while the exam is in progress.'], rules: ['Use a stable internet connection.', 'Do not refresh or leave the examination page.', 'No external assistance or materials are permitted.'] },
  { id: 'database-systems-quiz', course: 'Database Systems', courseCode: 'CSC 230', lecturer: 'Ms. Faith Wambui', title: 'SQL and Normalization Quiz', duration: '45 minutes', totalMarks: 30, startAt: '2026-07-29T14:00:00', endAt: '2026-07-29T14:45:00', status: 'upcoming', questions: 20, passingScore: 50, instructions: ['This is an individual assessment.', 'Review your answers before submitting.'], rules: ['Start within the scheduled window.', 'Keep your browser tab open until submission.'] },
  { id: 'software-engineering-assessment', course: 'Software Engineering', courseCode: 'CSC 240', lecturer: 'Mr. Kevin Mwangi', title: 'Requirements Engineering Assessment', duration: '1 hour', totalMarks: 40, startAt: '2026-07-15T11:00:00', endAt: '2026-07-15T12:00:00', status: 'completed', questions: 25, passingScore: 50, instructions: ['Answer all compulsory questions.'], rules: ['Submitted assessments cannot be reopened.'] },
];

export const studentResults: StudentResult[] = [
  { id: 'result-software-engineering', examId: 'software-engineering-assessment', course: 'Software Engineering', courseCode: 'CSC 240', examTitle: 'Requirements Engineering Assessment', completedAt: '2026-07-15T12:03:00', score: 86, grade: 'A', status: 'graded', feedback: 'You demonstrated a strong command of stakeholder analysis and functional requirements. Keep refining your use of acceptance criteria.', strengths: ['Clear distinction between functional and non-functional requirements', 'Strong stakeholder mapping'], improvements: ['Add more measurable acceptance criteria', 'Use consistent terminology across diagrams'], questions: [{ question: 'Stakeholder analysis', score: 10, total: 10, note: 'Excellent identification of primary and secondary stakeholders.' }, { question: 'Use-case modelling', score: 16, total: 20, note: 'Good model; include alternate flows next time.' }, { question: 'Requirements prioritization', score: 8, total: 10, note: 'Well reasoned priority choices.' }] },
  { id: 'result-computer-networks', examId: 'computer-networks-quiz', course: 'Computer Networks', courseCode: 'CSC 210', examTitle: 'Network Fundamentals Quiz', completedAt: '2026-07-08T16:20:00', score: 74, grade: 'B', status: 'graded', feedback: 'Your core networking concepts are solid. Spend some time revising subnetting calculations.', strengths: ['Strong OSI model knowledge', 'Accurate protocol matching'], improvements: ['Practice CIDR notation', 'Review routing table interpretation'], questions: [{ question: 'OSI model', score: 10, total: 10, note: 'Complete and accurate.' }, { question: 'Subnetting', score: 9, total: 15, note: 'Review address range calculations.' }] },
];

export const studentNotifications: StudentNotification[] = [
  { id: 'notification-1', title: 'New exam available', message: 'Your Data Structures & Algorithms mid-semester examination is ready to review.', time: '20 minutes ago', type: 'info', read: false },
  { id: 'notification-2', title: 'Exam reminder', message: 'SQL and Normalization Quiz opens on 29 July at 2:00 PM.', time: '2 hours ago', type: 'warning', read: false },
  { id: 'notification-3', title: 'Results published', message: 'Your Requirements Engineering Assessment result is now available.', time: 'Yesterday', type: 'success', read: false },
  { id: 'notification-4', title: 'Profile updated', message: 'Your student profile was updated successfully.', time: '3 days ago', type: 'ai', read: true },
];