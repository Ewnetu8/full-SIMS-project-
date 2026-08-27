'use client';

import {
  Layers3,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  BookOpen,
  UserCheck,
  ArrowRight,
  School,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
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

import { LecturerDropdown } from './assignment-form-dropdowns';
import { useAdminStore } from '../store';
import type { AdminCourseOffering, CreateTeachingAssignmentPayload } from '../types';

export function CourseOfferingManagement() {
  const {
    courseOfferings,
    courses,
    semesters,
    academicYears,
    lecturers,
    teachingAssignments,
    isLoadingCourseOfferings,
    courseOfferingsError,
    isLoadingCourses,
    isLoadingSemesters,
    isLoadingLecturers,
    fetchCourseOfferings,
    fetchCourses,
    fetchSemesters,
    fetchAcademicYears,
    fetchLecturers,
    fetchTeachingAssignments,
    addCourseOffering,
    updateCourseOffering,
    deleteCourseOffering,
    addTeachingAssignment,
  } = useAdminStore();

  // ── STATE ──────────────────────────────────────────────────────────────────
  const [isOfferingModalOpen, setIsOfferingModalOpen] = React.useState(false);
  const [editingOffering, setEditingOffering] = React.useState<AdminCourseOffering | null>(null);
  const [deletingOffering, setDeletingOffering] = React.useState<AdminCourseOffering | null>(null);
  const [viewingOffering, setViewingOffering] = React.useState<AdminCourseOffering | null>(null);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [semesterFilter, setSemesterFilter] = React.useState('ALL');
  const [courseFilter, setCourseFilter] = React.useState('ALL');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Form State for Course Offering
  const [formData, setFormData] = React.useState({
    course: '',
    semester: '',
    section: 'A',
    capacity: 40,
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Teaching Assignment Inline Modal
  const [assigningOffering, setAssigningOffering] = React.useState<AdminCourseOffering | null>(null);
  const [assignLecturerId, setAssignLecturerId] = React.useState('');
  const [assignIsActive, setAssignIsActive] = React.useState(true);
  const [assignFormError, setAssignFormError] = React.useState<string | null>(null);
  const [isSubmittingAssign, setIsSubmittingAssign] = React.useState(false);

  // ── INITIAL FETCH ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    void fetchCourseOfferings();
    void fetchCourses();
    void fetchSemesters();
    void fetchAcademicYears();
    void fetchLecturers();
    void fetchTeachingAssignments();
  }, [
    fetchCourseOfferings,
    fetchCourses,
    fetchSemesters,
    fetchAcademicYears,
    fetchLecturers,
    fetchTeachingAssignments,
  ]);

  // ── FORM HANDLERS ──────────────────────────────────────────────────────────
  const handleOpenAddOffering = () => {
    setFieldErrors({});
    setFormError(null);
    setFormData({
      course: courses[0]?.id || '',
      semester: semesters[0]?.id || '',
      section: 'A',
      capacity: 40,
    });
    setEditingOffering(null);
    setIsOfferingModalOpen(true);
  };

  const handleOpenEditOffering = (offering: AdminCourseOffering) => {
    setFieldErrors({});
    setFormError(null);
    setEditingOffering(offering);
    setFormData({
      course: offering.course || offering.course_detail?.id || '',
      semester: offering.semester || offering.semester_detail?.id || '',
      section: offering.section || 'A',
      capacity: offering.capacity || 40,
    });
    setIsOfferingModalOpen(true);
  };

  const validateOfferingForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.course.trim()) {
      errors.course = 'Please select a course.';
    }
    if (!formData.semester.trim()) {
      errors.semester = 'Please select an academic semester.';
    }
    if (!formData.section.trim()) {
      errors.section = 'Section identifier is required (e.g. A, B).';
    } else if (formData.section.trim().length > 10) {
      errors.section = 'Section must not exceed 10 characters.';
    }
    if (Number(formData.capacity) < 1 || isNaN(Number(formData.capacity))) {
      errors.capacity = 'Capacity must be at least 1 student.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOfferingForm()) return;

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    const payload = {
      course: formData.course.trim(),
      semester: formData.semester.trim(),
      section: formData.section.trim().toUpperCase(),
      capacity: Number(formData.capacity),
    };

    try {
      if (editingOffering) {
        await updateCourseOffering(editingOffering.id, payload);
        toast.success('Course offering updated successfully.');
        setEditingOffering(null);
      } else {
        await addCourseOffering(payload);
        toast.success('Course offering created successfully.');
      }
      setIsOfferingModalOpen(false);
    } catch (err: unknown) {
      const parsedErrors = parseFieldErrors(err);
      if (Object.keys(parsedErrors).length > 0) {
        setFieldErrors(parsedErrors);
      } else {
        setFormError(getUserFriendlyErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOffering = async () => {
    if (!deletingOffering) return;
    setIsDeleting(true);
    try {
      await deleteCourseOffering(deletingOffering.id);
      toast.success('Course offering deleted successfully.');
      setDeletingOffering(null);
    } catch {
      toast.error(
        'Cannot remove this course offering because active student enrollments or teaching assignments depend on it.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ── TEACHING ASSIGNMENT ACTIONS ────────────────────────────────────────────
  const handleOpenAssignLecturer = (offering: AdminCourseOffering) => {
    setAssigningOffering(offering);
    setAssignLecturerId('');
    setAssignIsActive(true);
    setAssignFormError(null);
  };

  const handleAssignLecturerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningOffering) return;

    if (!assignLecturerId) {
      setAssignFormError('Please select a lecturer.');
      return;
    }

    const existing = teachingAssignments.find(
      (a) => a.course_offering === assigningOffering.id && a.lecturer === assignLecturerId
    );
    if (existing) {
      setAssignFormError('This lecturer is already assigned to this course offering.');
      return;
    }

    setIsSubmittingAssign(true);
    setAssignFormError(null);

    const payload: CreateTeachingAssignmentPayload = {
      lecturer: assignLecturerId,
      course_offering: assigningOffering.id,
      is_active: assignIsActive,
    };

    try {
      await addTeachingAssignment(payload);
      toast.success('Teaching assignment created successfully.');
      setAssigningOffering(null);
      await fetchTeachingAssignments();
    } catch (err: unknown) {
      const parsed = parseFieldErrors(err);
      if (parsed.non_field_errors) {
        setAssignFormError(parsed.non_field_errors);
      } else if (parsed.lecturer || parsed.course_offering) {
        setAssignFormError(parsed.lecturer || parsed.course_offering || null);
      } else {
        const errorMsg = getUserFriendlyErrorMessage(err);
        if (errorMsg.toLowerCase().includes('already assigned') || errorMsg.toLowerCase().includes('already exists')) {
          setAssignFormError('This lecturer is already assigned to this course offering.');
        } else {
          setAssignFormError(errorMsg || 'Unable to create teaching assignment.');
        }
      }
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // ── FILTERED DATA ──────────────────────────────────────────────────────────
  const filteredOfferings = React.useMemo(() => {
    return courseOfferings.filter((offering) => {
      const q = searchQuery.toLowerCase().trim();
      const code = String(offering.course_detail?.course_code || offering.course_detail?.code || '').toLowerCase();
      const title = String(offering.course_detail?.title || offering.course_detail?.name || '').toLowerCase();
      const section = String(offering.section || '').toLowerCase();
      const semYear = String(
        offering.semester_detail?.academic_year_detail?.display_label ||
        offering.semester_detail?.academicYearDetail?.displayLabel ||
        ''
      ).toLowerCase();

      const matchesSearch = !q || code.includes(q) || title.includes(q) || section.includes(q) || semYear.includes(q);

      const semId = offering.semester || offering.semester_detail?.id;
      const matchesSemester = semesterFilter === 'ALL' || semId === semesterFilter;

      const crsId = offering.course || offering.course_detail?.id;
      const matchesCourse = courseFilter === 'ALL' || crsId === courseFilter;

      return matchesSearch && matchesSemester && matchesCourse;
    });
  }, [courseOfferings, searchQuery, semesterFilter, courseFilter]);

  const paginatedOfferings = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOfferings.slice(start, start + itemsPerPage);
  }, [filteredOfferings, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredOfferings.length / itemsPerPage) || 1;

  // Stats
  const offeringStats = React.useMemo(() => {
    const total = courseOfferings.length;
    const totalCapacity = courseOfferings.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
    const distinctCourses = new Set(courseOfferings.map((o) => o.course || o.course_detail?.id).filter(Boolean)).size;
    const distinctSemesters = new Set(courseOfferings.map((o) => o.semester || o.semester_detail?.id).filter(Boolean)).size;
    return { total, totalCapacity, distinctCourses, distinctSemesters };
  }, [courseOfferings]);

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Course Offerings
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
              Semester Schedule
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage specific semester and section offerings of existing courses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/courses">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Master Courses
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void fetchCourseOfferings();
              void fetchCourses();
              void fetchSemesters();
            }}
            disabled={isLoadingCourseOfferings || isLoadingCourses}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingCourseOfferings ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleOpenAddOffering}>
            Create Course Offering
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Offerings</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers3 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{offeringStats.total}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Scheduled class sections</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Seat Capacity</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600">{offeringStats.totalCapacity}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Total student capacity</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Offered Courses</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{offeringStats.distinctCourses}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Distinct curriculum subjects</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Semesters</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">{offeringStats.distinctSemesters}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Semester terms represented</p>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 border-border space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <SearchInput
              placeholder="Search course code, title, section..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full"
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={semesterFilter}
              onChange={(e) => {
                setSemesterFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Semesters</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.academicYearDetail?.displayLabel || 'Academic Year'} — {s.semesterIndex} Semester
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className={selectClass}
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.name || c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Offerings Table */}
      <Card className="overflow-hidden border-border">
        {isLoadingCourseOfferings ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <Clock className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
            Loading course offerings...
          </div>
        ) : courseOfferingsError ? (
          <div className="p-8 text-center text-sm text-destructive">
            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <p className="font-semibold">Error loading course offerings</p>
            <p className="text-xs text-muted-foreground mt-1">{courseOfferingsError}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => void fetchCourseOfferings()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Course (Subject)</th>
                  <th className="px-4 py-3.5">Semester & Academic Period</th>
                  <th className="px-4 py-3.5">Section</th>
                  <th className="px-4 py-3.5">Capacity</th>
                  <th className="px-4 py-3.5">Credits</th>
                  <th className="px-4 py-3.5">Created Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedOfferings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      <Layers3 className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                      <p className="font-medium text-foreground">No course offerings found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {searchQuery || semesterFilter !== 'ALL' || courseFilter !== 'ALL'
                          ? 'No course offerings match your filter criteria.'
                          : 'No course offerings created yet. Click "Create Course Offering" to schedule an offering for a course.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedOfferings.map((offering) => {
                    const course = offering.course_detail;
                    const sem = offering.semester_detail;

                    return (
                      <tr key={offering.id} className="hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div>
                            <span className="font-bold text-primary font-mono text-xs">
                              {course?.course_code || course?.code || 'Course'}
                            </span>
                            <p className="text-xs font-medium text-foreground mt-0.5">
                              {course?.title || course?.name || '—'}
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
                          <Badge variant="outline" className="font-mono text-xs bg-muted/30">
                            Section {offering.section || 'A'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-semibold text-foreground">
                          {offering.capacity ?? 40} seats
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {course?.credit_hours ?? course?.creditHours ?? '—'} cr
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {offering.created_at ? new Date(offering.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <Button
                              variant="outline"
                              size="xs"
                              className="text-xs font-medium border-primary/30 text-primary hover:bg-primary/10"
                              onClick={() => handleOpenAssignLecturer(offering)}
                              title="Assign Lecturer to this offering"
                            >
                              <UserCheck className="h-3.5 w-3.5 mr-1" /> Assign Lecturer
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => setViewingOffering(offering)}
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleOpenEditOffering(offering)}
                              title="Edit Offering"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => setDeletingOffering(offering)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete Offering"
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

        {filteredOfferings.length > itemsPerPage && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredOfferings.length)} of {filteredOfferings.length} offerings
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

      {/* ── CREATE / EDIT COURSE OFFERING DIALOG ───────────────────────────── */}
      <Dialog open={isOfferingModalOpen} onOpenChange={setIsOfferingModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-primary" />
              {editingOffering ? 'Edit Course Offering' : 'Create Course Offering'}
            </DialogTitle>
            <DialogDescription>
              {editingOffering
                ? 'Update section code and maximum student capacity for this course offering.'
                : 'Select an existing academic course and schedule an offering for a semester.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveOffering}>
            <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Course Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="offeringCourseSelect" required>
                  Course
                </Label>
                <select
                  id="offeringCourseSelect"
                  className={`${selectClass} ${fieldErrors.course ? 'border-destructive' : ''}`}
                  value={formData.course}
                  onChange={(e) => {
                    setFormData({ ...formData, course: e.target.value });
                    if (fieldErrors.course) {
                      setFieldErrors((prev) => ({ ...prev, course: '' }));
                    }
                  }}
                >
                  <option value="">Select an existing course...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title || c.name} ({c.creditHours} cr)
                    </option>
                  ))}
                </select>
                {fieldErrors.course && (
                  <p className="text-xs text-destructive">{fieldErrors.course}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Course definitions are maintained in Master Courses.
                </p>
              </div>

              {/* Semester Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="offeringSemesterSelect" required>
                  Semester
                </Label>
                <select
                  id="offeringSemesterSelect"
                  className={`${selectClass} ${fieldErrors.semester ? 'border-destructive' : ''}`}
                  value={formData.semester}
                  onChange={(e) => {
                    setFormData({ ...formData, semester: e.target.value });
                    if (fieldErrors.semester) {
                      setFieldErrors((prev) => ({ ...prev, semester: '' }));
                    }
                  }}
                >
                  <option value="">Select an academic semester...</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.academicYearDetail?.displayLabel || 'Academic Year'} — {s.semesterIndex} Semester
                    </option>
                  ))}
                </select>
                {fieldErrors.semester && (
                  <p className="text-xs text-destructive">{fieldErrors.semester}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Section */}
                <div className="space-y-1.5">
                  <Label htmlFor="offeringSectionInput" required>
                    Section
                  </Label>
                  <Input
                    id="offeringSectionInput"
                    placeholder="e.g. A, B, Sec-1"
                    value={formData.section}
                    onChange={(e) => {
                      setFormData({ ...formData, section: e.target.value });
                      if (fieldErrors.section) {
                        setFieldErrors((prev) => ({ ...prev, section: '' }));
                      }
                    }}
                    className={fieldErrors.section ? 'border-destructive uppercase font-mono' : 'uppercase font-mono'}
                  />
                  {fieldErrors.section && (
                    <p className="text-xs text-destructive">{fieldErrors.section}</p>
                  )}
                </div>

                {/* Capacity */}
                <div className="space-y-1.5">
                  <Label htmlFor="offeringCapacityInput" required>
                    Capacity (Students)
                  </Label>
                  <Input
                    id="offeringCapacityInput"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.capacity}
                    onChange={(e) => {
                      setFormData({ ...formData, capacity: Number(e.target.value) });
                      if (fieldErrors.capacity) {
                        setFieldErrors((prev) => ({ ...prev, capacity: '' }));
                      }
                    }}
                    className={fieldErrors.capacity ? 'border-destructive' : ''}
                  />
                  {fieldErrors.capacity && (
                    <p className="text-xs text-destructive">{fieldErrors.capacity}</p>
                  )}
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsOfferingModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : editingOffering
                  ? 'Update Course Offering'
                  : 'Create Course Offering'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── ASSIGN LECTURER DIALOG ─────────────────────────────────────────── */}
      {assigningOffering && (
        <Dialog open={!!assigningOffering} onOpenChange={() => setAssigningOffering(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" /> Assign Lecturer
              </DialogTitle>
              <DialogDescription>
                Assign a faculty member to teach this specific course offering.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAssignLecturerSubmit}>
              <DialogBody className="space-y-4 py-3">
                {assignFormError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{assignFormError}</span>
                  </div>
                )}

                {/* Target Offering Information Card */}
                <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Target Course Offering
                  </span>
                  <p className="text-xs font-bold text-foreground">
                    <span className="font-mono text-primary mr-1.5">
                      {assigningOffering.course_detail?.course_code || assigningOffering.course_detail?.code}
                    </span>
                    {assigningOffering.course_detail?.title || assigningOffering.course_detail?.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Section {assigningOffering.section || 'A'} ·{' '}
                    {assigningOffering.semester_detail?.academic_year_detail?.display_label ||
                      assigningOffering.semester_detail?.academicYearDetail?.displayLabel ||
                      'Academic Year'}{' '}
                    ({assigningOffering.semester_detail?.semester_index || assigningOffering.semester_detail?.semesterIndex} Sem)
                  </p>
                </div>

                {/* Lecturer Selector */}
                <div className="space-y-1.5">
                  <LecturerDropdown
                    value={assignLecturerId}
                    onChange={setAssignLecturerId}
                    lecturers={lecturers}
                    isLoading={isLoadingLecturers}
                    label="Assigned Lecturer"
                    required
                  />
                </div>

                {/* Active Assignment Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="assignIsActiveCheckbox"
                    checked={assignIsActive}
                    onChange={(e) => setAssignIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <label htmlFor="assignIsActiveCheckbox" className="text-xs text-foreground cursor-pointer font-medium">
                    Set teaching assignment as active
                  </label>
                </div>
              </DialogBody>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setAssigningOffering(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingAssign}>
                  {isSubmittingAssign ? 'Assigning...' : 'Confirm Assignment'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── VIEW OFFERING DETAILS DIALOG ───────────────────────────────────── */}
      {viewingOffering && (
        <Dialog open={!!viewingOffering} onOpenChange={() => setViewingOffering(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-primary" /> Course Offering Details
              </DialogTitle>
            </DialogHeader>

            <DialogBody className="space-y-4 py-3">
              <div className="border-b border-border pb-3">
                <p className="font-mono text-xs font-bold text-primary">
                  {viewingOffering.course_detail?.course_code || viewingOffering.course_detail?.code || 'Course'}
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {viewingOffering.course_detail?.title || viewingOffering.course_detail?.name || '—'}
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-foreground">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Academic Year:</span>
                  <span className="font-semibold">
                    {viewingOffering.semester_detail?.academic_year_detail?.display_label ||
                      viewingOffering.semester_detail?.academicYearDetail?.displayLabel ||
                      '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Semester Term:</span>
                  <span>
                    {viewingOffering.semester_detail?.semester_index ||
                      viewingOffering.semester_detail?.semesterIndex ||
                      '—'}{' '}
                    Semester
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Section:</span>
                  <span className="font-mono font-bold">Section {viewingOffering.section || 'A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Max Capacity:</span>
                  <span className="font-semibold">{viewingOffering.capacity ?? 40} students</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Course Credits:</span>
                  <span>{viewingOffering.course_detail?.credit_hours ?? viewingOffering.course_detail?.creditHours ?? '—'} hrs</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Created:</span>
                  <span>
                    {viewingOffering.created_at
                      ? new Date(viewingOffering.created_at).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingOffering(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── DELETE OFFERING CONFIRMATION DIALOG ────────────────────────────── */}
      <ConfirmationDialog
        open={!!deletingOffering}
        onOpenChange={(open) => {
          if (!open) setDeletingOffering(null);
        }}
        onConfirm={handleDeleteOffering}
        title="Delete Course Offering"
        description={`Are you sure you want to delete the course offering for "${
          deletingOffering?.course_detail?.course_code || deletingOffering?.course_detail?.code || 'Course'
        } - Section ${deletingOffering?.section || 'A'}"? This action cannot be undone.`}
        confirmLabel="Delete Offering"
        destructive
        loading={isDeleting}
      />
    </div>
  );
}
