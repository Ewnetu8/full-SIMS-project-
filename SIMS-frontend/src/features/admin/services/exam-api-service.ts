import { api } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type {
  AdminExamOverview,
  CreateExaminationPayload,
  UpdateExaminationPayload,
  ScheduleExaminationPayload,
} from '../types';

export interface ApiExamination {
  id: string;
  course_offering?: string;
  course_offering_detail?: {
    id: string;
    course_code: string;
    course_title: string;
    semester: string;
    semester_index: 'FIRST' | 'SECOND' | 'SUMMER' | string;
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

function mapApiExamToOverview(e: ApiExamination): AdminExamOverview {
  return {
    id: e.id,
    course_offering: e.course_offering,
    course_offering_detail: e.course_offering_detail || null,
    lecturer: e.lecturer,
    lecturerName: e.lecturer || 'Faculty Instructor',
    title: e.title,
    status: e.status,
    start_window: e.start_window || null,
    end_window: e.end_window || null,
    duration_minutes: e.duration_minutes || 60,
    questions: e.questions || [],
    created_at: e.created_at,
    updated_at: e.updated_at,
    // UI Helpers
    courseCode: e.course_offering_detail?.course_code || 'General',
    courseName: e.course_offering_detail?.course_title || 'Course Exam',
    department: 'Academic Unit',
    startDate: e.start_window ? new Date(e.start_window).toLocaleString() : 'Not Scheduled',
    endDate: e.end_window ? new Date(e.end_window).toLocaleString() : 'Not Scheduled',
    durationMinutes: e.duration_minutes || 60,
    totalStudents: 0,
    participatedStudents: 0,
  };
}

export const examApiService = {
  /**
   * List all examinations with optional status and course_offering filters.
   * Endpoint: GET /api/v1/exams
   */
  async getExams(params?: { status?: string; course_offering?: string }): Promise<AdminExamOverview[]> {
    const queryParams = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') {
      queryParams.append('status', params.status);
    }
    if (params?.course_offering && params.course_offering !== 'ALL') {
      queryParams.append('course_offering', params.course_offering);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `${API_ENDPOINTS.EXAMS.ROOT}?${queryString}` : API_ENDPOINTS.EXAMS.ROOT;
    const raw = await api.get<ApiExamination[]>(endpoint);
    return raw.map(mapApiExamToOverview);
  },

  /**
   * Retrieve single examination by ID.
   * Endpoint: GET /api/v1/exams/{id}
   */
  async getExamById(id: string): Promise<AdminExamOverview> {
    const raw = await api.get<ApiExamination>(API_ENDPOINTS.EXAMS.BY_ID(id));
    return mapApiExamToOverview(raw);
  },

  /**
   * Create a new examination.
   * Endpoint: POST /api/v1/exams
   */
  async createExam(data: CreateExaminationPayload): Promise<AdminExamOverview> {
    const res = await api.post<ApiExamination>(API_ENDPOINTS.EXAMS.ROOT, {
      course_offering: data.course_offering,
      title: data.title.trim(),
      start_window: data.start_window,
      end_window: data.end_window,
      duration_minutes: Number(data.duration_minutes),
    });
    return mapApiExamToOverview(res);
  },

  /**
   * Update examination (partial update).
   * Endpoint: PATCH /api/v1/exams/{id}
   */
  async updateExam(id: string, data: UpdateExaminationPayload): Promise<AdminExamOverview> {
    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.title = data.title.trim();
    if (data.course_offering !== undefined) payload.course_offering = data.course_offering;
    if (data.start_window !== undefined) payload.start_window = data.start_window;
    if (data.end_window !== undefined) payload.end_window = data.end_window;
    if (data.duration_minutes !== undefined) payload.duration_minutes = Number(data.duration_minutes);
    if (data.status !== undefined) payload.status = data.status;

    const res = await api.patch<ApiExamination>(API_ENDPOINTS.EXAMS.BY_ID(id), payload);
    return mapApiExamToOverview(res);
  },

  /**
   * Schedule an examination (moves DRAFT -> SCHEDULED).
   * Endpoint: POST /api/v1/exams/{id}/schedule
   */
  async scheduleExam(id: string, data: ScheduleExaminationPayload): Promise<AdminExamOverview> {
    const res = await api.post<ApiExamination>(API_ENDPOINTS.EXAMS.SCHEDULE(id), {
      start_window: data.start_window,
      end_window: data.end_window,
      duration_minutes: Number(data.duration_minutes),
    });
    return mapApiExamToOverview(res);
  },

  /**
   * Publish results for a CLOSED examination (moves CLOSED -> PUBLISHED).
   * Endpoint: POST /api/v1/exams/{id}/publish
   */
  async publishExam(id: string): Promise<AdminExamOverview> {
    const res = await api.post<ApiExamination>(API_ENDPOINTS.EXAMS.PUBLISH(id));
    return mapApiExamToOverview(res);
  },

  /**
   * Delete a DRAFT examination.
   * Endpoint: DELETE /api/v1/exams/{id}
   */
  async deleteExam(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.EXAMS.BY_ID(id));
  },

  async getQuestions(): Promise<ApiQuestion[]> {
    return api.get<ApiQuestion[]>(API_ENDPOINTS.QUESTIONS.ROOT);
  },
};
