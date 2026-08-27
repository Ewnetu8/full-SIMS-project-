'use client';

import { Check, ChevronDown, Search, X } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui';

import type {
  AdminCourseOffering,
  ApiLecturerListItem,
  Course,
  Semester,
  AcademicYear,
  TeachingAssignment,
} from '../types';

// Helper to format offering display
export function getOfferingLabel(
  offering: AdminCourseOffering,
  courses: Course[] = [],
  semesters: Semester[] = [],
  academicYears: AcademicYear[] = []
): {
  code: string;
  title: string;
  section: string;
  semester: string;
  academicYear: string;
  capacity?: number;
} {
  const crs = courses.find((c) => c.id === offering.course);
  const sem = semesters.find((s) => s.id === offering.semester);
  const ay = sem ? academicYears.find((a) => a.id === sem.academicYear) : undefined;

  const code = offering.course_code || offering.course_detail?.course_code || crs?.code || 'COURSE';
  const title = offering.course_title || offering.course_detail?.title || crs?.name || crs?.title || 'Course Offering';
  const section = offering.section ? `Section ${offering.section}` : 'Section A';
  const semester =
    offering.semester_detail?.semester_index ||
    offering.semester_detail?.semesterIndex ||
    sem?.semesterIndex ||
    '1';
  const academicYear =
    offering.semester_detail?.academic_year_detail?.display_label ||
    offering.semester_detail?.academicYearDetail?.displayLabel ||
    ay?.displayLabel ||
    'Academic Year';

  return {
    code,
    title,
    section,
    semester: semester ? `${semester} Semester` : 'Semester',
    academicYear,
    capacity: offering.capacity,
  };
}

// ─── 1. COURSE OFFERING DROPDOWN ─────────────────────────────────────────────

export interface CourseOfferingDropdownProps {
  value: string;
  onChange: (offeringId: string) => void;
  offerings: AdminCourseOffering[];
  courses?: Course[];
  semesters?: Semester[];
  academicYears?: AcademicYear[];
  teachingAssignments?: TeachingAssignment[];
  selectedLecturerId?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  isLoading?: boolean;
}

export function CourseOfferingDropdown({
  value,
  onChange,
  offerings = [],
  courses = [],
  semesters = [],
  academicYears = [],
  teachingAssignments = [],
  selectedLecturerId,
  disabled = false,
  error,
  label = 'Course Offering',
  required = true,
  placeholder = 'Select course offering',
  isLoading = false,
}: CourseOfferingDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Selected item detail
  const selectedOffering = React.useMemo(() => {
    if (!value) return null;
    return offerings.find((o) => o.id === value) || null;
  }, [value, offerings]);

  const selectedDisplay = React.useMemo(() => {
    if (!selectedOffering) return null;
    return getOfferingLabel(selectedOffering, courses, semesters, academicYears);
  }, [selectedOffering, courses, semesters, academicYears]);

  // Click outside listener
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filtered offerings
  const filteredOfferings = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return offerings;
    return offerings.filter((offering) => {
      const info = getOfferingLabel(offering, courses, semesters, academicYears);
      return (
        info.code.toLowerCase().includes(q) ||
        info.title.toLowerCase().includes(q) ||
        info.section.toLowerCase().includes(q) ||
        info.semester.toLowerCase().includes(q) ||
        info.academicYear.toLowerCase().includes(q)
      );
    });
  }, [offerings, courses, semesters, academicYears, searchQuery]);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="text-xs font-semibold text-foreground flex items-center justify-between">
        <span>
          {label} {required && <span className="text-destructive">*</span>}
        </span>
        {offerings.length > 0 && (
          <span className="text-[11px] text-muted-foreground font-normal">
            {offerings.length} available
          </span>
        )}
      </label>

      <div className="relative">
        {/* Dropdown Trigger Button */}
        <button
          type="button"
          disabled={disabled || isLoading}
          onClick={() => {
            if (!disabled && !isLoading) {
              setIsOpen(!isOpen);
              setSearchQuery('');
            }
          }}
          className={`flex w-full items-center justify-between rounded-lg border bg-background text-left transition-all ${
            selectedDisplay ? 'p-2.5 min-h-[50px]' : 'h-10 px-3'
          } ${
            error
              ? 'border-destructive focus:ring-destructive'
              : isOpen
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-input hover:border-primary/40'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-muted/40' : 'cursor-pointer'}`}
        >
          {isLoading ? (
            <span className="text-xs text-muted-foreground">Loading course offerings...</span>
          ) : selectedDisplay ? (
            <div className="min-w-0 flex-1 pr-2">
              <p className="font-semibold text-foreground text-xs truncate">
                <span className="font-mono text-primary font-bold mr-1.5">{selectedDisplay.code}</span>
                {selectedDisplay.title}
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {selectedDisplay.section} · {selectedDisplay.semester} · {selectedDisplay.academicYear}
                {typeof selectedDisplay.capacity === 'number' && ` · Capacity: ${selectedDisplay.capacity}`}
              </p>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">{placeholder}</span>
          )}

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-primary' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu Popover */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
            {/* Search filter input */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search course offerings by code, title, section..."
                className="h-8.5 w-full rounded-lg border border-input bg-background pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* List of Options */}
            <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
              {filteredOfferings.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  {offerings.length === 0 ? 'No course offerings available.' : 'No matching course offerings found.'}
                </div>
              ) : (
                filteredOfferings.map((offering) => {
                  const info = getOfferingLabel(offering, courses, semesters, academicYears);
                  const isSelected = offering.id === value;
                  const isAlreadyAssigned = selectedLecturerId
                    ? teachingAssignments.some(
                        (a) => a.course_offering === offering.id && a.lecturer === selectedLecturerId
                      )
                    : false;

                  return (
                    <div
                      key={offering.id}
                      onClick={() => {
                        if (!isAlreadyAssigned) {
                          onChange(offering.id);
                          setIsOpen(false);
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                        isAlreadyAssigned
                          ? 'opacity-40 bg-muted/20 cursor-not-allowed'
                          : isSelected
                          ? 'bg-primary/10 border border-primary/40 font-medium text-foreground'
                          : 'cursor-pointer hover:bg-accent/60 text-foreground'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-primary">{info.code}</span>
                          <span className="font-semibold text-foreground truncate">— {info.title}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {info.section} · {info.semester} · {info.academicYear}
                          {typeof info.capacity === 'number' && ` · Capacity: ${info.capacity}`}
                        </p>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isAlreadyAssigned ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Already assigned
                          </Badge>
                        ) : isSelected ? (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

// ─── 2. LECTURER DROPDOWN ────────────────────────────────────────────────────

export interface LecturerDropdownProps {
  value: string;
  onChange: (lecturerId: string) => void;
  lecturers: ApiLecturerListItem[];
  teachingAssignments?: TeachingAssignment[];
  selectedOfferingId?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  isLoading?: boolean;
}

export function LecturerDropdown({
  value,
  onChange,
  lecturers = [],
  teachingAssignments = [],
  selectedOfferingId,
  disabled = false,
  error,
  label = 'Lecturer',
  required = true,
  placeholder = 'Select lecturer',
  isLoading = false,
}: LecturerDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Selected item detail
  const selectedLecturer = React.useMemo(() => {
    if (!value) return null;
    return lecturers.find((l) => l.id === value) || null;
  }, [value, lecturers]);

  // Click outside listener
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filtered lecturers
  const filteredLecturers = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return lecturers;
    return lecturers.filter((l) => {
      const name = (l.user_full_name || '').toLowerCase();
      const email = (l.user_email || '').toLowerCase();
      const id = (l.faculty_identifier || '').toLowerCase();
      const dept = (l.department_detail?.name || '').toLowerCase();
      return name.includes(q) || email.includes(q) || id.includes(q) || dept.includes(q);
    });
  }, [lecturers, searchQuery]);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="text-xs font-semibold text-foreground flex items-center justify-between">
        <span>
          {label} {required && <span className="text-destructive">*</span>}
        </span>
        {lecturers.length > 0 && (
          <span className="text-[11px] text-muted-foreground font-normal">
            {lecturers.length} available
          </span>
        )}
      </label>

      <div className="relative">
        {/* Dropdown Trigger Button */}
        <button
          type="button"
          disabled={disabled || isLoading}
          onClick={() => {
            if (!disabled && !isLoading) {
              setIsOpen(!isOpen);
              setSearchQuery('');
            }
          }}
          className={`flex w-full items-center justify-between rounded-lg border bg-background text-left transition-all ${
            selectedLecturer ? 'p-2.5 min-h-[50px]' : 'h-10 px-3'
          } ${
            error
              ? 'border-destructive focus:ring-destructive'
              : isOpen
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-input hover:border-primary/40'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-muted/40' : 'cursor-pointer'}`}
        >
          {isLoading ? (
            <span className="text-xs text-muted-foreground">Loading lecturers...</span>
          ) : selectedLecturer ? (
            <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-foreground text-xs">
                  Dr. {selectedLecturer.user_full_name}
                </span>
                {selectedLecturer.faculty_identifier && (
                  <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1 py-0.5 rounded-sm">
                    {selectedLecturer.faculty_identifier}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {selectedLecturer.department_detail?.name || 'Academic Faculty'} · {selectedLecturer.user_email}
              </p>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">{placeholder}</span>
          )}

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-primary' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu Popover */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
            {/* Search filter input */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lecturers by name, email, department, faculty ID..."
                className="h-8.5 w-full rounded-lg border border-input bg-background pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* List of Options */}
            <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
              {filteredLecturers.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  {lecturers.length === 0 ? 'No lecturers available.' : 'No matching lecturers found.'}
                </div>
              ) : (
                filteredLecturers.map((lec) => {
                  const isSelected = lec.id === value;
                  const isAlreadyAssigned = selectedOfferingId
                    ? teachingAssignments.some(
                        (a) => a.course_offering === selectedOfferingId && a.lecturer === lec.id
                      )
                    : false;

                  return (
                    <div
                      key={lec.id}
                      onClick={() => {
                        if (!isAlreadyAssigned) {
                          onChange(lec.id);
                          setIsOpen(false);
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                        isAlreadyAssigned
                          ? 'opacity-40 bg-muted/20 cursor-not-allowed'
                          : isSelected
                          ? 'bg-primary/10 border border-primary/40 font-medium text-foreground'
                          : 'cursor-pointer hover:bg-accent/60 text-foreground'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-foreground">
                            Dr. {lec.user_full_name}
                          </span>
                          {lec.faculty_identifier && (
                            <Badge variant="outline" className="text-[10px] font-mono py-0">
                              {lec.faculty_identifier}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {lec.department_detail?.name || 'Academic Faculty'} · {lec.user_email}
                        </p>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isAlreadyAssigned ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Already assigned to this course offering
                          </Badge>
                        ) : isSelected ? (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
