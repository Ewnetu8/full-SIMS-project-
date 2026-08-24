'use client';

import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  GraduationCap,
  Building2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Hash,
  Clock,
  Calendar,
} from 'lucide-react';
import * as React from 'react';

import { toast } from '@/components/feedback';
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

import type { Course, ClassStanding } from '../types';

const CLASS_STANDING_LABELS: Record<ClassStanding, string> = {
  FRESHMAN: 'Freshman',
  SOPHOMORE: 'Sophomore',
  JUNIOR: 'Junior',
  SENIOR: 'Senior',
  GRADUATE: 'Graduate',
};

const CLASS_STANDING_BADGES: Record<ClassStanding, string> = {
  FRESHMAN: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  SOPHOMORE: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  JUNIOR: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
  SENIOR: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  GRADUATE: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
};

export function CourseManagement() {
  const {
    courses,
    programs,
    departments,
    isLoadingCourses,
    coursesError,
    isLoadingPrograms,
    isLoadingDepartments,
    courseSearchQuery,
    courseProgramFilter,
    courseStandingFilter,
    courseDeptFilter,
    fetchCourses,
    fetchPrograms,
    fetchDepartments,
    fetchCourseById,
    addCourse,
    updateCourse,
    deleteCourse,
    setCourseSearchQuery,
    setCourseProgramFilter,
    setCourseStandingFilter,
    setCourseDeptFilter,
  } = useAdminStore();

  // Modals & Selection State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = React.useState<Course | null>(null);
  const [viewingCourseId, setViewingCourseId] = React.useState<string | null>(null);
  const [detailedCourse, setDetailedCourse] = React.useState<Course | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  // Form State
  const [formData, setFormData] = React.useState<{
    code: string;
    title: string;
    creditHours: number;
    programId: string;
    intendedClassStanding: ClassStanding | '';
  }>({
    code: '',
    title: '',
    creditHours: 3,
    programId: '',
    intendedClassStanding: 'FRESHMAN',
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Initial Data Fetch
  React.useEffect(() => {
    void fetchCourses();
    void fetchPrograms();
    void fetchDepartments();
  }, [fetchCourses, fetchPrograms, fetchDepartments]);

  // Department Resolver (safely checks Course -> Program -> Department)
  const getDepartmentName = React.useCallback(
    (course: Course): string => {
      // 1. Check nested programDetail.department_detail
      if (course.programDetail?.department_detail?.name) {
        return course.programDetail.department_detail.name;
      }
      // 2. Check programDetail.department ID via loaded departments
      if (course.programDetail?.department) {
        const dept = departments.find((d) => d.id === course.programDetail?.department);
        if (dept?.name) return dept.name;
      }
      // 3. Check course.program (UUID) via loaded programs
      if (course.program) {
        const prog = programs.find((p) => p.id === course.program);
        if (prog?.department_detail?.name) return prog.department_detail.name;
        if (prog?.department) {
          const dept = departments.find((d) => d.id === prog.department);
          if (dept?.name) return dept.name;
        }
      }
      return '—';
    },
    [departments, programs]
  );

  // Program Resolver
  const getProgramDisplay = React.useCallback(
    (course: Course): { name: string; code?: string; degreeLevel?: string } => {
      if (course.programDetail?.name) {
        return {
          name: course.programDetail.name,
          code: course.programDetail.code,
          degreeLevel: course.programDetail.degreeLevel,
        };
      }
      if (course.program) {
        const matched = programs.find((p) => p.id === course.program);
        if (matched?.name) {
          return {
            name: matched.name,
            code: matched.code,
            degreeLevel: matched.degreeLevel,
          };
        }
      }
      return { name: 'Unassigned' };
    },
    [programs]
  );

  // View Details Modal Handler
  const handleOpenViewDetails = async (courseId: string) => {
    setViewingCourseId(courseId);
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const course = await fetchCourseById(courseId);
      setDetailedCourse(course);
    } catch (err: unknown) {
      setDetailError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Open Create Modal
  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormError(null);
    setFormData({
      code: '',
      title: '',
      creditHours: 3,
      programId: programs[0]?.id || '',
      intendedClassStanding: 'FRESHMAN',
    });
    setEditingCourse(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (course: Course) => {
    setFieldErrors({});
    setFormError(null);
    setEditingCourse(course);
    setFormData({
      code: course.code,
      title: course.title || course.name,
      creditHours: course.creditHours,
      programId: course.program || course.programDetail?.id || '',
      intendedClassStanding: (course.intendedClassStanding as ClassStanding) || 'FRESHMAN',
    });
    setIsAddModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.code.trim()) {
      errors.course_code = 'Course code is required.';
    } else if (formData.code.length > 20) {
      errors.course_code = 'Course code must not exceed 20 characters.';
    }

    if (!formData.title.trim()) {
      errors.title = 'Course title is required.';
    } else if (formData.title.length > 255) {
      errors.title = 'Course title must not exceed 255 characters.';
    }

    if (Number(formData.creditHours) < 0 || isNaN(Number(formData.creditHours))) {
      errors.credit_hours = 'Credit hours must be a positive number.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Course (Create / Edit)
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    const payload = {
      course_code: formData.code.trim().toUpperCase(),
      title: formData.title.trim(),
      credit_hours: Number(formData.creditHours),
      program: formData.programId ? formData.programId : null,
      intended_class_standing: formData.intendedClassStanding ? (formData.intendedClassStanding as ClassStanding) : undefined,
    };

    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, payload);
        toast.success('Course updated successfully.');
        setEditingCourse(null);
      } else {
        await addCourse(payload);
        toast.success('Course created successfully.');
      }
      setIsAddModalOpen(false);
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

  // Delete Course
  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    setIsDeleting(true);
    try {
      await deleteCourse(deletingCourse.id);
      toast.success('Course deleted successfully.');
      setDeletingCourse(null);
    } catch {
      toast.error(
        'This course could not be deleted because it is currently being used by another academic record (e.g. course offering or prerequisite).'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Courses
  const filteredCourses = React.useMemo(() => {
    return courses.filter((c) => {
      // Search query filter (title or code)
      if (courseSearchQuery.trim()) {
        const q = courseSearchQuery.toLowerCase().trim();
        const codeMatch = c.code.toLowerCase().includes(q);
        const nameMatch = (c.name || c.title || '').toLowerCase().includes(q);
        if (!codeMatch && !nameMatch) return false;
      }

      // Program filter
      if (courseProgramFilter !== 'ALL') {
        const progId = c.program || c.programDetail?.id;
        if (progId !== courseProgramFilter) return false;
      }

      // Department filter
      if (courseDeptFilter !== 'ALL') {
        const courseDeptId =
          c.programDetail?.department_detail?.id ||
          c.programDetail?.department ||
          programs.find((p) => p.id === (c.program || c.programDetail?.id))?.department;
        if (courseDeptId !== courseDeptFilter) return false;
      }

      // Class Standing filter
      if (courseStandingFilter !== 'ALL') {
        if (c.intendedClassStanding !== courseStandingFilter) return false;
      }

      return true;
    });
  }, [courses, courseSearchQuery, courseProgramFilter, courseDeptFilter, courseStandingFilter, programs]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage) || 1;
  const paginatedCourses = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCourses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCourses, currentPage, itemsPerPage]);

  // Statistics
  const totalCoursesCount = courses.length;
  const uniqueProgramsCount = React.useMemo(() => {
    const programIds = new Set<string>();
    courses.forEach((c) => {
      const id = c.program || c.programDetail?.id;
      if (id) programIds.add(id);
    });
    return programIds.size;
  }, [courses]);
  const totalCredits = React.useMemo(() => {
    return courses.reduce((sum, c) => sum + (c.creditHours || 0), 0);
  }, [courses]);

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <BookOpen className="h-7 w-7 text-primary" /> Course Catalogue & Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, configure, and manage academic courses across curriculum programs.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void fetchCourses();
              void fetchPrograms();
              void fetchDepartments();
            }}
            disabled={isLoadingCourses || isLoadingPrograms || isLoadingDepartments}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingCourses ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 font-semibold"
          >
            <Plus className="h-4 w-4" /> Register New Course
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Courses</p>
            <p className="text-2xl font-bold text-foreground">{totalCoursesCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Programs</p>
            <p className="text-2xl font-bold text-foreground">{uniqueProgramsCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Curriculum Credits</p>
            <p className="text-2xl font-bold text-foreground">{totalCredits} Cr.</p>
          </div>
        </Card>
      </div>

      {/* Error Alert */}
      {coursesError && (
        <Card className="p-4 border-destructive/40 bg-destructive/10 text-destructive flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{coursesError}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchCourses()}
            className="border-destructive/30 hover:bg-destructive/20 text-destructive shrink-0"
          >
            Try Again
          </Button>
        </Card>
      )}

      {/* Filter / Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <SearchInput
              placeholder="Search course title or code..."
              value={courseSearchQuery}
              onChange={(e) => {
                setCourseSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => {
                setCourseSearchQuery('');
                setCurrentPage(1);
              }}
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={courseProgramFilter}
              onChange={(e) => {
                setCourseProgramFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Programs</option>
              {programs.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.name} ({prog.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className={selectClass}
              value={courseDeptFilter}
              onChange={(e) => {
                setCourseDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className={selectClass}
              value={courseStandingFilter}
              onChange={(e) => {
                setCourseStandingFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Class Standings</option>
              <option value="FRESHMAN">Freshman</option>
              <option value="SOPHOMORE">Sophomore</option>
              <option value="JUNIOR">Junior</option>
              <option value="SENIOR">Senior</option>
              <option value="GRADUATE">Graduate</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Course List Table */}
      <Card className="overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Course Code</th>
                <th className="px-4 py-3.5">Course Title</th>
                <th className="px-4 py-3.5">Program</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Credits</th>
                <th className="px-4 py-3.5">Class Standing</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingCourses ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>Loading courses from backend...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-base font-semibold text-foreground">
                        {courses.length === 0 ? 'No courses registered yet' : 'No matching courses found'}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {courses.length === 0
                          ? 'Get started by clicking Register New Course above.'
                          : 'Try adjusting your search criteria or resetting the active filters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCourses.map((crs) => {
                  const programDisplay = getProgramDisplay(crs);
                  const departmentDisplay = getDepartmentName(crs);
                  const standingBadgeStyle =
                    crs.intendedClassStanding && CLASS_STANDING_BADGES[crs.intendedClassStanding]
                      ? CLASS_STANDING_BADGES[crs.intendedClassStanding]
                      : 'bg-muted text-muted-foreground border-border';
                  const standingDisplay = crs.intendedClassStanding
                    ? CLASS_STANDING_LABELS[crs.intendedClassStanding] || crs.intendedClassStanding
                    : '—';

                  return (
                    <tr key={crs.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary">{crs.code}</td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-foreground">
                        {crs.title || crs.name}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {programDisplay.name === 'Unassigned' ? (
                          <span className="italic text-muted-foreground/60">Unassigned</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground">{programDisplay.name}</span>
                            {programDisplay.code && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {programDisplay.code}
                              </Badge>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {departmentDisplay === '—' ? (
                          <span className="text-muted-foreground/60">—</span>
                        ) : (
                          <span className="font-medium text-foreground">{departmentDisplay}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-foreground font-semibold">
                        {crs.creditHours} Cr.
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {crs.intendedClassStanding ? (
                          <Badge variant="outline" className={`text-[11px] font-medium ${standingBadgeStyle}`}>
                            {standingDisplay}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => void handleOpenViewDetails(crs.id)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenEditModal(crs)}
                            title="Edit Course"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingCourse(crs)}
                            title="Delete Course"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Pagination Footer */}
        {filteredCourses.length > itemsPerPage && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * itemsPerPage, filteredCourses.length)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{filteredCourses.length}</span> courses
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <span className="px-2 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Course Details Dialog (GET /api/v1/courses/{id}) */}
      <Dialog
        open={!!viewingCourseId}
        onOpenChange={(open) => {
          if (!open) {
            setViewingCourseId(null);
            setDetailedCourse(null);
            setDetailError(null);
          }
        }}
      >
        <DialogContent size="lg" className="p-0 overflow-hidden sm:max-w-xl">
          <DialogHeader className="px-6 pt-6 pb-2 border-b border-border bg-muted/10">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span>Course Details</span>
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Complete academic curriculum details retrieved directly from the backend API.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {isLoadingDetail ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm">Fetching course details from server...</span>
              </div>
            ) : detailError ? (
              <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{detailError}</span>
                </div>
                {viewingCourseId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleOpenViewDetails(viewingCourseId)}
                  >
                    Retry
                  </Button>
                )}
              </div>
            ) : detailedCourse ? (
              <div className="space-y-4">
                {/* Header Card */}
                <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
                      {detailedCourse.code}
                    </span>
                    <h3 className="text-lg font-bold text-foreground">{detailedCourse.title || detailedCourse.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 font-semibold">
                      {detailedCourse.creditHours} Credit Hours
                    </Badge>
                  </div>
                </div>

                {/* Grid Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
                    <p className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-primary" /> Program
                    </p>
                    <p className="font-semibold text-foreground text-sm">
                      {getProgramDisplay(detailedCourse).name}
                    </p>
                    {getProgramDisplay(detailedCourse).code && (
                      <p className="text-muted-foreground">
                        Code: {getProgramDisplay(detailedCourse).code}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
                    <p className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-indigo-500" /> Department
                    </p>
                    <p className="font-semibold text-foreground text-sm">
                      {getDepartmentName(detailedCourse)}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
                    <p className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-blue-500" /> Intended Class Standing
                    </p>
                    <p className="font-semibold text-foreground text-sm">
                      {detailedCourse.intendedClassStanding
                        ? CLASS_STANDING_LABELS[detailedCourse.intendedClassStanding] || detailedCourse.intendedClassStanding
                        : 'Not Specified'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
                    <p className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-amber-500" /> Course ID
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground truncate" title={detailedCourse.id}>
                      {detailedCourse.id}
                    </p>
                  </div>
                </div>

                {/* Metadata Timestamps */}
                {(detailedCourse.createdAt || detailedCourse.updatedAt) && (
                  <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground gap-1">
                    {detailedCourse.createdAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Created: {new Date(detailedCourse.createdAt).toLocaleDateString()}
                      </span>
                    )}
                    {detailedCourse.updatedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Updated: {new Date(detailedCourse.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </DialogBody>

          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-between gap-2">
            <div>
              {detailedCourse && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const c = detailedCourse;
                    setViewingCourseId(null);
                    handleOpenEditModal(c);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Course
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setViewingCourseId(null);
                setDetailedCourse(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Course Dialog */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingCourse(null);
          }
        }}
      >
        <DialogContent size="md" className="p-0 overflow-hidden sm:max-w-lg">
          <form onSubmit={handleSaveCourse}>
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  {editingCourse ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>
                <span>{editingCourse ? 'Edit Course' : 'Register New Course'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {editingCourse
                  ? 'Update course code, title, credits, program, or intended class standing.'
                  : 'Add a new academic course into the university curriculum registry.'}
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4 px-6 py-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="crsCode" required>
                    Course Code
                  </Label>
                  <Input
                    id="crsCode"
                    value={formData.code}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
                      if (fieldErrors.course_code || fieldErrors.code) {
                        setFieldErrors((prev) => ({ ...prev, course_code: '', code: '' }));
                      }
                    }}
                    placeholder="e.g. SE4201"
                    className="font-mono uppercase"
                    maxLength={20}
                  />
                  {(fieldErrors.course_code || fieldErrors.code) && (
                    <p className="text-xs text-destructive font-medium">
                      {fieldErrors.course_code || fieldErrors.code}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="credits" required>
                    Credit Hours
                  </Label>
                  <Input
                    id="credits"
                    type="number"
                    min={0}
                    value={formData.creditHours}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, creditHours: parseInt(e.target.value) || 0 }));
                      if (fieldErrors.credit_hours) {
                        setFieldErrors((prev) => ({ ...prev, credit_hours: '' }));
                      }
                    }}
                  />
                  {fieldErrors.credit_hours && (
                    <p className="text-xs text-destructive font-medium">{fieldErrors.credit_hours}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="crsTitle" required>
                  Course Title
                </Label>
                <Input
                  id="crsTitle"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, title: e.target.value }));
                    if (fieldErrors.title) {
                      setFieldErrors((prev) => ({ ...prev, title: '' }));
                    }
                  }}
                  placeholder="e.g. Software Architecture and Design"
                  maxLength={255}
                />
                {fieldErrors.title && (
                  <p className="text-xs text-destructive font-medium">{fieldErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="programId">Program (Optional)</Label>
                  <select
                    id="programId"
                    className={selectClass}
                    value={formData.programId}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, programId: e.target.value }));
                      if (fieldErrors.program) {
                        setFieldErrors((prev) => ({ ...prev, program: '' }));
                      }
                    }}
                  >
                    <option value="">-- Unassigned Program --</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.program && (
                    <p className="text-xs text-destructive font-medium">{fieldErrors.program}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="classStanding">Intended Class Standing</Label>
                  <select
                    id="classStanding"
                    className={selectClass}
                    value={formData.intendedClassStanding}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        intendedClassStanding: e.target.value as ClassStanding | '',
                      }));
                      if (fieldErrors.intended_class_standing) {
                        setFieldErrors((prev) => ({ ...prev, intended_class_standing: '' }));
                      }
                    }}
                  >
                    <option value="FRESHMAN">Freshman</option>
                    <option value="SOPHOMORE">Sophomore</option>
                    <option value="JUNIOR">Junior</option>
                    <option value="SENIOR">Senior</option>
                    <option value="GRADUATE">Graduate</option>
                  </select>
                  {fieldErrors.intended_class_standing && (
                    <p className="text-xs text-destructive font-medium">
                      {fieldErrors.intended_class_standing}
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
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCourse(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : editingCourse
                  ? 'Save Changes'
                  : 'Register Course'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Course Confirmation Dialog */}
      <Dialog
        open={!!deletingCourse}
        onOpenChange={(open) => {
          if (!open) setDeletingCourse(null);
        }}
      >
        <DialogContent size="sm" className="p-0 overflow-hidden sm:max-w-md">
          <DialogHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-2.5 text-destructive">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-bold">Delete Course</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete course{' '}
              <span className="font-semibold text-foreground">
                {deletingCourse?.code} - {deletingCourse?.title || deletingCourse?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingCourse(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteCourse}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
