// ─── Centralized Department & College Constants ──────────────────────────────

export interface DepartmentInfo {
  id: string;
  code: string;
  name: string;
  college: 'College of Engineering' | 'College of Applied Science';
}

export const COLLEGES = [
  'College of Engineering',
  'College of Applied Science',
] as const;

export type CollegeName = (typeof COLLEGES)[number];

export const ALL_DEPARTMENTS: DepartmentInfo[] = [
  // College of Engineering (9 Departments)
  {
    id: 'dept-che',
    code: 'ChE',
    name: 'Chemical Engineering',
    college: 'College of Engineering',
  },
  {
    id: 'dept-eme',
    code: 'EME',
    name: 'Electromechanical Engineering',
    college: 'College of Engineering',
  },
  {
    id: 'dept-ece',
    code: 'ECE',
    name: 'Electrical Engineering',
    college: 'College of Engineering',
  },
  {
    id: 'dept-ce',
    code: 'CE',
    name: 'Civil Engineering',
    college: 'College of Engineering',
  },
  {
    id: 'dept-enve',
    code: 'EnvE',
    name: 'Environmental Engineering',
    college: 'College of Engineering',
  },
  {
    id: 'dept-se',
    code: 'SE',
    name: 'Software Engineering',
    college: 'College of Engineering',
  },
  {
    id: 'dept-mine',
    code: 'MinE',
    name: 'Mining Engineering',
    college: 'College of Engineering',
  },
  {
    id: 'dept-me',
    code: 'ME',
    name: 'Mechanical Engineering',
    college: 'College of Engineering',
  },
  {
    id: 'dept-arche',
    code: 'ArchE',
    name: 'Architectural Engineering',
    college: 'College of Engineering',
  },

  // College of Applied Science (4 Departments)
  {
    id: 'dept-fn',
    code: 'FN',
    name: 'Food and Nutrition',
    college: 'College of Applied Science',
  },
  {
    id: 'dept-biot',
    code: 'BioT',
    name: 'Biotechnology',
    college: 'College of Applied Science',
  },
  {
    id: 'dept-ind',
    code: 'Ind',
    name: 'Industrial',
    college: 'College of Applied Science',
  },
  {
    id: 'dept-geo',
    code: 'Geo',
    name: 'Geology',
    college: 'College of Applied Science',
  },
];

/**
 * Filter departments by college name.
 * If college is omitted or empty, returns all departments.
 */
export function getDepartmentsByCollege(college?: string): DepartmentInfo[] {
  if (!college || college === 'ALL') {
    return ALL_DEPARTMENTS;
  }
  return ALL_DEPARTMENTS.filter((d) => d.college === college);
}
