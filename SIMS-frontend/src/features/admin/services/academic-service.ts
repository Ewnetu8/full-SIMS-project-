import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { api } from '@/services/api-client';

import type {
  College,
  Program,
  AcademicYear,
  Semester,
  CreateSemesterPayload,
  UpdateSemesterPayload,
  Department,
  Course,
  ClassStanding,
  AdminCourseOffering,
  AdminEnrollment,
  CreateEnrollmentPayload,
  UpdateEnrollmentPayload,
  BatchImportResponse,
  ApiStudentListItem,
  ApiStudentDetail,
  StudentFilterParams,
  UpdateStudentPayload,
  ApiLecturerListItem,
  ApiLecturerDetail,
  LecturerFilterParams,
  UpdateLecturerPayload,
  Tag,
  CreateTagPayload,
  UpdateTagPayload,
} from '../types';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
function isValidUuid(id?: string | null): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export interface ApiUniversity {
  id: string;
  name: string;
  code: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiCollege {
  id: string;
  university: string;
  university_detail?: ApiUniversity;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface ApiDepartment {
  id: string;
  college?: string | null;
  college_detail?: ApiCollege;
  name: string;
  code: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiProgram {
  id: string;
  department: string;
  department_detail?: ApiDepartment;
  name: string;
  code: string;
  degree_level: 'BACHELOR' | 'MASTER' | 'DOCTORATE' | 'DIPLOMA' | 'CERTIFICATE';
  total_credit_hours_required: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAcademicYear {
  id: string;
  display_label: string;
  start_boundary: string;
  end_boundary: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiSemester {
  id: string;
  academic_year: string;
  academic_year_detail?: ApiAcademicYear;
  semester_index: 'FIRST' | 'SECOND' | 'SUMMER' | string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiCourse {
  id: string;
  program?: string | null;
  program_detail?: ApiProgram | null;
  title: string;
  course_code: string;
  credit_hours: number;
  intended_class_standing?: ClassStanding;
  created_at?: string;
  updated_at?: string;
}

export const academicService = {
  // ── Universities ─────────────────────────────────────────────────────────────
  async getUniversities(): Promise<ApiUniversity[]> {
    return api.get<ApiUniversity[]>(API_ENDPOINTS.ACADEMICS.UNIVERSITIES);
  },

  async createUniversity(data: { name: string; code: string }): Promise<ApiUniversity> {
    return api.post<ApiUniversity>(API_ENDPOINTS.ACADEMICS.UNIVERSITIES, data);
  },

  // ── Colleges ─────────────────────────────────────────────────────────────────
  async getColleges(): Promise<College[]> {
    try {
      const raw = await api.get<ApiCollege[]>(API_ENDPOINTS.ACADEMICS.COLLEGES);
      if (Array.isArray(raw)) {
        return raw.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          university: c.university,
          university_detail: c.university_detail,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  async createCollege(data: { name: string; code: string; university: string }): Promise<College> {
    const res = await api.post<ApiCollege>(API_ENDPOINTS.ACADEMICS.COLLEGES, {
      university: data.university,
      name: data.name,
      code: data.code.toUpperCase(),
    });
    return {
      id: res.id,
      name: res.name,
      code: res.code,
      university: res.university,
      university_detail: res.university_detail,
      createdAt: res.created_at,
      updatedAt: res.updated_at,
    };
  },

  async updateCollege(id: string, data: Partial<{ name: string; code: string; university: string }>): Promise<College> {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.code !== undefined) payload.code = data.code.toUpperCase();
    if (data.university !== undefined) payload.university = data.university;

    const res = await api.patch<ApiCollege>(API_ENDPOINTS.ACADEMICS.COLLEGE_BY_ID(id), payload);
    return {
      id: res.id,
      name: res.name,
      code: res.code,
      university: res.university,
      university_detail: res.university_detail,
      createdAt: res.created_at,
      updatedAt: res.updated_at,
    };
  },

  async deleteCollege(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.ACADEMICS.COLLEGE_BY_ID(id));
  },

  // ── Departments ──────────────────────────────────────────────────────────────
  async getDepartments(): Promise<Department[]> {
    try {
      const raw = await api.get<ApiDepartment[]>(API_ENDPOINTS.ACADEMICS.DEPARTMENTS);
      if (Array.isArray(raw)) {
        return raw.map((d) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          college: d.college || null,
          college_detail: d.college_detail,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  async getDepartmentById(id: string): Promise<Department> {
    const res = await api.get<ApiDepartment>(API_ENDPOINTS.ACADEMICS.DEPARTMENT_BY_ID(id));
    return {
      id: res.id,
      code: res.code,
      name: res.name,
      college: res.college || null,
      college_detail: res.college_detail,
      createdAt: res.created_at,
      updatedAt: res.updated_at,
    };
  },

  async createDepartment(data: { name: string; code: string; college?: string | null }): Promise<Department> {
    const payload: Record<string, unknown> = {
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      college: data.college && isValidUuid(data.college) ? data.college : null,
    };

    const endpoint = API_ENDPOINTS.ACADEMICS.DEPARTMENTS;

    try {
      const res = await api.post<ApiDepartment>(endpoint, payload);

      return {
        id: res.id,
        code: res.code,
        name: res.name,
        college: res.college || null,
        college_detail: res.college_detail,
        createdAt: res.created_at,
        updatedAt: res.updated_at,
      };
    } catch (err: unknown) {
      throw err;
    }
  },

  async updateDepartment(id: string, data: Partial<{ name: string; code: string; college?: string | null }>): Promise<Department> {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.code !== undefined) payload.code = data.code.trim().toUpperCase();
    if (data.college !== undefined) {
      payload.college = data.college && isValidUuid(data.college) ? data.college : null;
    }

    const endpoint = API_ENDPOINTS.ACADEMICS.DEPARTMENT_BY_ID(id);

    try {
      const res = await api.patch<ApiDepartment>(endpoint, payload);

      return {
        id: res.id,
        code: res.code,
        name: res.name,
        college: res.college || null,
        college_detail: res.college_detail,
        createdAt: res.created_at,
        updatedAt: res.updated_at,
      };
    } catch (err: unknown) {
      throw err;
    }
  },

  async deleteDepartment(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.ACADEMICS.DEPARTMENT_BY_ID(id));
  },

  // ── Programs ─────────────────────────────────────────────────────────────────
  async getPrograms(): Promise<Program[]> {
    const raw = await api.get<ApiProgram[]>(API_ENDPOINTS.ACADEMICS.PROGRAMS);
    return raw.map((p) => ({
      id: p.id,
      department: p.department,
      name: p.name,
      code: p.code,
      degreeLevel: p.degree_level,
      totalCreditHoursRequired: p.total_credit_hours_required,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  },

  async createProgram(data: { department: string; name: string; code: string; degree_level?: string; total_credit_hours_required?: number }): Promise<Program> {
    const departmentId = data.department;

    const payload: Record<string, unknown> = {
      department: departmentId,
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      degree_level: data.degree_level || 'BACHELOR',
      total_credit_hours_required: Number(data.total_credit_hours_required ?? 120),
    };

    const endpoint = API_ENDPOINTS.ACADEMICS.PROGRAMS;

    if (process.env.NODE_ENV !== 'production') {
      console.warn('[DEBUG] Program Creation Request:', {
        url: endpoint,
        payload,
      });
    }

    try {
      const res = await api.post<ApiProgram>(endpoint, payload);

      if (process.env.NODE_ENV !== 'production') {
        console.warn('[DEBUG] Program Creation Response (201 Created):', res);
      }

      return {
        id: res.id,
        department: res.department,
        name: res.name,
        code: res.code,
        degreeLevel: res.degree_level,
        totalCreditHoursRequired: res.total_credit_hours_required,
        createdAt: res.created_at,
        updatedAt: res.updated_at,
      };
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[DEBUG] Program Creation Error:', err);
      }
      throw err;
    }
  },

  async updateProgram(id: string, data: Partial<{ department?: string; name: string; code: string; degree_level?: string; total_credit_hours_required?: number }>): Promise<Program> {
    const payload: Record<string, unknown> = {};
    if (data.department !== undefined) payload.department = data.department;
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.code !== undefined) payload.code = data.code.trim().toUpperCase();
    if (data.degree_level !== undefined) payload.degree_level = data.degree_level;
    if (data.total_credit_hours_required !== undefined) payload.total_credit_hours_required = Number(data.total_credit_hours_required);

    const endpoint = API_ENDPOINTS.ACADEMICS.PROGRAM_BY_ID(id);

    if (process.env.NODE_ENV !== 'production') {
      console.warn('[DEBUG] Program Update Request:', {
        url: endpoint,
        payload,
      });
    }

    try {
      const res = await api.patch<ApiProgram>(endpoint, payload);

      if (process.env.NODE_ENV !== 'production') {
        console.warn('[DEBUG] Program Update Response:', res);
      }

      return {
        id: res.id,
        department: res.department,
        name: res.name,
        code: res.code,
        degreeLevel: res.degree_level,
        totalCreditHoursRequired: res.total_credit_hours_required,
        createdAt: res.created_at,
        updatedAt: res.updated_at,
      };
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[DEBUG] Program Update Error:', err);
      }
      throw err;
    }
  },

  async deleteProgram(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.ACADEMICS.PROGRAM_BY_ID(id));
  },

  // ── Academic Years ───────────────────────────────────────────────────────────
  async getAcademicYears(): Promise<AcademicYear[]> {
    const raw = await api.get<ApiAcademicYear[]>(API_ENDPOINTS.ACADEMICS.ACADEMIC_YEARS);
    return raw.map((y) => ({
      id: y.id,
      displayLabel: y.display_label,
      startBoundary: y.start_boundary,
      endBoundary: y.end_boundary,
      createdAt: y.created_at,
      updatedAt: y.updated_at,
    }));
  },

  async createAcademicYear(data: { display_label: string; start_boundary: string; end_boundary: string }): Promise<AcademicYear> {
    const res = await api.post<ApiAcademicYear>(API_ENDPOINTS.ACADEMICS.ACADEMIC_YEARS, data);
    return {
      id: res.id,
      displayLabel: res.display_label,
      startBoundary: res.start_boundary,
      endBoundary: res.end_boundary,
      createdAt: res.created_at,
      updatedAt: res.updated_at,
    };
  },

  async updateAcademicYear(id: string, data: Partial<{ display_label: string; start_boundary: string; end_boundary: string }>): Promise<AcademicYear> {
    const res = await api.patch<ApiAcademicYear>(API_ENDPOINTS.ACADEMICS.ACADEMIC_YEAR_BY_ID(id), data);
    return {
      id: res.id,
      displayLabel: res.display_label,
      startBoundary: res.start_boundary,
      endBoundary: res.end_boundary,
      createdAt: res.created_at,
      updatedAt: res.updated_at,
    };
  },

  async deleteAcademicYear(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.ACADEMICS.ACADEMIC_YEAR_BY_ID(id));
  },

  // ── Semesters ────────────────────────────────────────────────────────────────
  async getSemesters(): Promise<Semester[]> {
    const raw = await api.get<ApiSemester[] | { results?: ApiSemester[]; data?: ApiSemester[] }>(API_ENDPOINTS.ACADEMICS.SEMESTERS);
    let list: ApiSemester[] = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (Array.isArray(raw?.results)) {
      list = raw.results;
    } else if (Array.isArray(raw?.data)) {
      list = raw.data;
    }
    return list.map((s) => ({
      id: s.id,
      academicYear: s.academic_year,
      academicYearDetail: s.academic_year_detail
        ? {
          id: s.academic_year_detail.id,
          displayLabel: s.academic_year_detail.display_label,
          startBoundary: s.academic_year_detail.start_boundary,
          endBoundary: s.academic_year_detail.end_boundary,
          createdAt: s.academic_year_detail.created_at,
          updatedAt: s.academic_year_detail.updated_at,
        }
        : undefined,
      semesterIndex: s.semester_index,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));
  },

  async getSemesterById(id: string): Promise<Semester> {
    const res = await api.get<ApiSemester>(API_ENDPOINTS.ACADEMICS.SEMESTER_BY_ID(id));
    return {
      id: res.id,
      academicYear: res.academic_year,
      academicYearDetail: res.academic_year_detail
        ? {
          id: res.academic_year_detail.id,
          displayLabel: res.academic_year_detail.display_label,
          startBoundary: res.academic_year_detail.start_boundary,
          endBoundary: res.academic_year_detail.end_boundary,
          createdAt: res.academic_year_detail.created_at,
          updatedAt: res.academic_year_detail.updated_at,
        }
        : undefined,
      semesterIndex: res.semester_index,
      createdAt: res.created_at,
      updatedAt: res.updated_at,
    };
  },

  async createSemester(data: CreateSemesterPayload): Promise<Semester> {
    const payload = {
      academic_year: data.academic_year.trim(),
      semester_index: data.semester_index,
    };
    const res = await api.post<ApiSemester>(API_ENDPOINTS.ACADEMICS.SEMESTERS, payload);
    return {
      id: res.id,
      academicYear: res.academic_year,
      academicYearDetail: res.academic_year_detail
        ? {
          id: res.academic_year_detail.id,
          displayLabel: res.academic_year_detail.display_label,
          startBoundary: res.academic_year_detail.start_boundary,
          endBoundary: res.academic_year_detail.end_boundary,
          createdAt: res.academic_year_detail.created_at,
          updatedAt: res.academic_year_detail.updated_at,
        }
        : undefined,
      semesterIndex: res.semester_index,
      createdAt: res.created_at,
      updatedAt: res.updated_at,
    };
  },

  async updateSemester(id: string, data: UpdateSemesterPayload): Promise<Semester> {
    const payload: Record<string, unknown> = {};
    if (data.academic_year !== undefined) payload.academic_year = data.academic_year.trim();
    if (data.semester_index !== undefined) payload.semester_index = data.semester_index;

    const res = await api.patch<ApiSemester>(API_ENDPOINTS.ACADEMICS.SEMESTER_BY_ID(id), payload);
    return {
      id: res.id,
      academicYear: res.academic_year,
      academicYearDetail: res.academic_year_detail
        ? {
          id: res.academic_year_detail.id,
          displayLabel: res.academic_year_detail.display_label,
          startBoundary: res.academic_year_detail.start_boundary,
          endBoundary: res.academic_year_detail.end_boundary,
          createdAt: res.academic_year_detail.created_at,
          updatedAt: res.academic_year_detail.updated_at,
        }
        : undefined,
      semesterIndex: res.semester_index,
      createdAt: res.created_at,
      updatedAt: res.updated_at,
    };
  },

  async deleteSemester(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.ACADEMICS.SEMESTER_BY_ID(id));
  },

  // ── Courses ──────────────────────────────────────────────────────────────────
  async getCourses(): Promise<Course[]> {
    const raw = await api.get<ApiCourse[]>(API_ENDPOINTS.ACADEMICS.COURSES);
    return raw.map((c) => this.mapApiCourseToCourse(c));
  },

  async getCourseById(id: string): Promise<Course> {
    const raw = await api.get<ApiCourse>(API_ENDPOINTS.ACADEMICS.COURSE_BY_ID(id));
    return this.mapApiCourseToCourse(raw);
  },

  mapApiCourseToCourse(c: ApiCourse): Course {
    return {
      id: c.id,
      code: c.course_code,
      name: c.title,
      title: c.title,
      creditHours: c.credit_hours,
      program: c.program || c.program_detail?.id || null,
      programDetail: c.program_detail
        ? {
            id: c.program_detail.id,
            name: c.program_detail.name,
            code: c.program_detail.code,
            department: c.program_detail.department,
            department_detail: c.program_detail.department_detail
              ? {
                  id: c.program_detail.department_detail.id,
                  name: c.program_detail.department_detail.name,
                  code: c.program_detail.department_detail.code,
                  college: c.program_detail.department_detail.college,
                  college_detail: c.program_detail.department_detail.college_detail,
                  createdAt: c.program_detail.department_detail.created_at,
                  updatedAt: c.program_detail.department_detail.updated_at,
                }
              : null,
            degreeLevel: c.program_detail.degree_level,
            totalCreditHoursRequired: c.program_detail.total_credit_hours_required,
            createdAt: c.program_detail.created_at,
            updatedAt: c.program_detail.updated_at,
          }
        : null,
      intendedClassStanding: c.intended_class_standing,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  },

  async createCourse(data: {
    title: string;
    course_code: string;
    credit_hours: number;
    program?: string | null;
    intended_class_standing?: ClassStanding;
  }): Promise<Course> {
    const payload: {
      title: string;
      course_code: string;
      credit_hours: number;
      program?: string | null;
      intended_class_standing?: ClassStanding;
    } = {
      title: data.title.trim(),
      course_code: data.course_code.trim().toUpperCase(),
      credit_hours: Number(data.credit_hours),
      program: data.program || null,
    };
    if (data.intended_class_standing) {
      payload.intended_class_standing = data.intended_class_standing;
    }

    const res = await api.post<ApiCourse>(API_ENDPOINTS.ACADEMICS.COURSES, payload);
    return this.mapApiCourseToCourse(res);
  },

  async updateCourse(
    id: string,
    data: Partial<{
      title: string;
      course_code: string;
      credit_hours: number;
      program?: string | null;
      intended_class_standing?: ClassStanding;
    }>
  ): Promise<Course> {
    const payload: Partial<{
      title: string;
      course_code: string;
      credit_hours: number;
      program: string | null;
      intended_class_standing: ClassStanding;
    }> = {};
    if (data.title !== undefined) payload.title = data.title.trim();
    if (data.course_code !== undefined) payload.course_code = data.course_code.trim().toUpperCase();
    if (data.credit_hours !== undefined) payload.credit_hours = Number(data.credit_hours);
    if (data.program !== undefined) payload.program = data.program || null;
    if (data.intended_class_standing !== undefined) payload.intended_class_standing = data.intended_class_standing;

    const res = await api.patch<ApiCourse>(API_ENDPOINTS.ACADEMICS.COURSE_BY_ID(id), payload);
    return this.mapApiCourseToCourse(res);
  },

  async deleteCourse(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.ACADEMICS.COURSE_BY_ID(id));
  },

  // ── Course Offerings ─────────────────────────────────────────────────────────
  async getCourseOfferings(): Promise<AdminCourseOffering[]> {
    const data = await api.get<
      AdminCourseOffering[] | { results?: AdminCourseOffering[]; data?: AdminCourseOffering[] }
    >(API_ENDPOINTS.COURSE_OFFERINGS.ROOT);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  },

  async getCourseOfferingById(id: string): Promise<AdminCourseOffering> {
    return api.get<AdminCourseOffering>(API_ENDPOINTS.COURSE_OFFERINGS.BY_ID(id));
  },

  // ── Enrollments ──────────────────────────────────────────────────────────────
  async getEnrollments(): Promise<AdminEnrollment[]> {
    const data = await api.get<
      AdminEnrollment[] | { results?: AdminEnrollment[]; data?: AdminEnrollment[] }
    >(API_ENDPOINTS.ENROLLMENTS.ROOT);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  },

  async getEnrollmentById(id: string): Promise<AdminEnrollment> {
    return api.get<AdminEnrollment>(API_ENDPOINTS.ENROLLMENTS.BY_ID(id));
  },

  async createEnrollment(payload: CreateEnrollmentPayload): Promise<AdminEnrollment> {
    const body: Record<string, unknown> = {
      student: payload.student.trim(),
      course_offering: payload.course_offering.trim(),
    };
    if (payload.status) body.status = payload.status;
    if (payload.grade !== undefined && payload.grade !== null && payload.grade.trim() !== '') {
      body.grade = payload.grade.trim();
    }

    return api.post<AdminEnrollment>(API_ENDPOINTS.ENROLLMENTS.ROOT, body);
  },

  async updateEnrollment(id: string, payload: UpdateEnrollmentPayload): Promise<AdminEnrollment> {
    const body: Record<string, unknown> = {};
    if (payload.status !== undefined) body.status = payload.status;
    if (payload.grade !== undefined) {
      body.grade = payload.grade && payload.grade.trim() !== '' ? payload.grade.trim() : null;
    }
    if (payload.course_offering !== undefined) body.course_offering = payload.course_offering;

    return api.patch<AdminEnrollment>(API_ENDPOINTS.ENROLLMENTS.BY_ID(id), body);
  },

  async deleteEnrollment(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.ENROLLMENTS.BY_ID(id));
  },

  async batchImportEnrollments(file: File): Promise<BatchImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<BatchImportResponse>(API_ENDPOINTS.ENROLLMENTS.BATCH_IMPORT, formData);
  },

  // ── Students (Student Management API) ───────────────────────────────────────
  async getStudents(params?: StudentFilterParams): Promise<ApiStudentListItem[]> {
    const queryParams = new URLSearchParams();
    if (params?.search && params.search.trim()) {
      queryParams.append('search', params.search.trim());
    }
    if (params?.department && params.department.trim() && params.department !== 'ALL') {
      queryParams.append('department', params.department.trim());
    }
    if (params?.class_standing && params.class_standing.trim() && params.class_standing !== 'ALL') {
      queryParams.append('class_standing', params.class_standing.trim());
    }

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.STUDENTS.ROOT}?${queryString}`
      : API_ENDPOINTS.STUDENTS.ROOT;

    const data = await api.get<ApiStudentListItem[] | { results?: ApiStudentListItem[]; data?: ApiStudentListItem[] }>(
      endpoint
    );

    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.results)) {
      return data.results;
    }
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    return [];
  },

  async getStudentById(id: string): Promise<ApiStudentDetail> {
    return api.get<ApiStudentDetail>(API_ENDPOINTS.STUDENTS.BY_ID(id));
  },

  async updateStudent(id: string, payload: UpdateStudentPayload): Promise<ApiStudentDetail> {
    const body: Record<string, unknown> = {};
    if (payload.student_identifier !== undefined) {
      body.student_identifier = payload.student_identifier.trim();
    }
    if (payload.class_standing !== undefined) {
      body.class_standing = payload.class_standing;
    }
    if (payload.department_id !== undefined) {
      body.department_id = payload.department_id && payload.department_id.trim() !== ''
        ? payload.department_id.trim()
        : null;
    }
    return api.patch<ApiStudentDetail>(API_ENDPOINTS.STUDENTS.BY_ID(id), body);
  },

  // ── Lecturers (Lecturer Management API) ─────────────────────────────────────
  async getLecturers(params?: LecturerFilterParams): Promise<ApiLecturerListItem[]> {
    const queryParams = new URLSearchParams();
    if (params?.search && params.search.trim()) {
      queryParams.append('search', params.search.trim());
    }
    if (params?.department && params.department.trim() && params.department !== 'ALL') {
      queryParams.append('department', params.department.trim());
    }

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.LECTURERS.ROOT}?${queryString}`
      : API_ENDPOINTS.LECTURERS.ROOT;

    const data = await api.get<ApiLecturerListItem[] | { results?: ApiLecturerListItem[]; data?: ApiLecturerListItem[] }>(
      endpoint
    );

    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.results)) {
      return data.results;
    }
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    return [];
  },

  async getLecturerById(id: string): Promise<ApiLecturerDetail> {
    return api.get<ApiLecturerDetail>(API_ENDPOINTS.LECTURERS.BY_ID(id));
  },

  async updateLecturer(id: string, payload: UpdateLecturerPayload): Promise<ApiLecturerDetail> {
    const body: Record<string, unknown> = {};
    if (payload.faculty_identifier !== undefined) {
      body.faculty_identifier = payload.faculty_identifier.trim();
    }
    if (payload.department_id !== undefined) {
      body.department_id = payload.department_id && payload.department_id.trim() !== ''
        ? payload.department_id.trim()
        : null;
    }
    return api.patch<ApiLecturerDetail>(API_ENDPOINTS.LECTURERS.BY_ID(id), body);
  },

  // ── Tags (Question Tags API) ───────────────────────────────────────────────
  async getTags(): Promise<Tag[]> {
    const data = await api.get<Tag[] | { results?: Tag[]; data?: Tag[] }>(API_ENDPOINTS.TAGS.ROOT);
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.results)) {
      return data.results;
    }
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    return [];
  },

  async getTagById(id: string): Promise<Tag> {
    return api.get<Tag>(API_ENDPOINTS.TAGS.BY_ID(id));
  },

  async createTag(payload: CreateTagPayload): Promise<Tag> {
    return api.post<Tag>(API_ENDPOINTS.TAGS.ROOT, {
      name: payload.name.trim(),
    });
  },

  async updateTag(id: string, payload: UpdateTagPayload): Promise<Tag> {
    return api.put<Tag>(API_ENDPOINTS.TAGS.BY_ID(id), {
      name: payload.name.trim(),
    });
  },

  async patchTag(id: string, payload: Partial<UpdateTagPayload>): Promise<Tag> {
    const body: Record<string, unknown> = {};
    if (payload.name !== undefined) {
      body.name = payload.name.trim();
    }
    return api.patch<Tag>(API_ENDPOINTS.TAGS.BY_ID(id), body);
  },

  async deleteTag(id: string): Promise<void> {
    return api.delete<void>(API_ENDPOINTS.TAGS.BY_ID(id));
  },
};
