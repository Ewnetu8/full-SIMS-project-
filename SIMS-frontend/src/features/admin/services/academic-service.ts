import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { api } from '@/services/api-client';

import type { College, Program, AcademicYear, Semester, Department, Course } from '../types';

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
  semester_index: 'FIRST' | 'SECOND';
  created_at?: string;
  updated_at?: string;
}

export interface ApiCourse {
  id: string;
  program?: string | null;
  program_detail?: ApiProgram;
  title: string;
  course_code: string;
  credit_hours: number;
  intended_class_standing?: string;
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
    const payload: Record<string, any> = {};
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

    const payload: Record<string, any> = {
      department: departmentId,
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      degree_level: data.degree_level || 'BACHELOR',
      total_credit_hours_required: Number(data.total_credit_hours_required ?? 120),
    };

    const endpoint = API_ENDPOINTS.ACADEMICS.PROGRAMS;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG] Program Creation Request:', {
        url: endpoint,
        payload,
      });
    }

    try {
      const res = await api.post<ApiProgram>(endpoint, payload);

      if (process.env.NODE_ENV !== 'production') {
        console.log('[DEBUG] Program Creation Response (201 Created):', res);
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
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[DEBUG] Program Creation Error:', {
          status: err?.statusCode || err?.response?.status || 400,
          errors: err?.errors || err?.response?.data || err?.message,
        });
      }
      throw err;
    }
  },

  async updateProgram(id: string, data: Partial<{ department?: string; name: string; code: string; degree_level?: string; total_credit_hours_required?: number }>): Promise<Program> {
    const payload: Record<string, any> = {};
    if (data.department !== undefined) payload.department = data.department;
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.code !== undefined) payload.code = data.code.trim().toUpperCase();
    if (data.degree_level !== undefined) payload.degree_level = data.degree_level;
    if (data.total_credit_hours_required !== undefined) payload.total_credit_hours_required = Number(data.total_credit_hours_required);

    const endpoint = API_ENDPOINTS.ACADEMICS.PROGRAM_BY_ID(id);

    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG] Program Update Request:', {
        url: endpoint,
        payload,
      });
    }

    try {
      const res = await api.patch<ApiProgram>(endpoint, payload);

      if (process.env.NODE_ENV !== 'production') {
        console.log('[DEBUG] Program Update Response:', res);
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
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[DEBUG] Program Update Error:', {
          status: err?.statusCode || err?.response?.status || 400,
          errors: err?.errors || err?.response?.data || err?.message,
        });
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
    const raw = await api.get<ApiSemester[]>(API_ENDPOINTS.ACADEMICS.SEMESTERS);
    return raw.map((s) => ({
      id: s.id,
      academicYear: s.academic_year,
      academicYearDetail: s.academic_year_detail
        ? {
          id: s.academic_year_detail.id,
          displayLabel: s.academic_year_detail.display_label,
          startBoundary: s.academic_year_detail.start_boundary,
          endBoundary: s.academic_year_detail.end_boundary,
        }
        : undefined,
      semesterIndex: s.semester_index,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));
  },

  async createSemester(data: { academic_year: string; semester_index: 'FIRST' | 'SECOND' }): Promise<Semester> {
    const res = await api.post<ApiSemester>(API_ENDPOINTS.ACADEMICS.SEMESTERS, data);
    return {
      id: res.id,
      academicYear: res.academic_year,
      academicYearDetail: res.academic_year_detail
        ? {
          id: res.academic_year_detail.id,
          displayLabel: res.academic_year_detail.display_label,
          startBoundary: res.academic_year_detail.start_boundary,
          endBoundary: res.academic_year_detail.end_boundary,
        }
        : undefined,
      semesterIndex: res.semester_index,
      createdAt: res.created_at,
      updatedAt: res.updated_at,
    };
  },

  async updateSemester(id: string, data: Partial<{ semester_index: 'FIRST' | 'SECOND' }>): Promise<Semester> {
    const res = await api.patch<ApiSemester>(API_ENDPOINTS.ACADEMICS.SEMESTER_BY_ID(id), data);
    return {
      id: res.id,
      academicYear: res.academic_year,
      academicYearDetail: res.academic_year_detail
        ? {
          id: res.academic_year_detail.id,
          displayLabel: res.academic_year_detail.display_label,
          startBoundary: res.academic_year_detail.start_boundary,
          endBoundary: res.academic_year_detail.end_boundary,
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
    return raw.map((c) => ({
      id: c.id,
      code: c.course_code,
      name: c.title,
      creditHours: c.credit_hours,
      department: 'Academic Department',
      assignedLecturer: { id: '', name: 'Unassigned' },
      studentCount: 0,
      status: 'active',
      semester: 'Current Semester',
    }));
  },

  async createCourse(data: { title: string; course_code: string; credit_hours: number; program?: string | null; intended_class_standing?: string }): Promise<Course> {
    const res = await api.post<ApiCourse>(API_ENDPOINTS.ACADEMICS.COURSES, {
      title: data.title,
      course_code: data.course_code.toUpperCase(),
      credit_hours: data.credit_hours,
      program: data.program || null,
      ...(data.intended_class_standing ? { intended_class_standing: data.intended_class_standing } : {}),
    });
    return {
      id: res.id,
      code: res.course_code,
      name: res.title,
      creditHours: res.credit_hours,
      department: 'Academic Department',
      assignedLecturer: { id: '', name: 'Unassigned' },
      studentCount: 0,
      status: 'active',
      semester: 'Current Semester',
    };
  },

  async updateCourse(id: string, data: Partial<{ title: string; course_code: string; credit_hours: number }>): Promise<Course> {
    const res = await api.patch<ApiCourse>(API_ENDPOINTS.ACADEMICS.COURSE_BY_ID(id), data);
    return {
      id: res.id,
      code: res.course_code,
      name: res.title,
      creditHours: res.credit_hours,
      department: 'Academic Department',
      assignedLecturer: { id: '', name: 'Unassigned' },
      studentCount: 0,
      status: 'active',
      semester: 'Current Semester',
    };
  },

  async deleteCourse(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.ACADEMICS.COURSE_BY_ID(id));
  },
};
