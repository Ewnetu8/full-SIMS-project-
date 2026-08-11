'use client';

import * as React from 'react';
import { Label } from '@/components/forms';
import {
  AASTU_ACADEMIC_STRUCTURE,
  getAASTUDepartmentsByCollege,
  type AASTUDepartment,
} from '@/constants/academic-structure';

export interface CollegeDepartmentSelectProps {
  collegeValue: string;
  onCollegeChange: (collegeId: string) => void;
  departmentValue: string;
  onDepartmentChange: (departmentId: string) => void;
  collegeLabel?: string;
  departmentLabel?: string;
  collegeError?: string;
  departmentError?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CollegeDepartmentSelect({
  collegeValue,
  onCollegeChange,
  departmentValue,
  onDepartmentChange,
  collegeLabel = 'College',
  departmentLabel = 'Department',
  collegeError,
  departmentError,
  required = false,
  disabled = false,
  className = '',
}: CollegeDepartmentSelectProps) {
  // Available departments dependent on currently selected college
  const availableDepartments: AASTUDepartment[] = React.useMemo(() => {
    if (!collegeValue) return [];
    return getAASTUDepartmentsByCollege(collegeValue);
  }, [collegeValue]);

  const selectClass =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus:border-[#102A7A] disabled:cursor-not-allowed disabled:opacity-50 mt-1.5 transition-all shadow-sm';

  const handleCollegeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCollegeId = e.target.value;
    onCollegeChange(selectedCollegeId);
    // Reset department when college changes
    const newDepts = getAASTUDepartmentsByCollege(selectedCollegeId);
    onDepartmentChange(newDepts[0]?.id || newDepts[0]?.name || '');
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${className}`}>
      {/* College Dropdown */}
      <div>
        <Label required={required}>{collegeLabel}</Label>
        <select
          className={selectClass}
          value={collegeValue}
          onChange={handleCollegeSelect}
          disabled={disabled}
        >
          <option value="">-- Select College --</option>
          {AASTU_ACADEMIC_STRUCTURE.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
        {collegeError && <p className="text-xs text-destructive mt-1">{collegeError}</p>}
      </div>

      {/* Dependent Department Dropdown */}
      <div>
        <Label required={required}>{departmentLabel}</Label>
        <select
          className={selectClass}
          value={departmentValue}
          onChange={(e) => onDepartmentChange(e.target.value)}
          disabled={disabled || !collegeValue}
        >
          {!collegeValue ? (
            <option value="">-- Select College First --</option>
          ) : availableDepartments.length === 0 ? (
            <option value="">No departments available</option>
          ) : (
            <>
              <option value="">-- Select Department --</option>
              {availableDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </>
          )}
        </select>
        {departmentError && <p className="text-xs text-destructive mt-1">{departmentError}</p>}
      </div>
    </div>
  );
}
