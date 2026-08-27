'use client';

import {
  BookCheck,
  Plus,
  Trash2,
  Eye,
  AlertTriangle,
  RefreshCw,
  Layers,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Users,
  Power,
  Building2,
  Mail,
  Hash,
  ArrowDown,
} from 'lucide-react';
import * as React from 'react';

import { toast } from '@/components/feedback';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  SearchInput,
} from '@/components/ui';
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';

import { CourseOfferingDropdown, LecturerDropdown } from './assignment-form-dropdowns';
import { useAdminStore } from '../store';
import type {
  CreateTeachingAssignmentPayload,
  TeachingAssignment,
} from '../types';

export function TeachingAssignmentManagement() {
  const {
    teachingAssignments,
    isLoadingTeachingAssignments,
    teachingAssignmentsError,
    teachingAssignmentSearchQuery,
    teachingAssignmentStatusFilter,
    lecturers,
    isLoadingLecturers,
    courseOfferings,
    isLoadingCourseOfferings,
    semesters,
    academicYears,
    courses,
    fetchTeachingAssignments,
    fetchLecturers,
    fetchCourseOfferings,
    fetchSemesters,
    fetchAcademicYears,
    fetchCourses,
    addTeachingAssignment,
    updateTeachingAssignment,
    deleteTeachingAssignment,
    setTeachingAssignmentSearchQuery,
    setTeachingAssignmentStatusFilter,
  } = useAdminStore();

  // Modals & Dialogs state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedAssignmentForDetails, setSelectedAssignmentForDetails] = React.useState<TeachingAssignment | null>(null);
  const [revokingAssignment, setRevokingAssignment] = React.useState<TeachingAssignment | null>(null);
  const [statusTogglingAssignment, setStatusTogglingAssignment] = React.useState<TeachingAssignment | null>(null);

  // Loading states
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isRevoking, setIsRevoking] = React.useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState<{
    lecturer: string;
    course_offering: string;
    is_active: boolean;
  }>({
    lecturer: '',
    course_offering: '',
    is_active: true,
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  // Initial Data Fetch
  React.useEffect(() => {
    void fetchTeachingAssignments();
    void fetchLecturers();
    void fetchCourseOfferings();
    void fetchSemesters();
    void fetchAcademicYears();
    void fetchCourses();
  }, [
    fetchTeachingAssignments,
    fetchLecturers,
    fetchCourseOfferings,
    fetchSemesters,
    fetchAcademicYears,
    fetchCourses,
  ]);

  // Lecturer Lookup helper
  const getLecturerDisplay = React.useCallback(
    (lecturerId: string, lecturerDetail?: string) => {
      const found = lecturers.find((l) => l.id === lecturerId);
      if (found) {
        return {
          id: found.id,
          fullName: found.user_full_name || 'Lecturer',
          facultyIdentifier: found.faculty_identifier || lecturerDetail || 'N/A',
          departmentName: found.department_detail?.name || 'Department',
          email: found.user_email || '',
          isActive: found.user_is_active,
        };
      }
      return {
        id: lecturerId,
        fullName: 'Assigned Lecturer',
        facultyIdentifier: lecturerDetail || 'N/A',
        departmentName: 'Department',
        email: '',
        isActive: true,
      };
    },
    [lecturers]
  );

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

  // Stats calculation
  const stats = React.useMemo(() => {
    const total = teachingAssignments.length;
    const active = teachingAssignments.filter((a) => a.is_active).length;
    const inactive = total - active;
    const uniqueLecturers = new Set(teachingAssignments.map((a) => a.lecturer)).size;
    return { total, active, inactive, uniqueLecturers };
  }, [teachingAssignments]);

  // Filtered Teaching Assignments
  const filteredAssignments = React.useMemo(() => {
    return teachingAssignments.filter((assignment) => {
      const q = teachingAssignmentSearchQuery.toLowerCase().trim();
      const lecturerInfo = getLecturerDisplay(assignment.lecturer, assignment.lecturer_detail);
      const offeringInfo = getOfferingDisplay(assignment.course_offering, assignment.course_offering_detail);

      const matchesSearch =
        !q ||
        lecturerInfo.fullName.toLowerCase().includes(q) ||
        lecturerInfo.email.toLowerCase().includes(q) ||
        lecturerInfo.facultyIdentifier.toLowerCase().includes(q) ||
        lecturerInfo.departmentName.toLowerCase().includes(q) ||
        offeringInfo.courseCode.toLowerCase().includes(q) ||
        offeringInfo.courseTitle.toLowerCase().includes(q) ||
        offeringInfo.semester.toLowerCase().includes(q) ||
        offeringInfo.section.toLowerCase().includes(q);

      const matchesStatus =
        teachingAssignmentStatusFilter === 'ALL' ||
        (teachingAssignmentStatusFilter === 'ACTIVE' && assignment.is_active) ||
        (teachingAssignmentStatusFilter === 'INACTIVE' && !assignment.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [
    teachingAssignments,
    teachingAssignmentSearchQuery,
    teachingAssignmentStatusFilter,
    getLecturerDisplay,
    getOfferingDisplay,
  ]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormError(null);
    setFormData({
      lecturer: '',
      course_offering: '',
      is_active: true,
    });
    setIsAddModalOpen(true);
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    setFormError(null);

    if (!formData.course_offering) {
      errors.course_offering = 'Course offering is required.';
    }

    if (!formData.lecturer) {
      errors.lecturer = 'Lecturer is required.';
    }

    // Client-side quick duplicate check
    if (formData.lecturer && formData.course_offering) {
      const alreadyAssigned = teachingAssignments.some(
        (a) => a.lecturer === formData.lecturer && a.course_offering === formData.course_offering
      );
      if (alreadyAssigned) {
        errors.general = 'This lecturer is already assigned to this course offering.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add Teaching Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const payload: CreateTeachingAssignmentPayload = {
        lecturer: formData.lecturer,
        course_offering: formData.course_offering,
        is_active: formData.is_active,
      };

      await addTeachingAssignment(payload);
      toast.success('Teaching assignment created successfully.');
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      const parsedErrors = parseFieldErrors(err);
      if (Object.keys(parsedErrors).length > 0) {
        setFieldErrors(parsedErrors);
      }
      const msg = getUserFriendlyErrorMessage(err);
      if (msg.toLowerCase().includes('already assigned') || msg.toLowerCase().includes('already exists')) {
        setFormError('This teaching assignment already exists.');
      } else if (msg.toLowerCase().includes('permission') || msg.includes('403')) {
        setFormError('You do not have permission to manage teaching assignments.');
      } else {
        setFormError(msg || 'Unable to create teaching assignment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (assignment: TeachingAssignment) => {
    setStatusTogglingAssignment(assignment);
    setIsTogglingStatus(true);
    const newStatus = !assignment.is_active;

    try {
      await updateTeachingAssignment(assignment.id, { is_active: newStatus });
      toast.success(
        newStatus
          ? 'Teaching assignment activated.'
          : 'Teaching assignment deactivated.'
      );
    } catch (err: unknown) {
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsTogglingStatus(false);
      setStatusTogglingAssignment(null);
    }
  };

  // Revoke Assignment
  const handleRevokeAssignment = async () => {
    if (!revokingAssignment) return;

    setIsRevoking(true);
    try {
      await deleteTeachingAssignment(revokingAssignment.id);
      toast.success('Teaching assignment revoked successfully.');
      setRevokingAssignment(null);
    } catch (err: unknown) {
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <BookCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Teaching Assignments
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage which lecturers are assigned to course offerings.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchTeachingAssignments()}
            disabled={isLoadingTeachingAssignments}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingTeachingAssignments ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleOpenAddModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Assign Lecturer
          </Button>
        </div>
      </div>

      {/* ── Metrics Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 border border-border/60 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Assignments</p>
              <p className="text-xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.active}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Inactive</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {stats.inactive}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Assigned Lecturers</p>
              <p className="text-xl font-bold text-foreground">{stats.uniqueLecturers}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Search & Filter Controls ──────────────────────────────── */}
      <Card className="p-4 border border-border/60 bg-card/60 backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <SearchInput
              placeholder="Search by lecturer, course code, section..."
              value={teachingAssignmentSearchQuery}
              onChange={(e) => setTeachingAssignmentSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background p-1 text-xs">
              <span className="px-2 font-medium text-muted-foreground">Status:</span>
              <button
                type="button"
                onClick={() => setTeachingAssignmentStatusFilter('ALL')}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  teachingAssignmentStatusFilter === 'ALL'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTeachingAssignmentStatusFilter('ACTIVE')}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  teachingAssignmentStatusFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setTeachingAssignmentStatusFilter('INACTIVE')}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  teachingAssignmentStatusFilter === 'INACTIVE'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Error Banner ──────────────────────────────────────────── */}
      {teachingAssignmentsError && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{teachingAssignmentsError}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchTeachingAssignments()}
            className="border-destructive/30 hover:bg-destructive/20 text-destructive"
          >
            Retry
          </Button>
        </div>
      )}

      {/* ── Main Data Table ───────────────────────────────────────── */}
      <Card className="overflow-hidden border border-border/60 bg-card">
        {isLoadingTeachingAssignments ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 animate-pulse">
                <div className="h-10 w-1/4 bg-muted rounded" />
                <div className="h-10 w-1/3 bg-muted rounded" />
                <div className="h-10 w-1/6 bg-muted rounded" />
                <div className="h-10 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4 text-muted-foreground">
              <BookCheck className="h-8 w-8" />
            </div>
            {teachingAssignments.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold text-foreground">No Teaching Assignments</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                  There are currently no lecturer-to-course assignments in the system.
                </p>
                <Button onClick={handleOpenAddModal} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Assign Lecturer
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-foreground">No matching assignments</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                  No teaching assignments match your current search or filter criteria.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTeachingAssignmentSearchQuery('');
                    setTeachingAssignmentStatusFilter('ALL');
                  }}
                >
                  Clear Filters
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Lecturer</th>
                  <th className="px-6 py-3.5">Course Offering</th>
                  <th className="px-6 py-3.5">Academic Term</th>
                  <th className="px-6 py-3.5 text-center">Enrolled</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAssignments.map((assignment) => {
                  const lecturerInfo = getLecturerDisplay(assignment.lecturer, assignment.lecturer_detail);
                  const offeringInfo = getOfferingDisplay(assignment.course_offering, assignment.course_offering_detail);
                  const isTogglingThis =
                    isTogglingStatus && statusTogglingAssignment?.id === assignment.id;

                  return (
                    <tr
                      key={assignment.id}
                      className="transition-colors hover:bg-muted/30 group"
                    >
                      {/* Lecturer Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs border border-primary/20">
                            {lecturerInfo.fullName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {lecturerInfo.fullName}
                              {!lecturerInfo.isActive && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  Inactive Account
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono bg-muted/60 px-1 rounded text-[11px]">
                                {lecturerInfo.facultyIdentifier}
                              </span>
                              {lecturerInfo.departmentName && (
                                <span>• {lecturerInfo.departmentName}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Course Offering Column */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            <span className="font-mono font-semibold text-primary">
                              {offeringInfo.courseCode}
                            </span>
                            <span>{offeringInfo.courseTitle}</span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            {offeringInfo.section && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background">
                                Section {offeringInfo.section}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Academic Term Column */}
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <p className="font-medium text-foreground">{offeringInfo.semester}</p>
                          <p className="text-muted-foreground">{offeringInfo.semesterIndex} Semester</p>
                        </div>
                      </td>

                      {/* Enrolled Students Column */}
                      <td className="px-6 py-4 text-center">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs px-2 py-0.5 bg-muted/30"
                        >
                          <Users className="h-3 w-3 mr-1 text-muted-foreground inline" />
                          {assignment.enrolled_students}
                        </Badge>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 text-center">
                        <Badge
                          className={`text-xs px-2.5 py-0.5 font-medium ${
                            assignment.is_active
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {assignment.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAssignmentForDetails(assignment)}
                            title="View Details"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Toggle Active / Deactivate */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleToggleStatus(assignment)}
                            disabled={isTogglingThis}
                            title={assignment.is_active ? 'Deactivate Assignment' : 'Activate Assignment'}
                            className={`h-8 w-8 p-0 ${
                              assignment.is_active
                                ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-500/10'
                                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10'
                            }`}
                          >
                            {isTogglingThis ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Revoke Assignment */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRevokingAssignment(assignment)}
                            title="Revoke Assignment"
                            className="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Modal: Assign Lecturer Dialog ─────────────────────────── */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookCheck className="h-5 w-5 text-primary" />
              Assign Lecturer to Course Offering
            </DialogTitle>
            <DialogDescription>
              Assign a lecturer to a specific course offering.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAssignment} className="space-y-4 py-2">
            {formError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* 1. Course Offering Dropdown */}
            <CourseOfferingDropdown
              value={formData.course_offering}
              onChange={(offeringId) => {
                setFormData((prev) => ({ ...prev, course_offering: offeringId }));
                setFormError(null);
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.course_offering;
                  return next;
                });
              }}
              offerings={courseOfferings}
              courses={courses}
              semesters={semesters}
              academicYears={academicYears}
              teachingAssignments={teachingAssignments}
              selectedLecturerId={formData.lecturer}
              error={fieldErrors.course_offering}
              isLoading={isLoadingCourseOfferings}
              disabled={isSubmitting}
            />

            {/* 2. Lecturer Dropdown */}
            <LecturerDropdown
              value={formData.lecturer}
              onChange={(lecturerId) => {
                setFormData((prev) => ({ ...prev, lecturer: lecturerId }));
                setFormError(null);
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.lecturer;
                  return next;
                });
              }}
              lecturers={lecturers}
              teachingAssignments={teachingAssignments}
              selectedOfferingId={formData.course_offering}
              error={fieldErrors.lecturer}
              isLoading={isLoadingLecturers}
              disabled={isSubmitting}
            />

            {/* 3. Assignment Status */}
            <div className="pt-1">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Assignment Status
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-foreground bg-muted/20 border border-border p-3 rounded-xl">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
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
                {formData.course_offering && formData.lecturer ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-background/80 rounded-lg p-3 border border-border">
                    <div>
                      {(() => {
                        const display = getOfferingDisplay(formData.course_offering);
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
                    <div className="text-primary font-bold text-center sm:px-2">
                      <ArrowDown className="h-4 w-4 mx-auto sm:hidden" />
                      <span className="hidden sm:inline">↓</span>
                    </div>
                    <div className="sm:text-right">
                      {(() => {
                        const lec = lecturers.find((l) => l.id === formData.lecturer);
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
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground bg-background/50 rounded-lg p-3 border border-border/60">
                    Select a course offering and lecturer to preview the assignment.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.lecturer || !formData.course_offering}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Assigning...
                  </div>
                ) : (
                  'Assign Lecturer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Assignment Details Dialog ──────────────────────── */}
      <Dialog
        open={Boolean(selectedAssignmentForDetails)}
        onOpenChange={(open) => !open && setSelectedAssignmentForDetails(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookCheck className="h-5 w-5 text-primary" />
              Teaching Assignment Details
            </DialogTitle>
            <DialogDescription>
              Full details and relationship metadata for this teaching assignment.
            </DialogDescription>
          </DialogHeader>

          {selectedAssignmentForDetails && (
            <div className="space-y-4 py-2 text-sm">
              {/* Lecturer Details */}
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Lecturer Information
                </p>
                {(() => {
                  const lInfo = getLecturerDisplay(
                    selectedAssignmentForDetails.lecturer,
                    selectedAssignmentForDetails.lecturer_detail
                  );
                  return (
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground text-base">{lInfo.fullName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Hash className="h-3 w-3" /> Faculty ID: <span className="font-mono text-foreground">{lInfo.facultyIdentifier}</span>
                      </p>
                      {lInfo.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" /> {lInfo.email}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-3 w-3" /> {lInfo.departmentName}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Course Offering Details */}
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Course Offering
                </p>
                {(() => {
                  const oInfo = getOfferingDisplay(
                    selectedAssignmentForDetails.course_offering,
                    selectedAssignmentForDetails.course_offering_detail
                  );
                  return (
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground text-base">
                        <span className="font-mono text-primary mr-2">{oInfo.courseCode}</span>
                        {oInfo.courseTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Academic Year: <span className="text-foreground font-medium">{oInfo.semester}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Semester: <span className="text-foreground font-medium">{oInfo.semesterIndex}</span>
                        {oInfo.section && ` • Section ${oInfo.section}`}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Status & Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    className={`mt-1 text-xs font-medium ${
                      selectedAssignmentForDetails.is_active
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {selectedAssignmentForDetails.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Enrolled Students</p>
                  <p className="text-base font-bold text-foreground mt-1">
                    {selectedAssignmentForDetails.enrolled_students} students
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border">
                <p>Assignment UUID: <span className="font-mono">{selectedAssignmentForDetails.id}</span></p>
                {selectedAssignmentForDetails.created_at && (
                  <p>Created: {new Date(selectedAssignmentForDetails.created_at).toLocaleString()}</p>
                )}
                {selectedAssignmentForDetails.updated_at && (
                  <p>Last Updated: {new Date(selectedAssignmentForDetails.updated_at).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAssignmentForDetails(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Revoke Confirmation Dialog ─────────────────────── */}
      <Dialog
        open={Boolean(revokingAssignment)}
        onOpenChange={(open) => !open && setRevokingAssignment(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Revoke Teaching Assignment?
            </DialogTitle>
            <DialogDescription>
              This will permanently remove this lecturer&apos;s assignment to the selected course offering. The lecturer will immediately lose access to enter assessment marks or manage exams for this course.
            </DialogDescription>
          </DialogHeader>

          {revokingAssignment && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs space-y-1 my-2">
              <p className="font-semibold text-foreground">
                Lecturer:{' '}
                <span className="font-normal text-muted-foreground">
                  {getLecturerDisplay(revokingAssignment.lecturer, revokingAssignment.lecturer_detail).fullName}
                </span>
              </p>
              <p className="font-semibold text-foreground">
                Course:{' '}
                <span className="font-normal text-muted-foreground">
                  {getOfferingDisplay(revokingAssignment.course_offering, revokingAssignment.course_offering_detail).courseCode} -{' '}
                  {getOfferingDisplay(revokingAssignment.course_offering, revokingAssignment.course_offering_detail).courseTitle}
                </span>
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRevokingAssignment(null)}
              disabled={isRevoking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleRevokeAssignment()}
              disabled={isRevoking}
            >
              {isRevoking ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Revoking...
                </div>
              ) : (
                'Revoke Assignment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
