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
  Download,
  FileText,
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
    isLoadingEnrollments,
    enrollmentsError,
    isLoadingCourseOfferings,
    courseOfferingsError,
    enrollmentSearchQuery,
    enrollmentStatusFilter,
    enrollmentSemesterFilter,
    enrollmentCourseFilter,
    fetchEnrollments,
    fetchCourseOfferings,
    fetchCourses,
    fetchSemesters,
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
    fetchEnrollments();
    fetchCourseOfferings();
    fetchCourses();
    fetchSemesters();
  }, [fetchEnrollments, fetchCourseOfferings, fetchCourses, fetchSemesters]);

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
        courseCode.includes(q) ||
        courseName.includes(q) ||
        semesterLabel.includes(q) ||
        section.includes(q);

      const matchesStatus =
        enrollmentStatusFilter === 'ALL' || e.status === enrollmentStatusFilter;

      const matchesSemester =
        enrollmentSemesterFilter === 'ALL' ||
        e.course_offering_detail?.semester === enrollmentSemesterFilter ||
        e.course_offering_detail?.semester_detail?.id === enrollmentSemesterFilter;

      const matchesCourse =
        enrollmentCourseFilter === 'ALL' ||
        e.course_offering_detail?.course === enrollmentCourseFilter ||
        e.course_offering_detail?.course_detail?.id === enrollmentCourseFilter;

      return matchesSearch && matchesStatus && matchesSemester && matchesCourse;
    });
  }, [
    enrollments,
    enrollmentSearchQuery,
    enrollmentStatusFilter,
    enrollmentSemesterFilter,
    enrollmentCourseFilter,
  ]);

  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage) || 1;
  const paginatedEnrollments = filteredEnrollments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper for Status Badges
  const getStatusBadge = (status: EnrollmentStatus) => {
    switch (status) {
      case 'ENROLLED':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Enrolled</Badge>;
      case 'PASSED':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Passed</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'DROPPED':
        return <Badge variant="secondary">Dropped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFieldErrors({});
    setGeneralError(null);
    if (courseOfferings.length === 0) {
      void fetchCourseOfferings();
    }
    setCreateFormData({
      student: '',
      course_offering: courseOfferings[0]?.id || '',
      status: 'ENROLLED',
      grade: '',
    });
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (enrollment: AdminEnrollment) => {
    setFieldErrors({});
    setGeneralError(null);
    setEditingEnrollment(enrollment);
    setEditFormData({
      status: enrollment.status,
      grade: enrollment.grade || '',
    });
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    const errors: Record<string, string> = {};
    if (!createFormData.student.trim()) {
      errors.student = 'Student identifier / UUID is required.';
    }
    if (!createFormData.course_offering.trim()) {
      errors.course_offering = 'Course Offering selection is required.';
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
        grade: createFormData.grade.trim() || null,
      });
      toast.success('Enrollment created successfully.');
      setIsCreateOpen(false);
    } catch (err: unknown) {
      const parsed = parseFieldErrors(err);
      const friendlyMsg = getUserFriendlyErrorMessage(err);
      setFieldErrors(parsed);
      setGeneralError(friendlyMsg);
      toast.error('Failed to create enrollment', { description: friendlyMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnrollment) return;

    setFieldErrors({});
    setGeneralError(null);
    setIsSubmitting(true);
    try {
      await updateEnrollment(editingEnrollment.id, {
        status: editFormData.status,
        grade: editFormData.grade.trim() || null,
      });
      toast.success('Enrollment updated successfully.');
      setEditingEnrollment(null);
    } catch (err: unknown) {
      const parsed = parseFieldErrors(err);
      const friendlyMsg = getUserFriendlyErrorMessage(err);
      setFieldErrors(parsed);
      setGeneralError(friendlyMsg);
      toast.error('Failed to update enrollment', { description: friendlyMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingEnrollment) return;
    try {
      await deleteEnrollment(deletingEnrollment.id);
      toast.success('Enrollment removed / dropped successfully.');
      setDeletingEnrollment(null);
    } catch (err: unknown) {
      toast.error('Failed to remove enrollment', {
        description: getUserFriendlyErrorMessage(err),
      });
    }
  };

  // Open Batch Import Modal
  const handleOpenBatchImport = () => {
    setImportFile(null);
    setImportValidationError(null);
    setImportResult(null);
    setIsBatchImportOpen(true);
  };

  // Handle CSV File Selection with client-side validations
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportValidationError(null);
    setImportResult(null);
    const file = e.target.files?.[0] || null;
    if (!file) {
      setImportFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportValidationError('Please upload a valid .csv file.');
      setImportFile(null);
      return;
    }
    if (file.size === 0) {
      setImportValidationError('The selected file is empty. Please select a valid CSV file.');
      setImportFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImportValidationError('The CSV file is too large to upload. Maximum allowed size is 10 MB.');
      setImportFile(null);
      return;
    }
    setImportFile(file);
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const sampleSemId = semesters[0]?.id || '31bd7164-0c69-4bba-a63d-36f9a3d9d043';
    const sampleCsv = `student_identifier,course_code,semester_id,section\nSTU001,SW12,${sampleSemId},A\nSTU002,FR5,${sampleSemId},A\nSTU003,WS123,${sampleSemId},A\n`;
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'batch_student_enrollment_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Batch CSV Import Submission
  const handleBatchImportSubmit = async () => {
    if (!importFile) {
      setImportValidationError('Please select a CSV file to import.');
      return;
    }
    setIsImporting(true);
    setImportValidationError(null);
    try {
      const res = await batchImportEnrollments(importFile);
      const taskId = res.task_id;
      const message = res.detail || res.message || 'Batch enrollment import task dispatched successfully.';
      setImportResult({ taskId, message });
      toast.success('Batch enrollment import dispatched', {
        description: taskId ? `Background Task ID: ${taskId}` : message,
      });
      void fetchEnrollments();
    } catch (err: unknown) {
      const friendlyMsg = getUserFriendlyErrorMessage(err);
      setImportValidationError(friendlyMsg);
      toast.error('Batch import failed', {
        description: friendlyMsg,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" /> Enrollment Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage course enrollments, student registrations, grading outcomes, and batch imports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleOpenBatchImport} leftIcon={<Upload className="h-4 w-4" />}>
            Batch Import CSV
          </Button>
          <Button onClick={handleOpenCreate} leftIcon={<UserPlus className="h-4 w-4" />}>
            Create Enrollment
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Enrollments</p>
            <p className="text-xl font-bold text-foreground">{stats.total}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Active Enrolled</p>
            <p className="text-xl font-bold text-primary">{stats.active}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Passed</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.passed}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive shrink-0">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Dropped / Failed</p>
            <p className="text-xl font-bold text-destructive">{stats.failed + stats.dropped}</p>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <SearchInput
              placeholder="Search student ID, course, semester..."
              value={enrollmentSearchQuery}
              onChange={(e) => {
                setEnrollmentSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => setEnrollmentSearchQuery('')}
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
              {semesters.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.academicYearDetail?.displayLabel || 'Academic Year'} - {sem.semesterIndex} Semester
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
      <Card className="overflow-hidden">
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
            <Button variant="outline" size="sm" className="mt-4" onClick={() => fetchEnrollments()}>
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

                    return (
                      <tr key={enrollment.id} className="hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                              <GraduationCap className="h-4 w-4" />
                            </div>
                            <span className="font-mono text-xs font-semibold text-primary">
                              {enrollment.student}
                            </span>
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
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setDeletingEnrollment(enrollment)}
                              title="Drop / Delete Enrollment"
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

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages} ({filteredEnrollments.length} total records)
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
              Enroll a student in a course offering. The backend will validate duplicate, prerequisite, class standing, and credit hour rules.
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

              {/* Student UUID / Identifier */}
              <div className="space-y-1.5">
                <Label htmlFor="studentIdInput" required>
                  Student UUID / Identifier
                </Label>
                <Input
                  id="studentIdInput"
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={createFormData.student}
                  onChange={(e) => {
                    setCreateFormData({ ...createFormData, student: e.target.value });
                    if (fieldErrors.student) {
                      setFieldErrors((prev) => ({ ...prev, student: '' }));
                    }
                  }}
                  className={fieldErrors.student ? 'border-destructive' : ''}
                />
                {fieldErrors.student ? (
                  <p className="text-xs text-destructive">{fieldErrors.student}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Provide the student profile UUID registered in the backend.
                  </p>
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
              <div className="border-b border-border pb-3">
                <p className="text-xs text-muted-foreground">Student UUID / Reference</p>
                <p className="font-mono text-sm font-bold text-primary mt-0.5">
                  {selectedEnrollment.student}
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-foreground">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> Course:
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
                    <Layers className="h-3.5 w-3.5" /> Section & Capacity:
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
                    <Calendar className="h-3.5 w-3.5" /> Academic Period:
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
                    {selectedEnrollment.grade || 'Not Graded Yet'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    Date Created:
                  </span>
                  <span className="font-medium">
                    {selectedEnrollment.created_at
                      ? new Date(selectedEnrollment.created_at).toLocaleString()
                      : '—'}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    Enrollment ID:
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {selectedEnrollment.id}
                  </span>
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button onClick={() => setSelectedEnrollment(null)}>Close</Button>
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
                <Edit2 className="h-5 w-5 text-primary" /> Update Enrollment
              </DialogTitle>
              <DialogDescription>
                Update enrollment status and grade outcome for this student.
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

                <div className="space-y-1 text-xs">
                  <p className="text-muted-foreground">Student:</p>
                  <p className="font-mono font-semibold text-primary">{editingEnrollment.student}</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="editStatusSelect">Enrollment Status</Label>
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

                <div className="space-y-1.5">
                  <Label htmlFor="editGradeInput">Grade</Label>
                  <Input
                    id="editGradeInput"
                    placeholder="e.g. A, B+, C, etc."
                    value={editFormData.grade}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, grade: e.target.value })
                    }
                  />
                </div>
              </DialogBody>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditingEnrollment(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── DROP / DELETE CONFIRMATION DIALOG ───────────────────────────────── */}
      <ConfirmationDialog
        open={!!deletingEnrollment}
        onOpenChange={(open) => {
          if (!open) setDeletingEnrollment(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Drop / Remove Enrollment"
        description="Are you sure you want to remove this course enrollment record? This action will permanently drop the student from the course offering on the backend."
        confirmLabel="Drop Enrollment"
        destructive
      />

      {/* ── BATCH CSV IMPORT DIALOG ─────────────────────────────────────────── */}
      <Dialog open={isBatchImportOpen} onOpenChange={setIsBatchImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Batch Student Enrollment CSV Import
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file containing student enrollment records. The backend will asynchronously process the import.
            </DialogDescription>
          </DialogHeader>

          {importResult ? (
            <DialogBody className="space-y-4 py-4">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h4 className="text-base font-semibold text-foreground">Import Started</h4>
                <p className="text-xs text-muted-foreground">
                  The CSV file was successfully submitted for processing.
                </p>
                {importResult.taskId && (
                  <div className="pt-2">
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold">Celery Task ID:</p>
                    <code className="text-xs font-mono text-primary bg-background px-2.5 py-1 rounded border border-border inline-block mt-1">
                      {importResult.taskId}
                    </code>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Your enrollment import has been queued for processing.
              </p>
            </DialogBody>
          ) : (
            <DialogBody className="space-y-4 py-3">
              {importValidationError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{importValidationError}</span>
                </div>
              )}

              <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-2 text-muted-foreground border border-border">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">Required CSV Column Headers:</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] px-2 text-primary"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="h-3 w-3 mr-1" /> Template
                  </Button>
                </div>
                <code className="block text-[11px] font-mono text-primary bg-background p-2 rounded border border-border">
                  student_identifier,course_code,semester_id,section
                </code>
                <div className="text-[11px] space-y-0.5 pt-1 text-muted-foreground">
                  <p>• <span className="font-semibold text-foreground">student_identifier</span>: Registered student ID</p>
                  <p>• <span className="font-semibold text-foreground">course_code</span>: Code of the academic course (e.g. SW12)</p>
                  <p>• <span className="font-semibold text-foreground">semester_id</span>: UUID of the academic semester</p>
                  <p>• <span className="font-semibold text-foreground">section</span>: Offering section letter (e.g. A, B)</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="enrollmentCsvFile" required>
                  Select CSV File
                </Label>
                <Input
                  id="enrollmentCsvFile"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileSelect}
                  disabled={isImporting}
                />
                {importFile && (
                  <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-2 text-xs mt-1.5">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium text-foreground truncate">{importFile.name}</span>
                      <span className="text-[11px] text-muted-foreground">({(importFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => setImportFile(null)}
                      disabled={isImporting}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </DialogBody>
          )}

          <DialogFooter>
            {importResult ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setImportResult(null);
                    setImportFile(null);
                  }}
                >
                  Import Another File
                </Button>
                <Button onClick={() => setIsBatchImportOpen(false)}>
                  Done
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsBatchImportOpen(false)} disabled={isImporting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleBatchImportSubmit}
                  disabled={isImporting || !importFile}
                >
                  {isImporting ? 'Uploading CSV...' : 'Import Enrollments'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
