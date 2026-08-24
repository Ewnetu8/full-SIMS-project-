'use client';

import {
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  Upload,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  FileSpreadsheet,
  Layers,
  GraduationCap,
  RefreshCw,
  FileText,
  Building2,
  Search,
} from 'lucide-react';
import * as React from 'react';

import { ConfirmationDialog, toast } from '@/components/feedback';
import { Label } from '@/components/forms';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  SearchInput,
} from '@/components/ui';
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';

import { useAdminStore } from '../store';

import type { AdminEnrollment, EnrollmentStatus } from '../types';

export function EnrollmentManagement() {
  const {
    enrollments,
    courseOfferings,
    courses,
    semesters,
    students,
    isLoadingEnrollments,
    enrollmentsError,
    isLoadingCourseOfferings,
    courseOfferingsError,
    isLoadingStudents,
    studentsError,
    enrollmentSearchQuery,
    enrollmentStatusFilter,
    enrollmentSemesterFilter,
    enrollmentCourseFilter,
    fetchEnrollments,
    fetchCourseOfferings,
    fetchCourses,
    fetchSemesters,
    fetchStudents,
    addEnrollment,
    updateEnrollment,
    deleteEnrollment,
    batchImportEnrollments,
    setEnrollmentSearchQuery,
    setEnrollmentStatusFilter,
    setEnrollmentSemesterFilter,
    setEnrollmentCourseFilter,
  } = useAdminStore();

  React.useEffect(() => {
    void fetchEnrollments();
    void fetchCourseOfferings();
    void fetchCourses();
    void fetchSemesters();
    void fetchStudents();
  }, [fetchEnrollments, fetchCourseOfferings, fetchCourses, fetchSemesters, fetchStudents]);

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = React.useState<AdminEnrollment | null>(null);
  const [editingEnrollment, setEditingEnrollment] = React.useState<AdminEnrollment | null>(null);
  const [deletingEnrollment, setDeletingEnrollment] = React.useState<AdminEnrollment | null>(null);
  const [isBatchImportOpen, setIsBatchImportOpen] = React.useState(false);

  // Form States
  const [createFormData, setCreateFormData] = React.useState({
    student: '',
    course_offering: '',
    status: 'ENROLLED' as EnrollmentStatus,
    grade: '',
  });
  const [editFormData, setEditFormData] = React.useState({
    status: 'ENROLLED' as EnrollmentStatus,
    grade: '',
  });
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // CSV Import State
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importValidationError, setImportValidationError] = React.useState<string | null>(null);
  const [importResult, setImportResult] = React.useState<{ taskId?: string; message: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Student Resolver Map
  const getStudentDisplay = React.useCallback(
    (studentId: string) => {
      const st = students.find((s) => s.id === studentId);
      if (st) {
        return {
          identifier: st.student_identifier,
          fullName: st.user_full_name || st.user_email || 'Student',
          classStanding: st.class_standing,
          department: st.department_detail?.name || 'Department',
          email: st.user_email,
        };
      }
      return {
        identifier: studentId,
        fullName: 'Student',
        classStanding: undefined,
        department: undefined,
        email: undefined,
      };
    },
    [students]
  );

  // Stats Calculations from real backend data
  const stats = React.useMemo(() => {
    const total = enrollments.length;
    const active = enrollments.filter((e) => e.status === 'ENROLLED').length;
    const passed = enrollments.filter((e) => e.status === 'PASSED').length;
    const failed = enrollments.filter((e) => e.status === 'FAILED').length;
    const dropped = enrollments.filter((e) => e.status === 'DROPPED').length;
    return { total, active, passed, failed, dropped };
  }, [enrollments]);

  // Filtered List
  const filteredEnrollments = React.useMemo(() => {
    return enrollments.filter((e) => {
      const q = enrollmentSearchQuery.toLowerCase().trim();
      const studentId = String(e.student || '').toLowerCase();
      const studentInfo = getStudentDisplay(e.student);
      const studentIdent = studentInfo.identifier.toLowerCase();
      const studentName = studentInfo.fullName.toLowerCase();

      const courseCode = String(
        e.course_offering_detail?.course_detail?.course_code ||
        e.course_offering_detail?.course_detail?.code ||
        ''
      ).toLowerCase();
      const courseName = String(
        e.course_offering_detail?.course_detail?.title ||
        e.course_offering_detail?.course_detail?.name ||
        ''
      ).toLowerCase();
      const semesterLabel = String(
        e.course_offering_detail?.semester_detail?.academic_year_detail?.display_label ||
        e.course_offering_detail?.semester_detail?.academicYearDetail?.displayLabel ||
        ''
      ).toLowerCase();
      const section = String(e.course_offering_detail?.section || '').toLowerCase();

      const matchesSearch =
        !q ||
        studentId.includes(q) ||
        studentIdent.includes(q) ||
        studentName.includes(q) ||
        courseCode.includes(q) ||
        courseName.includes(q) ||
        semesterLabel.includes(q) ||
        section.includes(q);

      const matchesStatus =
        enrollmentStatusFilter === 'ALL' || e.status === enrollmentStatusFilter;

      const semId =
        e.course_offering_detail?.semester ||
        e.course_offering_detail?.semester_detail?.id;
      const matchesSemester =
        enrollmentSemesterFilter === 'ALL' || semId === enrollmentSemesterFilter;

      const crsId =
        e.course_offering_detail?.course ||
        e.course_offering_detail?.course_detail?.id;
      const matchesCourse =
        enrollmentCourseFilter === 'ALL' || crsId === enrollmentCourseFilter;

      return matchesSearch && matchesStatus && matchesSemester && matchesCourse;
    });
  }, [
    enrollments,
    enrollmentSearchQuery,
    enrollmentStatusFilter,
    enrollmentSemesterFilter,
    enrollmentCourseFilter,
    getStudentDisplay,
  ]);

  // Paginated List
  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage) || 1;
  const paginatedEnrollments = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEnrollments.slice(start, start + itemsPerPage);
  }, [filteredEnrollments, currentPage, itemsPerPage]);

  const getStatusBadge = (status: EnrollmentStatus) => {
    switch (status) {
      case 'ENROLLED':
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
            <Clock className="mr-1 h-3 w-3" /> Enrolled
          </Badge>
        );
      case 'PASSED':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Passed
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
            <XCircle className="mr-1 h-3 w-3" /> Failed
          </Badge>
        );
      case 'DROPPED':
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs">
            <AlertCircle className="mr-1 h-3 w-3" /> Dropped
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleOpenCreate = () => {
    setCreateFormData({
      student: '',
      course_offering: '',
      status: 'ENROLLED',
      grade: '',
    });
    setFieldErrors({});
    setGeneralError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!createFormData.student.trim()) {
      errors.student = 'Please select a student.';
    }
    if (!createFormData.course_offering.trim()) {
      errors.course_offering = 'Please select a course offering.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await addEnrollment({
        student: createFormData.student.trim(),
        course_offering: createFormData.course_offering.trim(),
        status: createFormData.status,
        grade: createFormData.grade ? createFormData.grade.trim() : null,
      });

      toast.success('Student enrolled successfully.');
      setIsCreateOpen(false);
    } catch (err: unknown) {
      const fieldErrs = parseFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs);
      }
      const msg = getUserFriendlyErrorMessage(err);
      setGeneralError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (enrollment: AdminEnrollment) => {
    setEditingEnrollment(enrollment);
    setEditFormData({
      status: enrollment.status,
      grade: enrollment.grade || '',
    });
    setFieldErrors({});
    setGeneralError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnrollment) return;

    setIsSubmitting(true);
    setGeneralError(null);
    setFieldErrors({});

    try {
      await updateEnrollment(editingEnrollment.id, {
        status: editFormData.status,
        grade: editFormData.grade ? editFormData.grade.trim() : null,
      });

      toast.success('Enrollment status updated successfully.');
      setEditingEnrollment(null);
    } catch (err: unknown) {
      const fieldErrs = parseFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs);
      }
      const msg = getUserFriendlyErrorMessage(err);
      setGeneralError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEnrollment) return;
    try {
      await deleteEnrollment(deletingEnrollment.id);
      toast.success('Enrollment record removed successfully.');
      setDeletingEnrollment(null);
    } catch (err: unknown) {
      toast.error(getUserFriendlyErrorMessage(err));
    }
  };

  const handleBatchImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportValidationError(null);
    setImportResult(null);

    if (!importFile) {
      setImportValidationError('Please select a CSV file to upload.');
      return;
    }

    if (!importFile.name.endsWith('.csv')) {
      setImportValidationError('Only CSV files are supported (.csv).');
      return;
    }

    setIsImporting(true);
    try {
      const res = await batchImportEnrollments(importFile);
      setImportResult({
        taskId: res.task_id,
        message:
          res.detail ||
          res.message ||
          'Batch enrollment import task dispatched successfully. Processing in background.',
      });
      toast.success('Batch enrollment file uploaded successfully.');
      setImportFile(null);
    } catch (err: unknown) {
      const msg = getUserFriendlyErrorMessage(err);
      setImportValidationError(msg);
      toast.error(msg);
    } finally {
      setIsImporting(false);
    }
  };

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Course Enrollment Management
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
              Institutional Admin
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage student course enrollments, grade outcomes, credit limits, and batch CSV imports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void fetchEnrollments();
              void fetchCourseOfferings();
              void fetchStudents();
            }}
            disabled={isLoadingEnrollments}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingEnrollments ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => {
              setImportFile(null);
              setImportValidationError(null);
              setImportResult(null);
              setIsBatchImportOpen(true);
            }}
          >
            Batch CSV Import
          </Button>
          <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={handleOpenCreate}>
            Create Enrollment
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid (5 Cards) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Enrollments</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">All registered records</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active (Enrolled)</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600">{stats.active}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">In-progress sessions</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Passed</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.passed}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Satisfied course credit</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Failed</span>
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-destructive">{stats.failed}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Retake eligible</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Dropped</span>
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-muted-foreground">{stats.dropped}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Withdrawn from offering</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border-border space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <SearchInput
              placeholder="Search student, course code, section..."
              value={enrollmentSearchQuery}
              onChange={(e) => {
                setEnrollmentSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full"
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={enrollmentStatusFilter}
              onChange={(e) => {
                setEnrollmentStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ENROLLED">Enrolled (Active)</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
              <option value="DROPPED">Dropped</option>
            </select>
          </div>

          <div>
            <select
              className={selectClass}
              value={enrollmentSemesterFilter}
              onChange={(e) => {
                setEnrollmentSemesterFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Semesters</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.academicYearDetail?.displayLabel || 'Academic Year'} - {s.semesterIndex} Sem
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className={selectClass}
              value={enrollmentCourseFilter}
              onChange={(e) => {
                setEnrollmentCourseFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Enrollment Table */}
      <Card className="overflow-hidden border-border">
        {isLoadingEnrollments ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <Clock className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
            Loading enrollment records...
          </div>
        ) : enrollmentsError ? (
          <div className="p-8 text-center text-sm text-destructive">
            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <p className="font-semibold">Error loading enrollments</p>
            <p className="text-xs text-muted-foreground mt-1">{enrollmentsError}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => void fetchEnrollments()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Course / Offering</th>
                  <th className="px-4 py-3.5">Academic Period</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Grade</th>
                  <th className="px-4 py-3.5">Date Enrolled</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                      <p className="font-medium text-foreground">No enrollment records found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {enrollmentSearchQuery || enrollmentStatusFilter !== 'ALL' || enrollmentSemesterFilter !== 'ALL' || enrollmentCourseFilter !== 'ALL'
                          ? 'No enrollments match your search and filter criteria.'
                          : 'No student enrollments exist yet. Click "Create Enrollment" to add one.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedEnrollments.map((enrollment) => {
                    const offering = enrollment.course_offering_detail;
                    const course = offering?.course_detail;
                    const sem = offering?.semester_detail;
                    const studentInfo = getStudentDisplay(enrollment.student);

                    return (
                      <tr key={enrollment.id} className="hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                              <GraduationCap className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-xs truncate">
                                {studentInfo.identifier}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {studentInfo.fullName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="font-semibold text-foreground text-xs">
                              {(course?.course_code || course?.code) ? `${course?.course_code || course?.code}: ` : ''}
                              {course?.title || course?.name || 'Course Offering'}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <span>Sec {offering?.section || 'A'}</span>
                              {offering?.capacity !== undefined && <span>• Cap: {offering.capacity}</span>}
                              {(course?.credit_hours ?? course?.creditHours) !== undefined && (
                                <span>• {course?.credit_hours ?? course?.creditHours} cr</span>
                              )}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {sem?.academic_year_detail?.display_label || sem?.academicYearDetail?.displayLabel || 'Academic Year'}
                            </span>
                            <span>
                              {sem?.semester_index || sem?.semesterIndex ? `${sem?.semester_index || sem?.semesterIndex} Semester` : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {getStatusBadge(enrollment.status)}
                        </td>
                        <td className="px-4 py-3.5">
                          {enrollment.is_retake ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
                              Retake
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Regular</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs font-bold">
                          {enrollment.grade ? (
                            <Badge variant="outline" className="bg-foreground/5 font-mono">
                              {enrollment.grade}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {enrollment.created_at
                            ? new Date(enrollment.created_at).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => setSelectedEnrollment(enrollment)}
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleOpenEdit(enrollment)}
                              title="Edit Status / Grade"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => setDeletingEnrollment(enrollment)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete / Drop Enrollment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
        )}

        {/* Pagination Bar */}
        {filteredEnrollments.length > itemsPerPage && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredEnrollments.length)} of{' '}
              {filteredEnrollments.length} enrollments
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── CREATE ENROLLMENT DIALOG ────────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Create Student Enrollment
            </DialogTitle>
            <DialogDescription>
              Enroll a student in a course offering. The backend automatically validates duplicate, prerequisite, class standing, and credit hour rules.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit}>
            <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
              {generalError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Student Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="studentSelect" required>
                    Student
                  </Label>
                  {students.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      {students.length} available
                    </span>
                  )}
                </div>

                {isLoadingStudents ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4 animate-spin text-primary shrink-0" />
                    <span>Loading students directory...</span>
                  </div>
                ) : studentsError ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                    <span className="truncate">Unable to load students directory.</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs shrink-0"
                      onClick={() => void fetchStudents()}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Retry
                    </Button>
                  </div>
                ) : students.length === 0 ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-2.5 text-xs text-muted-foreground">
                    <span>No students found in directory.</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs shrink-0"
                      onClick={() => void fetchStudents()}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                    </Button>
                  </div>
                ) : (
                  <select
                    id="studentSelect"
                    className={`${selectClass} ${fieldErrors.student ? 'border-destructive' : ''}`}
                    value={createFormData.student}
                    onChange={(e) => {
                      setCreateFormData({ ...createFormData, student: e.target.value });
                      if (fieldErrors.student) {
                        setFieldErrors((prev) => ({ ...prev, student: '' }));
                      }
                    }}
                  >
                    <option value="">Select a Registered Student</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.student_identifier} — {st.user_full_name || st.user_email} ({st.class_standing})
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.student && (
                  <p className="text-xs text-destructive">{fieldErrors.student}</p>
                )}
              </div>

              {/* Course Offering Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="courseOfferingSelect" required>
                    Course Offering
                  </Label>
                  {courseOfferings.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      {courseOfferings.length} available
                    </span>
                  )}
                </div>

                {isLoadingCourseOfferings ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4 animate-spin text-primary shrink-0" />
                    <span>Loading course offerings...</span>
                  </div>
                ) : courseOfferingsError ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span className="truncate">Unable to load course offerings. Please try again.</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs shrink-0"
                      onClick={() => void fetchCourseOfferings()}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Retry
                    </Button>
                  </div>
                ) : courseOfferings.length === 0 ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-2.5 text-xs text-muted-foreground">
                    <span>No course offerings are currently available.</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs shrink-0"
                      onClick={() => void fetchCourseOfferings()}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                    </Button>
                  </div>
                ) : (
                  <select
                    id="courseOfferingSelect"
                    className={`${selectClass} ${fieldErrors.course_offering ? 'border-destructive' : ''}`}
                    value={createFormData.course_offering}
                    onChange={(e) => {
                      setCreateFormData({ ...createFormData, course_offering: e.target.value });
                      if (fieldErrors.course_offering) {
                        setFieldErrors((prev) => ({ ...prev, course_offering: '' }));
                      }
                    }}
                  >
                    <option value="">Select a Course Offering</option>
                    {courseOfferings.map((offering) => {
                      const cCode = offering.course_detail?.course_code || offering.course_detail?.code;
                      const cTitle = offering.course_detail?.title || offering.course_detail?.name;
                      const section = offering.section ? `Section ${offering.section}` : '';
                      const academicYear =
                        offering.semester_detail?.academic_year_detail?.display_label ||
                        offering.semester_detail?.academicYearDetail?.displayLabel;
                      const semesterIndex =
                        offering.semester_detail?.semester_index ||
                        offering.semester_detail?.semesterIndex;
                      const semText = [academicYear, semesterIndex ? `${semesterIndex} Sem` : ''].filter(Boolean).join(' ');

                      const parts = [
                        cCode,
                        cTitle,
                        section,
                        semText,
                      ].filter(Boolean);

                      const label = parts.length > 0 ? parts.join(' — ') : `Course Offering (${offering.id})`;

                      return (
                        <option key={offering.id} value={offering.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                )}
                {fieldErrors.course_offering && (
                  <p className="text-xs text-destructive">{fieldErrors.course_offering}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label htmlFor="statusSelect">Enrollment Status</Label>
                <select
                  id="statusSelect"
                  className={selectClass}
                  value={createFormData.status}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      status: e.target.value as EnrollmentStatus,
                    })
                  }
                >
                  <option value="ENROLLED">ENROLLED (Active)</option>
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="DROPPED">DROPPED</option>
                </select>
              </div>

              {/* Grade (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="gradeInput">Grade (Optional)</Label>
                <Input
                  id="gradeInput"
                  placeholder="e.g. A, A-, B+, etc."
                  value={createFormData.grade}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, grade: e.target.value })
                  }
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Enroll Student'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── VIEW ENROLLMENT DETAILS DIALOG ─────────────────────────────────── */}
      {selectedEnrollment && (
        <Dialog open={!!selectedEnrollment} onOpenChange={() => setSelectedEnrollment(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" /> Enrollment Details
              </DialogTitle>
            </DialogHeader>

            <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
              {(() => {
                const stInfo = getStudentDisplay(selectedEnrollment.student);
                return (
                  <div className="border-b border-border pb-3">
                    <p className="text-xs text-muted-foreground">Student Identifier & Details</p>
                    <p className="text-base font-bold text-foreground mt-0.5">
                      {stInfo.identifier} — {stInfo.fullName}
                    </p>
                    {stInfo.department && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-primary" /> {stInfo.department}{' '}
                        {stInfo.classStanding ? `(${stInfo.classStanding})` : ''}
                      </p>
                    )}
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">
                      UUID: {selectedEnrollment.student}
                    </p>
                  </div>
                );
              })()}

              <div className="space-y-2.5 text-xs text-foreground">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary" /> Course:
                  </span>
                  <span className="font-medium text-right">
                    {selectedEnrollment.course_offering_detail?.course_detail?.course_code ||
                      selectedEnrollment.course_offering_detail?.course_detail?.code ||
                      '—'}{' '}
                    -{' '}
                    {selectedEnrollment.course_offering_detail?.course_detail?.title ||
                      selectedEnrollment.course_offering_detail?.course_detail?.name ||
                      '—'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" /> Section & Capacity:
                  </span>
                  <span className="font-medium">
                    Section {selectedEnrollment.course_offering_detail?.section || 'A'}{' '}
                    {selectedEnrollment.course_offering_detail?.capacity !== undefined
                      ? `(Cap: ${selectedEnrollment.course_offering_detail.capacity})`
                      : ''}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> Academic Period:
                  </span>
                  <span className="font-medium">
                    {selectedEnrollment.course_offering_detail?.semester_detail?.academic_year_detail?.display_label ||
                      selectedEnrollment.course_offering_detail?.semester_detail?.academicYearDetail?.displayLabel ||
                      '—'}{' '}
                    •{' '}
                    {selectedEnrollment.course_offering_detail?.semester_detail?.semester_index ||
                      selectedEnrollment.course_offering_detail?.semester_detail?.semesterIndex ||
                      '—'}{' '}
                    Semester
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    Credit Hours:
                  </span>
                  <span className="font-medium">
                    {selectedEnrollment.course_offering_detail?.course_detail?.credit_hours ??
                      selectedEnrollment.course_offering_detail?.course_detail?.creditHours ??
                      '—'}{' '}
                    hrs
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    Status:
                  </span>
                  <div>{getStatusBadge(selectedEnrollment.status)}</div>
                </div>

                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    Retake Status:
                  </span>
                  <span className="font-medium">
                    {selectedEnrollment.is_retake ? 'Yes (Retake Course)' : 'No (First Attempt)'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    Grade:
                  </span>
                  <span className="font-mono font-bold">
                    {selectedEnrollment.grade || '—'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Enrolled At:</span>
                  <span>
                    {selectedEnrollment.created_at
                      ? new Date(selectedEnrollment.created_at).toLocaleString()
                      : '—'}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>
                    {selectedEnrollment.updated_at
                      ? new Date(selectedEnrollment.updated_at).toLocaleString()
                      : '—'}
                  </span>
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedEnrollment(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── EDIT ENROLLMENT STATUS / GRADE DIALOG ───────────────────────────── */}
      {editingEnrollment && (
        <Dialog open={!!editingEnrollment} onOpenChange={() => setEditingEnrollment(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary" /> Update Enrollment Status
              </DialogTitle>
              <DialogDescription>
                Modify academic completion status and recorded grade letter for this enrollment.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditSubmit}>
              <DialogBody className="space-y-4 py-3">
                {generalError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{generalError}</span>
                  </div>
                )}

                {(() => {
                  const st = getStudentDisplay(editingEnrollment.student);
                  return (
                    <div className="p-3 bg-muted/40 border border-border rounded-lg text-xs space-y-1">
                      <p className="font-semibold text-foreground">
                        {st.identifier} — {st.fullName}
                      </p>
                      <p className="text-muted-foreground">
                        {editingEnrollment.course_offering_detail?.course_detail?.title ||
                          editingEnrollment.course_offering_detail?.course_detail?.name ||
                          'Course Offering'}{' '}
                        (Section {editingEnrollment.course_offering_detail?.section || 'A'})
                      </p>
                    </div>
                  );
                })()}

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <Label htmlFor="editStatusSelect" required>
                    Enrollment Status
                  </Label>
                  <select
                    id="editStatusSelect"
                    className={selectClass}
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status: e.target.value as EnrollmentStatus,
                      })
                    }
                  >
                    <option value="ENROLLED">ENROLLED (Active)</option>
                    <option value="PASSED">PASSED</option>
                    <option value="FAILED">FAILED</option>
                    <option value="DROPPED">DROPPED</option>
                  </select>
                </div>

                {/* Grade Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="editGradeInput">Recorded Grade Letter</Label>
                  <Input
                    id="editGradeInput"
                    placeholder="e.g. A, A-, B+, B, C, F, etc."
                    value={editFormData.grade}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, grade: e.target.value })
                    }
                    className={fieldErrors.grade ? 'border-destructive' : ''}
                  />
                  {fieldErrors.grade && (
                    <p className="text-xs text-destructive">{fieldErrors.grade}</p>
                  )}
                </div>
              </DialogBody>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditingEnrollment(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── DELETE ENROLLMENT CONFIRMATION ──────────────────────────────────── */}
      <ConfirmationDialog
        open={!!deletingEnrollment}
        onOpenChange={(open) => {
          if (!open) setDeletingEnrollment(null);
        }}
        title="Drop / Delete Enrollment"
        description={
          deletingEnrollment
            ? `Are you sure you want to drop enrollment record for ${
                getStudentDisplay(deletingEnrollment.student).identifier
              }? This action removes the student from this course offering session.`
            : ''
        }
        confirmLabel="Yes, Drop Enrollment"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeletingEnrollment(null)}
      />

      {/* ── BATCH CSV IMPORT DIALOG (FR-004) ────────────────────────────────── */}
      <Dialog open={isBatchImportOpen} onOpenChange={setIsBatchImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Batch Import Student Enrollments
            </DialogTitle>
            <DialogDescription>
              Upload a bulk CSV file of student enrollments. The system dispatches an asynchronous background task.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBatchImportSubmit}>
            <DialogBody className="space-y-4 py-3">
              {importValidationError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{importValidationError}</span>
                </div>
              )}

              {importResult && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Import Task Dispatched</span>
                  </div>
                  <p>{importResult.message}</p>
                  {importResult.taskId && (
                    <p className="font-mono text-[11px] opacity-80">Task ID: {importResult.taskId}</p>
                  )}
                </div>
              )}

              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center hover:bg-muted/20 transition-colors">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">
                  {importFile ? importFile.name : 'Select CSV File to Upload'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {importFile
                    ? `${(importFile.size / 1024).toFixed(1)} KB`
                    : 'CSV format required with student and course offering identifiers'}
                </p>

                <input
                  type="file"
                  id="csvFileInput"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImportFile(file);
                      setImportValidationError(null);
                    }
                  }}
                />

                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('csvFileInput')?.click()}
                  >
                    Browse CSV
                  </Button>
                  {importFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setImportFile(null)}
                      className="text-xs text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1 border border-border">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" /> Expected CSV Format
                </p>
                <p>Header: <code>student_identifier,course_code,academic_year,semester,section</code></p>
                <p>Example: <code>AASTU/1234/14,CS301,2025/2026,FIRST,A</code></p>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsBatchImportOpen(false)}>
                Close
              </Button>
              <Button type="submit" disabled={isImporting || !importFile}>
                {isImporting ? 'Uploading...' : 'Start Batch Import'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
