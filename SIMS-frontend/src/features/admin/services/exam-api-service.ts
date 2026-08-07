import { api } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type { AdminExamOverview, AdminExamStatus } from '../types';

export interface ApiExamination {
  id: string;
  course_offering?: string;
  course_offering_detail?: {
    id: string;
    course_code: string;
    course_title: string;
    semester: string;
    semester_index: string;
    section: string;
  };
  lecturer?: string;
  title: string;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'CLOSED' | 'PUBLISHED';
  start_window?: string | null;
  end_window?: string | null;
  duration_minutes: number;
  questions?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface ApiQuestion {
  id: string;
  examination?: string;
  question_text: string;
  question_type: 'MCQ' | 'SHORT_ANSWER' | 'ESSAY';
  total_points: number;
  is_active?: boolean;
  options?: { id: string; option_text: string; is_correct: boolean }[];
  tags?: { id: string; name: string }[];
}

function mapStatus(backendStatus: ApiExamination['status']): AdminExamStatus {
  switch (backendStatus) {
    case 'DRAFT':
      return 'scheduled';
    case 'SCHEDULED':
      return 'scheduled';
    case 'ACTIVE':
      return 'active';
    case 'CLOSED':
      return 'completed';
    case 'PUBLISHED':
      return 'published';
    default:
      return 'scheduled';
  }
}

export const examApiService = {
  async getExams(): Promise<AdminExamOverview[]> {
    const raw = await api.get<ApiExamination[]>(API_ENDPOINTS.EXAMS.ROOT);
    return raw.map((e) => ({
      id: e.id,
      title: e.title,
      courseCode: e.course_offering_detail?.course_code || 'General',
      courseName: e.course_offering_detail?.course_title || 'Course Exam',
      department: 'Academic Unit',
      lecturerName: e.lecturer || 'Faculty Instructor',
      status: mapStatus(e.status),
      startDate: e.start_window ? new Date(e.start_window).toLocaleString() : 'Not Scheduled',
      endDate: e.end_window ? new Date(e.end_window).toLocaleString() : 'Not Scheduled',
      durationMinutes: e.duration_minutes || 60,
      totalStudents: 0,
      participatedStudents: 0,
    }));
  },

  async createExam(data: { title: string; duration_minutes: number; course_offering?: string }): Promise<AdminExamOverview> {
    const res = await api.post<ApiExamination>(API_ENDPOINTS.EXAMS.ROOT, {
      title: data.title,
      duration_minutes: data.duration_minutes,
      status: 'DRAFT',
      course_offering: data.course_offering || null,
    });
    return {
      id: res.id,
      title: res.title,
      courseCode: res.course_offering_detail?.course_code || 'General',
      courseName: res.course_offering_detail?.course_title || 'Course Exam',
      department: 'Academic Unit',
      lecturerName: res.lecturer || 'Faculty Instructor',
      status: mapStatus(res.status),
      startDate: res.start_window ? new Date(res.start_window).toLocaleString() : 'Not Scheduled',
      endDate: res.end_window ? new Date(res.end_window).toLocaleString() : 'Not Scheduled',
      durationMinutes: res.duration_minutes || 60,
      totalStudents: 0,
      participatedStudents: 0,
    };
  },

  async scheduleExam(id: string, data: { start_window: string; end_window: string; duration_minutes: number }): Promise<void> {
    await api.post(API_ENDPOINTS.EXAMS.SCHEDULE(id), data);
  },

  async deleteExam(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.EXAMS.BY_ID(id));
  },

  async getQuestions(): Promise<ApiQuestion[]> {
    return api.get<ApiQuestion[]>(API_ENDPOINTS.QUESTIONS.ROOT);
  },
};
