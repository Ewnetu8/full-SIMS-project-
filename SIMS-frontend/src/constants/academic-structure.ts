export interface AASTUDepartment {
  id: string;
  name: string;
  code: string;
  collegeId: string;
}

export interface AASTUCollege {
  id: string;
  name: string;
  code: string;
  departments: AASTUDepartment[];
}

export const AASTU_ACADEMIC_STRUCTURE: AASTUCollege[] = [
  {
    id: 'col-coe-001',
    name: 'College of Engineering',
    code: 'COE',
    departments: [
      { id: 'dept-che-001', name: 'Chemical Engineering', code: 'CHE', collegeId: 'col-coe-001' },
      { id: 'dept-eme-002', name: 'Electromechanical Engineering', code: 'EME', collegeId: 'col-coe-001' },
      { id: 'dept-ece-003', name: 'Electrical Engineering', code: 'ECE', collegeId: 'col-coe-001' },
      { id: 'dept-ce-004', name: 'Civil Engineering', code: 'CE', collegeId: 'col-coe-001' },
      { id: 'dept-env-005', name: 'Environmental Engineering', code: 'ENV', collegeId: 'col-coe-001' },
      { id: 'dept-se-006', name: 'Software Engineering', code: 'SE', collegeId: 'col-coe-001' },
      { id: 'dept-mne-007', name: 'Mining Engineering', code: 'MNE', collegeId: 'col-coe-001' },
      { id: 'dept-me-008', name: 'Mechanical Engineering', code: 'ME', collegeId: 'col-coe-001' },
    ],
  },
  {
    id: 'col-coas-002',
    name: 'College of Applied Sciences',
    code: 'COAS',
    departments: [
      { id: 'dept-fn-009', name: 'Food and Nutrition', code: 'FN', collegeId: 'col-coas-002' },
      { id: 'dept-bt-010', name: 'Biotechnology', code: 'BT', collegeId: 'col-coas-002' },
      { id: 'dept-ind-011', name: 'Industrial', code: 'IND', collegeId: 'col-coas-002' },
      { id: 'dept-gl-012', name: 'Geology', code: 'GL', collegeId: 'col-coas-002' },
    ],
  },
];

/**
 * Helper to get all AASTU Colleges
 */
export function getAASTUColleges(): Array<{ id: string; name: string; code: string }> {
  return AASTU_ACADEMIC_STRUCTURE.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
  }));
}

/**
 * Helper to get Departments belonging to a specific College (by college ID, name, or code)
 */
export function getAASTUDepartmentsByCollege(collegeIdOrCode?: string | null): AASTUDepartment[] {
  if (!collegeIdOrCode) {
    return getAllAASTUDepartments();
  }

  const query = collegeIdOrCode.trim().toLowerCase();
  const college = AASTU_ACADEMIC_STRUCTURE.find(
    (c) =>
      c.id.toLowerCase() === query ||
      c.code.toLowerCase() === query ||
      c.name.toLowerCase() === query,
  );

  return college ? college.departments : [];
}

/**
 * Helper to get all AASTU Departments flattened
 */
export function getAllAASTUDepartments(): AASTUDepartment[] {
  return AASTU_ACADEMIC_STRUCTURE.flatMap((c) => c.departments);
}
