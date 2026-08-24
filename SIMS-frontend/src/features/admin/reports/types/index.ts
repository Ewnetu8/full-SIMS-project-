import type { Semester } from '@/features/admin/types';

export interface AdvisingStudent {
  student_id: string;
  student_identifier: string;
  class_standing: string;
  enrolled_credit_hours: number;
  min_credit_hours: number;
}

export interface AdvisingReportResponse {
  semester_id: string;
  semester_label: string;
  students: AdvisingStudent[];
}

export type ClassStandingFilter = 'ALL' | 'FRESHMAN' | 'SOPHOMORE' | 'JUNIOR' | 'SENIOR' | 'GRADUATE' | string;

export interface AdvisingFilterState {
  searchTerm: string;
  classStandingFilter: ClassStandingFilter;
}

export interface AdvisingStudentWithDeficit extends AdvisingStudent {
  creditDeficit: number;
}

export interface AdvisingMetrics {
  totalStudentsRequiringAdvising: number;
  totalCreditDeficitHours: number;
  averageCreditDeficit: number;
  maxCreditDeficit: number;
}

export type { Semester };
