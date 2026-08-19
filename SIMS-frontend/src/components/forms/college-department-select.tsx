'use client';

import * as React from 'react';
import { Label } from '@/components/forms';

export interface CollegeDepartmentSelectProps {
  collegeValue: string;
  onCollegeChange: (collegeId: string) => void;
  departmentValue: string;
  onDepartmentChange: (departmentId: string) => void;
  colleges?: Array<{ id: string; name: string; code: string }>;
  departments?: Array<{ id: string; name: string; code: string; college?: string | null }>;
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
  colleges = [],
  departments = [],
  collegeLabel = 'College',
  departmentLabel = 'Department',
  collegeError,
  departmentError,
  required = false,
  disabled = false,
  className = '',
}: CollegeDepartmentSelectProps) {
  // Available departments dependent on currently selected college
  const availableDepartments = React.useMemo(() => {
    if (!collegeValue) return departments;
    return departments.filter(
      (d) =>
        d.college === collegeValue ||
        (colleges.find((c) => c.name === collegeValue || c.code === collegeValue)?.id === d.college)
    );
  }, [collegeValue, departments, colleges]);

  const selectClass =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus:border-[#102A7A] disabled:cursor-not-allowed disabled:opacity-50 mt-1.5 transition-all shadow-sm';

  const handleCollegeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCollegeId = e.target.value;
    onCollegeChange(selectedCollegeId);
    // Reset department selection when college changes
    onDepartmentChange('');
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
          <option value="">-- Select College (Optional) --</option>
          {colleges.map((c) => (
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
          disabled={disabled}
        >
          <option value="">-- Select Department --</option>
          {availableDepartments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>
        {departmentError && <p className="text-xs text-destructive mt-1">{departmentError}</p>}
      </div>
    </div>
  );
}
