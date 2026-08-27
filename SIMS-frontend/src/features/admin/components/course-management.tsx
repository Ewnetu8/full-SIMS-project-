'use client';

import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  Building2,
  Layers,
  Clock,
  ArrowRight,
  Layers3,
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
    courseOfferings,
    programs,
    departments,
    isLoadingCourses,
    coursesError,
    fetchCourses,
    fetchCourseOfferings,
    fetchPrograms,
    fetchDepartments,
    fetchCourseById,
    addCourse,
    updateCourse,
    deleteCourse,
    courseSearchQuery,
    courseProgramFilter,
    courseStandingFilter,
    courseDeptFilter,
    setCourseSearchQuery,
    setCourseProgramFilter,
    setCourseStandingFilter,
    setCourseDeptFilter,
  } = useAdminStore();

  // ── COURSES STATE ──────────────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = React.useState<Course | null>(null);
  const [detailedCourse, setDetailedCourse] = React.useState<Course | null>(null);
  const [, setIsLoadingDetail] = React.useState(false);

  const [courseFormData, setCourseFormData] = React.useState<{
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

  const [courseFieldErrors, setCourseFieldErrors] = React.useState<Record<string, string>>({});
  const [courseFormError, setCourseFormError] = React.useState<string | null>(null);
  const [isSubmittingCourse, setIsSubmittingCourse] = React.useState(false);
  const [isDeletingCourse, setIsDeletingCourse] = React.useState(false);
  const [coursePage, setCoursePage] = React.useState(1);
  const itemsPerPage = 10;

  // Initial Data Fetch
  React.useEffect(() => {
    void fetchCourses();
    void fetchCourseOfferings();
    void fetchPrograms();
    void fetchDepartments();
  }, [fetchCourses, fetchCourseOfferings, fetchPrograms, fetchDepartments]);

  // Department Resolver (safely checks Course -> Program -> Department)
  const getDepartmentName = React.useCallback(
    (course: Course): string => {
      if (course.programDetail?.department_detail?.name) {
        return course.programDetail.department_detail.name;
      }
      if (course.programDetail?.department) {
        const dept = departments.find((d) => d.id === course.programDetail?.department);
        if (dept?.name) return dept.name;
      }
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

  // ── COURSES HANDLERS ───────────────────────────────────────────────────────
  const handleOpenViewDetails = async (courseId: string) => {
    setIsLoadingDetail(true);
    try {
      const course = await fetchCourseById(courseId);
      setDetailedCourse(course);
    } catch {
      const found = courses.find((c) => c.id === courseId);
      if (found) setDetailedCourse(found);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleOpenAddModal = () => {
    setCourseFieldErrors({});
    setCourseFormError(null);
    setCourseFormData({
      code: '',
      title: '',
      creditHours: 3,
      programId: programs[0]?.id || '',
      intendedClassStanding: 'FRESHMAN',
    });
    setEditingCourse(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setCourseFieldErrors({});
    setCourseFormError(null);
    setEditingCourse(course);
    setCourseFormData({
      code: course.code,
      title: course.title || course.name,
      creditHours: course.creditHours,
      programId: course.program || course.programDetail?.id || '',
      intendedClassStanding: (course.intendedClassStanding as ClassStanding) || 'FRESHMAN',
    });
    setIsAddModalOpen(true);
  };

  const validateCourseForm = () => {
    const errors: Record<string, string> = {};
    if (!courseFormData.code.trim()) {
      errors.course_code = 'Course code is required.';
    } else if (courseFormData.code.length > 20) {
      errors.course_code = 'Course code must not exceed 20 characters.';
    }

    if (!courseFormData.title.trim()) {
      errors.title = 'Course title is required.';
    } else if (courseFormData.title.length > 255) {
      errors.title = 'Course title must not exceed 255 characters.';
    }

    if (Number(courseFormData.creditHours) < 0 || isNaN(Number(courseFormData.creditHours))) {
      errors.credit_hours = 'Credit hours must be a positive number.';
    }

    setCourseFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCourseForm()) return;

    setIsSubmittingCourse(true);
    setCourseFieldErrors({});
    setCourseFormError(null);

    const payload = {
      course_code: courseFormData.code.trim().toUpperCase(),
      title: courseFormData.title.trim(),
      credit_hours: Number(courseFormData.creditHours),
      program: courseFormData.programId ? courseFormData.programId : null,
      intended_class_standing: courseFormData.intendedClassStanding
        ? (courseFormData.intendedClassStanding as ClassStanding)
        : undefined,
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
        setCourseFieldErrors(parsedErrors);
      } else {
        setCourseFormError(getUserFriendlyErrorMessage(err));
      }
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    setIsDeletingCourse(true);
    try {
      await deleteCourse(deletingCourse.id);
      toast.success('Course deleted successfully.');
      setDeletingCourse(null);
    } catch {
      toast.error(
        'This course could not be deleted because it is currently referenced by another academic record (e.g. course offering or prerequisite).'
      );
    } finally {
      setIsDeletingCourse(false);
    }
  };

  // ── FILTERED DATA ──────────────────────────────────────────────────────────
  const filteredCourses = React.useMemo(() => {
    return courses.filter((c) => {
      if (courseSearchQuery.trim()) {
        const q = courseSearchQuery.toLowerCase().trim();
        const codeMatch = c.code.toLowerCase().includes(q);
        const nameMatch = (c.name || c.title || '').toLowerCase().includes(q);
        if (!codeMatch && !nameMatch) return false;
      }
      if (courseProgramFilter !== 'ALL') {
        const progId = c.program || c.programDetail?.id;
        if (progId !== courseProgramFilter) return false;
      }
      if (courseDeptFilter !== 'ALL') {
        const courseDeptId =
          c.programDetail?.department_detail?.id ||
          c.programDetail?.department ||
          programs.find((p) => p.id === (c.program || c.programDetail?.id))?.department;
        if (courseDeptId !== courseDeptFilter) return false;
      }
      if (courseStandingFilter !== 'ALL') {
        if (c.intendedClassStanding !== courseStandingFilter) return false;
      }
      return true;
    });
  }, [courses, courseSearchQuery, courseProgramFilter, courseDeptFilter, courseStandingFilter, programs]);

  const paginatedCourses = React.useMemo(() => {
    const start = (coursePage - 1) * itemsPerPage;
    return filteredCourses.slice(start, start + itemsPerPage);
  }, [filteredCourses, coursePage, itemsPerPage]);

  const courseTotalPages = Math.ceil(filteredCourses.length / itemsPerPage) || 1;

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Courses
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
              Master Curriculum
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the academic subjects available in each program.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/course-offerings">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <Layers3 className="h-4 w-4" />
              Course Offerings ({courseOfferings.length})
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void fetchCourses();
              void fetchPrograms();
              void fetchDepartments();
            }}
            disabled={isLoadingCourses}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingCourses ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleOpenAddModal}>
            Add New Course
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Master Courses</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{courses.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Master curriculum catalogue</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Assigned Programs</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {new Set(courses.map((c) => c.program || c.programDetail?.id).filter(Boolean)).size}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Degree curricula</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Foundation Courses</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {courses.filter((c) => c.intendedClassStanding === 'FRESHMAN').length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Freshman class standing</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Departments</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-600">{departments.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Academic departments</p>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 border-border space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <SearchInput
              placeholder="Search course title or code..."
              value={courseSearchQuery}
              onChange={(e) => {
                setCourseSearchQuery(e.target.value);
                setCoursePage(1);
              }}
              className="w-full"
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={courseProgramFilter}
              onChange={(e) => {
                setCourseProgramFilter(e.target.value);
                setCoursePage(1);
              }}
            >
              <option value="ALL">All Degree Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
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
                setCoursePage(1);
              }}
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
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
                setCoursePage(1);
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

      {/* Courses Table */}
      <Card className="overflow-hidden border-border">
        {isLoadingCourses ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <Clock className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
            Loading course catalog...
          </div>
        ) : coursesError ? (
          <div className="p-8 text-center text-sm text-destructive">
            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <p className="font-semibold">Error loading courses</p>
            <p className="text-xs text-muted-foreground mt-1">{coursesError}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => void fetchCourses()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Course Code</th>
                  <th className="px-4 py-3.5">Title</th>
                  <th className="px-4 py-3.5">Credit Hours</th>
                  <th className="px-4 py-3.5">Target Standing</th>
                  <th className="px-4 py-3.5">Degree Program</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedCourses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                      <p className="font-medium text-foreground">No courses found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {courseSearchQuery || courseProgramFilter !== 'ALL' || courseDeptFilter !== 'ALL' || courseStandingFilter !== 'ALL'
                          ? 'No courses match your active filter criteria.'
                          : 'No master courses created yet. Click "Add New Course" to create one.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedCourses.map((course) => {
                    const prog = getProgramDisplay(course);
                    const deptName = getDepartmentName(course);
                    return (
                      <tr key={course.id} className="hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary">
                          {course.code}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-foreground text-xs">
                          {course.title || course.name}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground font-semibold">
                          {course.creditHours} cr
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          {course.intendedClassStanding ? (
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                CLASS_STANDING_BADGES[course.intendedClassStanding as ClassStanding] || ''
                              }`}
                            >
                              {CLASS_STANDING_LABELS[course.intendedClassStanding as ClassStanding] ||
                                course.intendedClassStanding}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {prog.name}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {deptName}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => void handleOpenViewDetails(course.id)}
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleOpenEditModal(course)}
                              title="Edit Course"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => setDeletingCourse(course)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete Course"
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

        {filteredCourses.length > itemsPerPage && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>
              Showing {(coursePage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(coursePage * itemsPerPage, filteredCourses.length)} of {filteredCourses.length} courses
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={coursePage === 1}
                onClick={() => setCoursePage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={coursePage === courseTotalPages}
                onClick={() => setCoursePage((p) => Math.min(p + 1, courseTotalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── CREATE / EDIT COURSE DIALOG ────────────────────────────────────── */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {editingCourse ? 'Edit Master Course' : 'Create Master Course'}
            </DialogTitle>
            <DialogDescription>
              {editingCourse
                ? 'Update master curriculum course specifications.'
                : 'Add a new subject/curriculum course definition to the university master curriculum.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCourse}>
            <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
              {courseFormError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{courseFormError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="courseCodeInput" required>
                  Course Code
                </Label>
                <Input
                  id="courseCodeInput"
                  placeholder="e.g. SE301"
                  value={courseFormData.code}
                  onChange={(e) => {
                    setCourseFormData({ ...courseFormData, code: e.target.value });
                    if (courseFieldErrors.course_code) {
                      setCourseFieldErrors((prev) => ({ ...prev, course_code: '' }));
                    }
                  }}
                  className={courseFieldErrors.course_code ? 'border-destructive font-mono uppercase' : 'font-mono uppercase'}
                />
                {courseFieldErrors.course_code && (
                  <p className="text-xs text-destructive">{courseFieldErrors.course_code}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="courseTitleInput" required>
                  Course Title
                </Label>
                <Input
                  id="courseTitleInput"
                  placeholder="e.g. Database Systems"
                  value={courseFormData.title}
                  onChange={(e) => {
                    setCourseFormData({ ...courseFormData, title: e.target.value });
                    if (courseFieldErrors.title) {
                      setCourseFieldErrors((prev) => ({ ...prev, title: '' }));
                    }
                  }}
                  className={courseFieldErrors.title ? 'border-destructive' : ''}
                />
                {courseFieldErrors.title && (
                  <p className="text-xs text-destructive">{courseFieldErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="creditHoursInput" required>
                    Credit Hours
                  </Label>
                  <Input
                    id="creditHoursInput"
                    type="number"
                    min="0"
                    max="30"
                    value={courseFormData.creditHours}
                    onChange={(e) => {
                      setCourseFormData({ ...courseFormData, creditHours: Number(e.target.value) });
                      if (courseFieldErrors.credit_hours) {
                        setCourseFieldErrors((prev) => ({ ...prev, credit_hours: '' }));
                      }
                    }}
                    className={courseFieldErrors.credit_hours ? 'border-destructive' : ''}
                  />
                  {courseFieldErrors.credit_hours && (
                    <p className="text-xs text-destructive">{courseFieldErrors.credit_hours}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="standingSelect">Target Class Standing</Label>
                  <select
                    id="standingSelect"
                    className={selectClass}
                    value={courseFormData.intendedClassStanding}
                    onChange={(e) =>
                      setCourseFormData({
                        ...courseFormData,
                        intendedClassStanding: e.target.value as ClassStanding,
                      })
                    }
                  >
                    <option value="FRESHMAN">Freshman</option>
                    <option value="SOPHOMORE">Sophomore</option>
                    <option value="JUNIOR">Junior</option>
                    <option value="SENIOR">Senior</option>
                    <option value="GRADUATE">Graduate</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="programSelect">Degree Program (Optional)</Label>
                <select
                  id="programSelect"
                  className={selectClass}
                  value={courseFormData.programId}
                  onChange={(e) =>
                    setCourseFormData({ ...courseFormData, programId: e.target.value })
                  }
                >
                  <option value="">No Degree Program Assigned</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingCourse}>
                {isSubmittingCourse ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── VIEW COURSE DETAILS DIALOG ─────────────────────────────────────── */}
      {detailedCourse && (
        <Dialog open={!!detailedCourse} onOpenChange={() => setDetailedCourse(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Course Specifications
              </DialogTitle>
            </DialogHeader>

            <DialogBody className="space-y-4 py-3">
              <div className="border-b border-border pb-3">
                <p className="font-mono text-xs font-bold text-primary">{detailedCourse.code}</p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {detailedCourse.title || detailedCourse.name}
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-foreground">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Credit Hours:</span>
                  <span className="font-semibold">{detailedCourse.creditHours} hrs</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Target Standing:</span>
                  <span>{detailedCourse.intendedClassStanding || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Degree Program:</span>
                  <span className="font-medium">{getProgramDisplay(detailedCourse).name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{getDepartmentName(detailedCourse)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Created:</span>
                  <span>
                    {detailedCourse.createdAt
                      ? new Date(detailedCourse.createdAt).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailedCourse(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── DELETE COURSE CONFIRMATION DIALOG ──────────────────────────────── */}
      <ConfirmationDialog
        open={!!deletingCourse}
        onOpenChange={(open) => {
          if (!open) setDeletingCourse(null);
        }}
        onConfirm={handleDeleteCourse}
        title="Delete Master Course"
        description={`Are you sure you want to delete course "${deletingCourse?.code} - ${
          deletingCourse?.title || deletingCourse?.name
        }"? This action cannot be undone.`}
        confirmLabel="Delete Course"
        destructive
        loading={isDeletingCourse}
      />
    </div>
  );
}
