'use client';

import {
  UserCheck,
  Eye,
  Edit2,
  Building,
  Mail,
  Calendar,
  Clock,
  Shield,
  RefreshCw,
  AlertCircle,
  School,
  BookOpen,
  PlusCircle,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  BookCheck,
  Plus,
  ArrowDown,
} from 'lucide-react';
import * as React from 'react';

import { toast } from '@/components/feedback';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  SearchInput,
} from '@/components/ui';
import { parseFieldErrors, getUserFriendlyErrorMessage } from '@/lib/errors';

import { CourseOfferingDropdown, LecturerDropdown } from './assignment-form-dropdowns';
import { useAdminStore } from '../store';
import type {
  ApiLecturerListItem,
  ApiLecturerDetail,
  UpdateLecturerPayload,
  TeachingAssignment,
  CreateTeachingAssignmentPayload,
} from '../types';

export function LecturerManagement() {
  const {
    lecturers,
    departments,
    colleges,
    isLoadingLecturers,
    lecturersError,
    lecturerSearchQuery,
    lecturerDeptFilter,
    fetchLecturers,
    fetchLecturerById,
    updateLecturer,
    fetchDepartments,
    fetchColleges,
    setLecturerSearchQuery,
    setLecturerDeptFilter,
    // Teaching Assignments & Academic store
    teachingAssignments,
    isLoadingTeachingAssignments,
    teachingAssignmentsError,
    fetchTeachingAssignments,
    addTeachingAssignment,
    updateTeachingAssignment,
    deleteTeachingAssignment,
    courseOfferings,
    isLoadingCourseOfferings,
    courses,
    semesters,
    academicYears,
    fetchCourseOfferings,
    fetchCourses,
    fetchSemesters,
    fetchAcademicYears,
  } = useAdminStore();

  // Local college filter to narrow down department dropdown
  const [lecturerCollegeFilter, setLecturerCollegeFilter] = React.useState<string>('ALL');

  // Search input with debounce
  const [localSearch, setLocalSearch] = React.useState(lecturerSearchQuery);

  // Profile Details Modal state
  const [viewingLecturerId, setViewingLecturerId] = React.useState<string | null>(null);
  const [viewingLecturerDetail, setViewingLecturerDetail] = React.useState<ApiLecturerDetail | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);

  // Edit Profile Modal state
  const [editingLecturer, setEditingLecturer] = React.useState<ApiLecturerListItem | null>(null);
  const [editForm, setEditForm] = React.useState<{
    faculty_identifier: string;
    department_id: string;
  }>({
    faculty_identifier: '',
    department_id: '',
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [editErrors, setEditErrors] = React.useState<Record<string, string>>({});
  const [editFormError, setEditFormError] = React.useState<string | null>(null);

  // View Assignments Modal state
  const [viewingAssignmentsLecturer, setViewingAssignmentsLecturer] = React.useState<ApiLecturerListItem | null>(null);

  // Assign Course Modal state
  const [assigningLecturer, setAssigningLecturer] = React.useState<ApiLecturerListItem | null>(null);
  const [assignCourseOfferingId, setAssignCourseOfferingId] = React.useState<string>('');
  const [assignIsActive, setAssignIsActive] = React.useState<boolean>(true);
  const [isSubmittingAssign, setIsSubmittingAssign] = React.useState<boolean>(false);
  const [assignFormError, setAssignFormError] = React.useState<string | null>(null);

  // Remove Assignment Confirmation Modal state
  const [removingAssignment, setRemovingAssignment] = React.useState<{
    assignment: TeachingAssignment;
    lecturer: ApiLecturerListItem;
    courseCode: string;
    courseTitle: string;
  } | null>(null);
  const [isRemovingAssignment, setIsRemovingAssignment] = React.useState<boolean>(false);
  const [togglingAssignmentId, setTogglingAssignmentId] = React.useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Immediate initial load on mount
  React.useEffect(() => {
    fetchDepartments();
    fetchColleges();
    fetchTeachingAssignments();
    fetchCourseOfferings();
    fetchCourses();
    fetchSemesters();
    fetchAcademicYears();
    fetchLecturers({
      search: localSearch,
      department: lecturerDeptFilter,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Course Offering Lookup helper
  const getOfferingDisplay = React.useCallback(
    (offeringId: string, detail?: TeachingAssignment['course_offering_detail']) => {
      if (detail) {
        return {
          id: detail.id || offeringId,
          courseCode: detail.course_code || 'CODE',
          courseTitle: detail.course_title || 'Course Title',
          semester: detail.semester || 'Academic Year',
          semesterIndex: detail.semester_index || 'Semester',
          section: detail.section || '',
        };
      }

      const found = courseOfferings.find((co) => co.id === offeringId);
      if (found) {
        const crs = courses.find((c) => c.id === found.course);
        const sem = semesters.find((s) => s.id === found.semester);
        const ay = sem ? academicYears.find((a) => a.id === sem.academicYear) : undefined;
        return {
          id: found.id,
          courseCode: found.course_code || crs?.code || 'CODE',
          courseTitle: found.course_title || crs?.name || crs?.title || 'Course Title',
          semester: ay?.displayLabel || sem?.academicYearDetail?.displayLabel || 'Academic Year',
          semesterIndex: sem?.semesterIndex ? `${sem.semesterIndex}` : 'Semester',
          section: found.section || '',
        };
      }

      return {
        id: offeringId,
        courseCode: 'COURSE',
        courseTitle: 'Course Offering',
        semester: 'Semester',
        semesterIndex: '',
        section: '',
      };
    },
    [courseOfferings, courses, semesters, academicYears]
  );

  // Active Assignment Counts per Lecturer Map (O(N) single-pass lookup)
  const lecturerActiveAssignmentCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of teachingAssignments) {
      if (a.is_active !== false) {
        map[a.lecturer] = (map[a.lecturer] || 0) + 1;
      }
    }
    return map;
  }, [teachingAssignments]);

  // Lecturer teaching assignments getter
  const getLecturerAssignments = React.useCallback(
    (lecturerId: string) => {
      return teachingAssignments.filter((a) => a.lecturer === lecturerId);
    },
    [teachingAssignments]
  );

  // Debounced search effect when typing in search input
  const isFirstSearchRun = React.useRef(true);
  React.useEffect(() => {
    if (isFirstSearchRun.current) {
      isFirstSearchRun.current = false;
      return;
    }

    const timer = setTimeout(() => {
      setLecturerSearchQuery(localSearch);
      fetchLecturers({
        search: localSearch,
        department: lecturerDeptFilter,
      });
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [localSearch, lecturerDeptFilter, fetchLecturers, setLecturerSearchQuery]);

  const handleDepartmentChange = (newDept: string) => {
    setLecturerDeptFilter(newDept);
    setCurrentPage(1);
    fetchLecturers({
      search: localSearch,
      department: newDept,
    });
  };

  const handleCollegeChange = (newCollege: string) => {
    setLecturerCollegeFilter(newCollege);
    setLecturerDeptFilter('ALL');
    setCurrentPage(1);
    fetchLecturers({
      search: localSearch,
      department: 'ALL',
    });
  };

  // Filter departments dropdown by selected college
  const filteredDepartments = React.useMemo(() => {
    if (!lecturerCollegeFilter || lecturerCollegeFilter === 'ALL') return departments;
    return departments.filter(
      (d) =>
        d.college === lecturerCollegeFilter ||
        colleges.find((c) => c.name === lecturerCollegeFilter || c.code === lecturerCollegeFilter)?.id === d.college
    );
  }, [departments, colleges, lecturerCollegeFilter]);

  // Open Details Modal
  const handleOpenDetails = async (lecturer: ApiLecturerListItem) => {
    setViewingLecturerId(lecturer.id);
    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      const detail = await fetchLecturerById(lecturer.id);
      setViewingLecturerDetail(detail);
    } catch (err: unknown) {
      setProfileError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (lecturer: ApiLecturerListItem) => {
    setEditingLecturer(lecturer);
    setEditForm({
      faculty_identifier: lecturer.faculty_identifier,
      department_id: lecturer.department || '',
    });
    setEditErrors({});
    setEditFormError(null);
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLecturer) return;

    setIsSaving(true);
    setEditErrors({});
    setEditFormError(null);

    const payload: UpdateLecturerPayload = {
      faculty_identifier: editForm.faculty_identifier.trim(),
      department_id: editForm.department_id ? editForm.department_id : null,
    };

    try {
      await updateLecturer(editingLecturer.id, payload);
      toast.success('Lecturer profile updated successfully');
      setEditingLecturer(null);
      // Refresh list to update current table
      fetchLecturers({
        search: localSearch,
        department: lecturerDeptFilter,
      });
    } catch (err: unknown) {
      const parsedErrors = parseFieldErrors(err);
      if (Object.keys(parsedErrors).length > 0) {
        setEditErrors(parsedErrors);
      } else {
        setEditFormError(getUserFriendlyErrorMessage(err));
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Open View Assignments Modal
  const handleOpenAssignments = (lecturer: ApiLecturerListItem) => {
    setViewingAssignmentsLecturer(lecturer);
  };

  // Open Assign Course Modal
  const [assignLecturerId, setAssignLecturerId] = React.useState('');

  const handleOpenAssignCourse = (lecturer: ApiLecturerListItem) => {
    setAssigningLecturer(lecturer);
    setAssignLecturerId(lecturer.id);
    setAssignCourseOfferingId('');
    setAssignIsActive(true);
    setAssignFormError(null);
  };

  // Submit Assign Course Form
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningLecturer) return;

    if (!assignCourseOfferingId) {
      setAssignFormError('Course offering is required.');
      return;
    }

    if (!assignLecturerId) {
      setAssignFormError('Lecturer is required.');
      return;
    }

    // Frontend duplicate check
    const existingForLecturer = teachingAssignments.find(
      (a) => a.lecturer === assignLecturerId && a.course_offering === assignCourseOfferingId
    );
    if (existingForLecturer) {
      setAssignFormError('This lecturer is already assigned to this course offering.');
      return;
    }

    setIsSubmittingAssign(true);
    setAssignFormError(null);

    const payload: CreateTeachingAssignmentPayload = {
      lecturer: assignLecturerId,
      course_offering: assignCourseOfferingId,
      is_active: assignIsActive,
    };

    try {
      await addTeachingAssignment(payload);
      toast.success('Teaching assignment created successfully.');
      setAssigningLecturer(null);
      await fetchTeachingAssignments();
    } catch (err: unknown) {
      const parsed = parseFieldErrors(err);
      if (parsed.non_field_errors) {
        setAssignFormError(parsed.non_field_errors);
      } else if (parsed.course_offering || parsed.lecturer) {
        setAssignFormError(parsed.course_offering || parsed.lecturer || null);
      } else {
        const errorMsg = getUserFriendlyErrorMessage(err);
        if (errorMsg.toLowerCase().includes('already assigned') || errorMsg.toLowerCase().includes('already exists')) {
          setAssignFormError('This lecturer is already assigned to this course offering.');
        } else if (errorMsg.toLowerCase().includes('permission') || errorMsg.includes('403')) {
          setAssignFormError('You do not have permission to assign lecturers.');
        } else {
          setAssignFormError(errorMsg || 'Unable to create teaching assignment. Please try again.');
        }
      }
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Toggle active status on an assignment
  const handleToggleStatus = async (assignment: TeachingAssignment) => {
    setTogglingAssignmentId(assignment.id);
    try {
      await updateTeachingAssignment(assignment.id, {
        is_active: !assignment.is_active,
      });
      toast.success(
        assignment.is_active
          ? 'Teaching assignment deactivated.'
          : 'Teaching assignment activated.'
      );
      await fetchTeachingAssignments();
    } catch (err: unknown) {
      toast.error(getUserFriendlyErrorMessage(err) || 'Failed to update assignment status.');
    } finally {
      setTogglingAssignmentId(null);
    }
  };

  // Open Remove Confirmation
  const handleOpenRemove = (
    assignment: TeachingAssignment,
    lecturer: ApiLecturerListItem,
    courseCode: string,
    courseTitle: string
  ) => {
    setRemovingAssignment({
      assignment,
      lecturer,
      courseCode,
      courseTitle,
    });
  };

  // Confirm Remove Assignment
  const handleConfirmRemove = async () => {
    if (!removingAssignment) return;

    setIsRemovingAssignment(true);
    try {
      await deleteTeachingAssignment(removingAssignment.assignment.id);
      toast.success('Teaching assignment removed successfully.');
      setRemovingAssignment(null);
      await fetchTeachingAssignments();
    } catch (err: unknown) {
      toast.error(getUserFriendlyErrorMessage(err) || 'Failed to remove teaching assignment.');
    } finally {
      setIsRemovingAssignment(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(lecturers.length / itemsPerPage) || 1;
  const paginatedLecturers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return lecturers.slice(startIndex, startIndex + itemsPerPage);
  }, [lecturers, currentPage, itemsPerPage]);

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" /> Lecturer &amp; Faculty Directory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse academic faculty records, view assigned courses, and manage teaching assignments directly.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <SearchInput
              placeholder="Search by faculty ID, name, or email..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onClear={() => {
                setLocalSearch('');
                setLecturerSearchQuery('');
                fetchLecturers({ search: '', department: lecturerDeptFilter });
              }}
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={lecturerCollegeFilter}
              aria-label="Filter by College"
              onChange={(e) => handleCollegeChange(e.target.value)}
            >
              <option value="ALL">All Colleges</option>
              {colleges.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className={selectClass}
              value={lecturerDeptFilter}
              aria-label="Filter by Department"
              onChange={(e) => handleDepartmentChange(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {filteredDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Error state alerts */}
      {lecturersError && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load lecturers</p>
              <p className="text-xs text-destructive/90">{lecturersError}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              fetchLecturers({
                search: localSearch,
                department: lecturerDeptFilter,
              })
            }
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" /> Retry
          </Button>
        </div>
      )}

      {teachingAssignmentsError && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Unable to load teaching assignments: {teachingAssignmentsError}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fetchTeachingAssignments()}
            className="h-7 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* Lecturer List Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Faculty ID</th>
                <th className="px-4 py-3.5">Faculty Member</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">College</th>
                <th className="px-4 py-3.5">Assigned Courses</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingLecturers ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 bg-muted rounded-sm" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-32 bg-muted rounded-sm" />
                          <div className="h-3 w-40 bg-muted/60 rounded-sm" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 bg-muted rounded-sm" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 bg-muted rounded-sm" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-5 w-24 bg-muted rounded-full" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-5 w-16 bg-muted rounded-full" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-8 w-32 bg-muted rounded-md inline-block" />
                    </td>
                  </tr>
                ))
              ) : paginatedLecturers.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <div className="max-w-md mx-auto space-y-2">
                      <UserCheck className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                      <p className="font-semibold text-foreground text-base">No Lecturers Found</p>
                      <p className="text-xs text-muted-foreground">
                        {localSearch || lecturerDeptFilter !== 'ALL' || lecturerCollegeFilter !== 'ALL'
                          ? 'No lecturer records match your active search and filter criteria.'
                          : 'There are currently no lecturer records available in the system.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Data rows
                paginatedLecturers.map((lec) => {
                  const deptName = lec.department_detail?.name || 'Unassigned';
                  const collegeName = lec.department_detail?.college_detail?.name || '—';
                  const activeAssignmentsCount = lecturerActiveAssignmentCounts[lec.id] || 0;
                  const initials = lec.user_full_name
                    ? lec.user_full_name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                    : 'LC';

                  return (
                    <tr key={lec.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-primary">
                        {lec.faculty_identifier}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {lec.user_full_name || 'Academic Faculty'}
                            </p>
                            <p className="text-xs text-muted-foreground">{lec.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[180px] truncate">
                        {deptName}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[180px] truncate">
                        {collegeName}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={activeAssignmentsCount > 0 ? 'default' : 'outline'}
                          className={`text-[11px] font-medium ${
                            activeAssignmentsCount > 0
                              ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                              : 'text-muted-foreground border-border/80'
                          }`}
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          Assigned Courses: {activeAssignmentsCount}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={lec.user_is_active ? 'success' : 'secondary'}
                          className="capitalize text-[11px]"
                        >
                          {lec.user_is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10"
                            onClick={() => handleOpenAssignments(lec)}
                            title="View teaching assignments for this lecturer"
                          >
                            <BookOpen className="h-3.5 w-3.5 mr-1" /> Assignments
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-medium"
                            onClick={() => handleOpenAssignCourse(lec)}
                            title="Assign a course offering to this lecturer"
                          >
                            <PlusCircle className="h-3.5 w-3.5 mr-1" /> Assign Course
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => handleOpenDetails(lec)}
                            title="View full profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => handleOpenEdit(lec)}
                            title="Edit lecturer record"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {!isLoadingLecturers && lecturers.length > itemsPerPage && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * itemsPerPage, lecturers.length)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{lecturers.length}</span> faculty members
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="font-medium text-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Lecturer Assignments Modal */}
      {viewingAssignmentsLecturer && (
        <Dialog
          open={!!viewingAssignmentsLecturer}
          onOpenChange={() => setViewingAssignmentsLecturer(null)}
        >
          <DialogContent size="3xl" className="sm:max-w-3xl w-[92vw] max-w-3xl p-0 overflow-hidden">
            <DialogHeader className="px-8 pt-7 pb-3">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <BookCheck className="h-5 w-5" />
                  </div>
                  Lecturer Teaching Assignments
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Review and manage course offerings actively assigned to this faculty member.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-6 px-8 py-5 max-h-[80vh] overflow-y-auto">
              {/* Lecturer Info Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-muted/30 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-xl uppercase shadow-xs shrink-0">
                    {viewingAssignmentsLecturer.user_full_name?.[0] || 'L'}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">
                      Dr. {viewingAssignmentsLecturer.user_full_name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                      <Mail className="h-3.5 w-3.5 text-primary" /> {viewingAssignmentsLecturer.user_email}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-primary" />{' '}
                      {viewingAssignmentsLecturer.department_detail?.name || 'Unassigned Department'}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className="font-mono text-xs font-bold border-primary/40 text-primary bg-primary/5"
                  >
                    {viewingAssignmentsLecturer.faculty_identifier}
                  </Badge>
                  <Button
                    size="sm"
                    className="font-semibold text-xs h-8"
                    onClick={() => handleOpenAssignCourse(viewingAssignmentsLecturer)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Assign Course
                  </Button>
                </div>
              </div>

              {/* Teaching Assignments Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" /> Assigned Course Offerings
                    <Badge variant="outline" className="text-xs ml-1">
                      {getLecturerAssignments(viewingAssignmentsLecturer.id).length}
                    </Badge>
                  </h4>
                </div>

                {isLoadingTeachingAssignments ? (
                  <div className="space-y-3 py-4 animate-pulse">
                    <div className="h-20 bg-muted rounded-xl" />
                    <div className="h-20 bg-muted rounded-xl" />
                  </div>
                ) : getLecturerAssignments(viewingAssignmentsLecturer.id).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-3 bg-card">
                    <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground text-sm">
                        No teaching assignments found for this lecturer.
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        This faculty member is not currently assigned to teach any course offerings.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleOpenAssignCourse(viewingAssignmentsLecturer)}
                      className="text-xs font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Assign Course Offering
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getLecturerAssignments(viewingAssignmentsLecturer.id).map((assignment) => {
                      const display = getOfferingDisplay(
                        assignment.course_offering,
                        assignment.course_offering_detail
                      );
                      const isToggling = togglingAssignmentId === assignment.id;

                      return (
                        <div
                          key={assignment.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all shadow-xs"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                                {display.courseCode}
                              </span>
                              <h5 className="font-semibold text-foreground text-sm">
                                {display.courseTitle}
                              </h5>
                              {display.section && (
                                <Badge variant="outline" className="text-[10px] font-mono">
                                  Section {display.section}
                                </Badge>
                              )}
                              <Badge
                                variant={assignment.is_active ? 'success' : 'secondary'}
                                className="text-[10px]"
                              >
                                {assignment.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {display.semester} {display.semesterIndex && `• ${display.semesterIndex}`}
                              </span>
                              {typeof assignment.enrolled_students === 'number' && (
                                <span className="flex items-center gap-1 font-mono text-foreground font-medium">
                                  <Users className="h-3.5 w-3.5 text-primary" />
                                  {assignment.enrolled_students} Enrolled
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isToggling}
                              onClick={() => handleToggleStatus(assignment)}
                              className="h-8 text-xs"
                              title={assignment.is_active ? 'Deactivate assignment' : 'Activate assignment'}
                            >
                              {isToggling ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : assignment.is_active ? (
                                <XCircle className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                              )}
                              {assignment.is_active ? 'Deactivate' : 'Activate'}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs"
                              onClick={() =>
                                handleOpenRemove(
                                  assignment,
                                  viewingAssignmentsLecturer,
                                  display.courseCode,
                                  display.courseTitle
                                )
                              }
                              title="Remove assignment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </DialogBody>

            <DialogFooter className="px-8 py-4 border-t border-border bg-muted/20 flex justify-between">
              <Button
                variant="outline"
                onClick={() => handleOpenAssignCourse(viewingAssignmentsLecturer)}
                className="font-semibold text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Assign Another Course
              </Button>
              <Button
                onClick={() => setViewingAssignmentsLecturer(null)}
                className="font-semibold px-7"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Course to Lecturer Modal */}
      {assigningLecturer && (
        <Dialog
          open={!!assigningLecturer}
          onOpenChange={() => {
            if (!isSubmittingAssign) setAssigningLecturer(null);
          }}
        >
          <DialogContent size="lg" className="sm:max-w-xl w-[94vw] p-0 overflow-hidden">
            <form onSubmit={handleAssignSubmit}>
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <PlusCircle className="h-4 w-4" />
                  </div>
                  Assign Course to Lecturer
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Assign a course offering to a specific lecturer.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-4 px-6 py-4">
                {assignFormError && (
                  <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{assignFormError}</span>
                  </div>
                )}

                {/* 1. Lecturer Dropdown */}
                <LecturerDropdown
                  value={assignLecturerId}
                  onChange={(lecturerId) => {
                    setAssignLecturerId(lecturerId);
                    setAssignFormError(null);
                  }}
                  lecturers={lecturers}
                  teachingAssignments={teachingAssignments}
                  selectedOfferingId={assignCourseOfferingId}
                  isLoading={isLoadingLecturers}
                  disabled={isSubmittingAssign}
                />

                {/* 2. Course Offering Dropdown */}
                <CourseOfferingDropdown
                  value={assignCourseOfferingId}
                  onChange={(offeringId) => {
                    setAssignCourseOfferingId(offeringId);
                    setAssignFormError(null);
                  }}
                  offerings={courseOfferings}
                  courses={courses}
                  semesters={semesters}
                  academicYears={academicYears}
                  teachingAssignments={teachingAssignments}
                  selectedLecturerId={assignLecturerId}
                  isLoading={isLoadingCourseOfferings}
                  disabled={isSubmittingAssign}
                />

                {/* 3. Assignment Status */}
                <div className="pt-1">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Assignment Status
                  </div>
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-foreground bg-muted/20 border border-border p-3 rounded-xl">
                    <input
                      type="checkbox"
                      checked={assignIsActive}
                      onChange={(e) => setAssignIsActive(e.target.checked)}
                      className="mt-0.5 rounded border-input text-primary focus:ring-primary h-4 w-4"
                    />
                    <div>
                      <span className="font-semibold text-foreground block">Active</span>
                      <span className="text-[11px] text-muted-foreground block">
                        Active assignments are visible to the lecturer.
                      </span>
                    </div>
                  </label>
                </div>

                {/* 4. Assignment Summary */}
                <div className="border-t border-border pt-3">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Assignment Summary
                    </div>
                    {assignLecturerId && assignCourseOfferingId ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-background/80 rounded-lg p-3 border border-border">
                        <div>
                          {(() => {
                            const lec = lecturers.find((l) => l.id === assignLecturerId);
                            if (!lec) return null;
                            return (
                              <>
                                <p className="font-semibold text-foreground">
                                  Dr. {lec.user_full_name}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {lec.department_detail?.name || 'Academic Faculty'}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                        <div className="text-primary font-bold text-center sm:px-2">
                          <ArrowDown className="h-4 w-4 mx-auto sm:hidden" />
                          <span className="hidden sm:inline">↓</span>
                        </div>
                        <div className="sm:text-right">
                          {(() => {
                            const display = getOfferingDisplay(assignCourseOfferingId);
                            return (
                              <>
                                <p className="font-semibold text-foreground">
                                  {display.courseCode} — {display.courseTitle}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {display.section ? `Section ${display.section}` : 'Section A'} · {display.semester} {display.semesterIndex}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground bg-background/50 rounded-lg p-3 border border-border/60">
                        Select a lecturer and course offering to preview the assignment.
                      </p>
                    )}
                  </div>
                </div>
              </DialogBody>

              <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAssigningLecturer(null)}
                  disabled={isSubmittingAssign}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingAssign || !assignLecturerId || !assignCourseOfferingId}
                >
                  {isSubmittingAssign ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Assigning...
                    </>
                  ) : (
                    'Assign Course'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Remove Assignment Confirmation Dialog */}
      {removingAssignment && (
        <Dialog
          open={!!removingAssignment}
          onOpenChange={() => {
            if (!isRemovingAssignment) setRemovingAssignment(null);
          }}
        >
          <DialogContent size="md" className="sm:max-w-md p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-destructive">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive shrink-0">
                  <Trash2 className="h-4 w-4" />
                </div>
                Remove Teaching Assignment?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Are you sure you want to remove this course assignment from Dr.{' '}
                {removingAssignment.lecturer.user_full_name}?
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-3 px-6 py-4">
              <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 space-y-1 text-xs">
                <p className="font-semibold text-foreground text-sm">
                  {removingAssignment.courseCode} — {removingAssignment.courseTitle}
                </p>
                <p className="text-muted-foreground">
                  Faculty: Dr. {removingAssignment.lecturer.user_full_name} (
                  {removingAssignment.lecturer.faculty_identifier})
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                This action will immediately revoke the lecturer&apos;s access to enter assessments, marks,
                and grades for this course offering.
              </p>
            </DialogBody>

            <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRemovingAssignment(null)}
                disabled={isRemovingAssignment}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmRemove}
                disabled={isRemovingAssignment}
              >
                {isRemovingAssignment ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Removing...
                  </>
                ) : (
                  'Remove Assignment'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Lecturer Profile Detail Modal */}
      {viewingLecturerId && (
        <Dialog open={!!viewingLecturerId} onOpenChange={() => setViewingLecturerId(null)}>
          <DialogContent size="3xl" className="sm:max-w-3xl w-[92vw] max-w-3xl p-0 overflow-hidden">
            <DialogHeader className="px-8 pt-7 pb-3">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                Faculty Member Profile
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Full academic profile details retrieved from the Lecturer Management API.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-6 px-8 py-5 max-h-[80vh] overflow-y-auto">
              {isLoadingProfile ? (
                <div className="space-y-4 py-8 animate-pulse">
                  <div className="h-20 bg-muted rounded-2xl" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-muted rounded-xl" />
                    <div className="h-20 bg-muted rounded-xl" />
                  </div>
                </div>
              ) : profileError ? (
                <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Unable to load lecturer profile</p>
                    <p className="text-xs">{profileError}</p>
                  </div>
                </div>
              ) : viewingLecturerDetail ? (
                <>
                  {/* Top Profile Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-2xl border border-border bg-muted/30 p-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl uppercase shadow-xs shrink-0">
                      {viewingLecturerDetail.user_first_name?.[0] || 'L'}
                      {viewingLecturerDetail.user_last_name?.[0] || 'M'}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h3 className="text-xl font-bold text-foreground">
                        Dr. {viewingLecturerDetail.user_first_name} {viewingLecturerDetail.user_last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 font-mono">
                        <Mail className="h-4 w-4 text-primary" /> {viewingLecturerDetail.user_email}
                      </p>
                      <div className="pt-1 flex items-center gap-2.5">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs font-bold border-primary/40 text-primary bg-primary/5"
                        >
                          Faculty ID: {viewingLecturerDetail.faculty_identifier}
                        </Badge>
                        <Badge
                          variant={viewingLecturerDetail.user_is_active ? 'success' : 'secondary'}
                          className="capitalize text-xs"
                        >
                          {viewingLecturerDetail.user_is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Academic Affiliation Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1.5 shadow-xs">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-primary" /> Department
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {viewingLecturerDetail.department_detail?.name || 'Unassigned'}
                      </p>
                      {viewingLecturerDetail.department_detail?.code && (
                        <p className="text-xs font-mono text-muted-foreground">
                          Code: {viewingLecturerDetail.department_detail.code}
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1.5 shadow-xs">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <School className="h-4 w-4 text-primary" /> College / Faculty
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {viewingLecturerDetail.department_detail?.college_detail?.name || '—'}
                      </p>
                      {viewingLecturerDetail.department_detail?.college_detail?.code && (
                        <p className="text-xs font-mono text-muted-foreground">
                          Code: {viewingLecturerDetail.department_detail.college_detail.code}
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1.5 shadow-xs">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-primary" /> Member Since
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(viewingLecturerDetail.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1.5 shadow-xs">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary" /> Record Updated
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(viewingLecturerDetail.updated_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </DialogBody>

            <DialogFooter className="px-8 py-4 border-t border-border bg-muted/20 flex justify-end">
              <Button
                onClick={() => setViewingLecturerId(null)}
                className="font-semibold px-7"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Lecturer Modal */}
      {editingLecturer && (
        <Dialog open={!!editingLecturer} onOpenChange={() => setEditingLecturer(null)}>
          <DialogContent size="lg" className="sm:max-w-lg p-0 overflow-hidden">
            <form onSubmit={handleSaveEdit}>
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Edit2 className="h-4 w-4" />
                  </div>
                  Edit Lecturer Information
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update faculty identifier or department assignment for {editingLecturer.user_full_name}.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-4 px-6 py-4">
                {editFormError && (
                  <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{editFormError}</span>
                  </div>
                )}

                {/* Read-only User Summary */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
                  <p className="font-semibold text-foreground">{editingLecturer.user_full_name}</p>
                  <p className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" /> {editingLecturer.user_email}
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <Badge variant={editingLecturer.user_is_active ? 'success' : 'secondary'} className="text-[10px]">
                      {editingLecturer.user_is_active ? 'Active Account' : 'Inactive Account'}
                    </Badge>
                  </div>
                </div>

                {/* Faculty Identifier */}
                <div className="space-y-1.5">
                  <label htmlFor="faculty_identifier" className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-primary" /> Faculty Identifier *
                  </label>
                  <input
                    id="faculty_identifier"
                    type="text"
                    required
                    value={editForm.faculty_identifier}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, faculty_identifier: e.target.value }))
                    }
                    placeholder="e.g. FAC-1029"
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring text-foreground font-mono"
                  />
                  {editErrors.faculty_identifier && (
                    <p className="text-xs text-destructive font-medium">{editErrors.faculty_identifier}</p>
                  )}
                </div>

                {/* Department Dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor="department_id" className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-primary" /> Department
                  </label>
                  <select
                    id="department_id"
                    value={editForm.department_id}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, department_id: e.target.value }))
                    }
                    className={selectClass}
                  >
                    <option value="">-- No Department Assigned --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                  {editErrors.department_id && (
                    <p className="text-xs text-destructive font-medium">{editErrors.department_id}</p>
                  )}
                </div>
              </DialogBody>

              <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingLecturer(null)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
