'use client';

import {
  GitFork,
  Plus,
  Trash2,
  Eye,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
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
  SearchInput,
} from '@/components/ui';
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';

import { useAdminStore } from '../store';

import type { Course, CoursePrerequisite, CourseOfferingDetailCourse } from '../types';

export function CoursePrerequisiteManagement() {
  const {
    courses,
    coursePrerequisites,
    isLoadingCourses,
    isLoadingCoursePrerequisites,
    coursePrerequisitesError,
    coursePrerequisiteSearchQuery,
    fetchCourses,
    fetchCoursePrerequisites,
    addCoursePrerequisite,
    deleteCoursePrerequisite,
    setCoursePrerequisiteSearchQuery,
  } = useAdminStore();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedPrereqForDetails, setSelectedPrereqForDetails] = React.useState<CoursePrerequisite | null>(null);
  const [deletingPrereq, setDeletingPrereq] = React.useState<CoursePrerequisite | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState<{
    course: string;
    prerequisite_course: string;
  }>({
    course: '',
    prerequisite_course: '',
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Initial Data Fetch
  React.useEffect(() => {
    void fetchCoursePrerequisites();
    if (courses.length === 0) {
      void fetchCourses();
    }
  }, [fetchCoursePrerequisites, fetchCourses, courses.length]);

  // Helper to extract course code and title regardless of structure
  const getCourseInfo = React.useCallback(
    (
      courseId: string,
      detailObj?: Course | CourseOfferingDetailCourse | Record<string, unknown> | null
    ): { code: string; title: string; creditHours?: number; standing?: string } => {
      if (detailObj) {
        const code =
          (detailObj as Course).code ||
          (detailObj as Record<string, unknown>).course_code ||
          '';
        const title =
          (detailObj as Course).name ||
          (detailObj as Course).title ||
          (detailObj as Record<string, unknown>).name ||
          (detailObj as Record<string, unknown>).title ||
          '';
        const creditHours =
          (detailObj as Course).creditHours ??
          (detailObj as Record<string, unknown>).credit_hours as number | undefined;
        const standing =
          (detailObj as Course).intendedClassStanding ||
          (detailObj as Record<string, unknown>).intended_class_standing as string | undefined;

        if (code || title) {
          return {
            code: String(code || 'N/A'),
            title: String(title || 'Untitled Course'),
            creditHours: typeof creditHours === 'number' ? creditHours : undefined,
            standing: standing ? String(standing) : undefined,
          };
        }
      }

      // Fallback: search in loaded courses list
      const matched = courses.find((c) => c.id === courseId);
      if (matched) {
        return {
          code: matched.code,
          title: matched.name || matched.title || 'Untitled Course',
          creditHours: matched.creditHours,
          standing: matched.intendedClassStanding,
        };
      }

      return {
        code: 'Course',
        title: courseId ? `ID: ${courseId.substring(0, 8)}...` : 'Unknown Course',
      };
    },
    [courses]
  );

  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormError(null);
    setFormData({
      course: '',
      prerequisite_course: '',
    });
    setIsAddModalOpen(true);
    if (courses.length === 0) {
      void fetchCourses();
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    setFormError(null);

    if (!formData.course || !formData.course.trim()) {
      errors.course = 'Please select the target course.';
    }

    if (!formData.prerequisite_course || !formData.prerequisite_course.trim()) {
      errors.prerequisite_course = 'Please select the prerequisite course.';
    }

    // Prevent Same-Course Selection (Requirement 15)
    if (
      formData.course &&
      formData.prerequisite_course &&
      formData.course.trim() === formData.prerequisite_course.trim()
    ) {
      errors.prerequisite_course = 'A course cannot be a prerequisite of itself.';
      setFormError('A course cannot require itself as a prerequisite.');
    }

    // Duplicate Handling (Requirement 16)
    if (
      formData.course &&
      formData.prerequisite_course &&
      formData.course.trim() !== formData.prerequisite_course.trim()
    ) {
      const isDuplicate = coursePrerequisites.some(
        (cp) =>
          cp.course === formData.course.trim() &&
          cp.prerequisite_course === formData.prerequisite_course.trim()
      );
      if (isDuplicate) {
        setFormError('This prerequisite relationship already exists in the curriculum.');
        errors.prerequisite_course = 'This relationship has already been established.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePrerequisite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      await addCoursePrerequisite({
        course: formData.course.trim(),
        prerequisite_course: formData.prerequisite_course.trim(),
      });
      toast.success('Course prerequisite added successfully.');
      setIsAddModalOpen(false);
      void fetchCoursePrerequisites();
    } catch (err: unknown) {
      const parsedErrors = parseFieldErrors(err);
      setFieldErrors(parsedErrors);
      const friendlyMsg = getUserFriendlyErrorMessage(err);
      setFormError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePrerequisite = async () => {
    if (!deletingPrereq) return;
    setIsDeleting(true);
    try {
      await deleteCoursePrerequisite(deletingPrereq.id);
      toast.success('Prerequisite relationship removed successfully.');
      setDeletingPrereq(null);
      void fetchCoursePrerequisites();
    } catch (err: unknown) {
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  // Search Filtering
  const filteredPrerequisites = React.useMemo(() => {
    const q = coursePrerequisiteSearchQuery.toLowerCase().trim();
    if (!q) return coursePrerequisites;

    return coursePrerequisites.filter((cp) => {
      const targetCourse = getCourseInfo(cp.course, cp.course_detail);
      const prereqCourse = getCourseInfo(cp.prerequisite_course, cp.prerequisite_course_detail);

      const targetMatch =
        targetCourse.code.toLowerCase().includes(q) ||
        targetCourse.title.toLowerCase().includes(q);

      const prereqMatch =
        prereqCourse.code.toLowerCase().includes(q) ||
        prereqCourse.title.toLowerCase().includes(q);

      return targetMatch || prereqMatch;
    });
  }, [coursePrerequisites, coursePrerequisiteSearchQuery, getCourseInfo]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredPrerequisites.length / itemsPerPage);
  const paginatedPrerequisites = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPrerequisites.slice(start, start + itemsPerPage);
  }, [filteredPrerequisites, currentPage, itemsPerPage]);

  const selectClass =
    'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-hidden focus:ring-2 focus:ring-ring text-foreground transition-all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <GitFork className="h-6 w-6 text-[#102A7A] dark:text-[#D4AF37]" /> Course Prerequisites
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage prerequisite relationships between courses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void fetchCoursePrerequisites();
              void fetchCourses();
            }}
            disabled={isLoadingCoursePrerequisites}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoadingCoursePrerequisites ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleOpenAddModal}
            className="bg-[#102A7A] text-white hover:bg-[#102A7A]/90 dark:bg-[#D4AF37] dark:text-[#102A7A] dark:hover:bg-[#D4AF37]/90 font-medium shadow-xs"
          >
            Add Prerequisite
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border-border/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <SearchInput
              placeholder="Search by course code, course title, or prerequisite course..."
              value={coursePrerequisiteSearchQuery}
              onChange={(e) => {
                setCoursePrerequisiteSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => {
                setCoursePrerequisiteSearchQuery('');
                setCurrentPage(1);
              }}
            />
          </div>
          {filteredPrerequisites.length > 0 && (
            <div className="text-xs text-muted-foreground shrink-0 font-medium">
              Showing {paginatedPrerequisites.length} of {filteredPrerequisites.length} rule{filteredPrerequisites.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
      </Card>

      {/* Error state if query failed */}
      {coursePrerequisitesError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{coursePrerequisitesError}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchCoursePrerequisites()}
            className="border-destructive/30 hover:bg-destructive/20 text-destructive text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Prerequisites Table */}
      <Card className="overflow-hidden border-border/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Course (Target)</th>
                <th className="px-4 py-3.5 text-center w-12"></th>
                <th className="px-4 py-3.5">Prerequisite Course (Required)</th>
                <th className="px-4 py-3.5">Created Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingCoursePrerequisites ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#102A7A] dark:border-[#D4AF37] border-t-transparent" />
                      <span className="font-medium text-foreground">Loading course prerequisites...</span>
                      <span className="text-xs text-muted-foreground">Fetching academic relationship rules</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPrerequisites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <GitFork className="h-6 w-6" />
                      </div>
                      {coursePrerequisites.length === 0 ? (
                        <>
                          <h3 className="text-base font-semibold text-foreground">No course prerequisites found</h3>
                          <p className="text-xs text-muted-foreground text-center">
                            Start by adding a prerequisite relationship between two courses in the academic curriculum.
                          </p>
                          <Button
                            leftIcon={<Plus className="h-4 w-4" />}
                            onClick={handleOpenAddModal}
                            className="mt-2 bg-[#102A7A] text-white hover:bg-[#102A7A]/90 dark:bg-[#D4AF37] dark:text-[#102A7A] text-xs font-medium"
                          >
                            Add Prerequisite
                          </Button>
                        </>
                      ) : (
                        <>
                          <h3 className="text-base font-semibold text-foreground">No matching prerequisites found</h3>
                          <p className="text-xs text-muted-foreground text-center">
                            No prerequisite relationships matched &quot;{coursePrerequisiteSearchQuery}&quot;. Try clearing your search.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCoursePrerequisiteSearchQuery('')}
                            className="mt-2 text-xs"
                          >
                            Clear Search
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPrerequisites.map((cp) => {
                  const targetCourse = getCourseInfo(cp.course, cp.course_detail);
                  const prereqCourse = getCourseInfo(cp.prerequisite_course, cp.prerequisite_course_detail);

                  const formattedDate = cp.created_at || cp.createdAt
                    ? new Date(cp.created_at || cp.createdAt || '').toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={cp.id} className="hover:bg-accent/40 transition-colors group">
                      {/* Target Course */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs font-semibold bg-primary/5 text-primary border-primary/20">
                              {targetCourse.code}
                            </Badge>
                            {targetCourse.creditHours !== undefined && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {targetCourse.creditHours} Cr.
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-medium text-foreground line-clamp-1">
                            {targetCourse.title}
                          </span>
                        </div>
                      </td>

                      {/* Arrow Relationship */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center justify-center p-1.5 rounded-full bg-muted/60 text-muted-foreground">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </td>

                      {/* Required Prerequisite Course */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            >
                              {prereqCourse.code}
                            </Badge>
                            {prereqCourse.creditHours !== undefined && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {prereqCourse.creditHours} Cr.
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-medium text-foreground line-clamp-1">
                            {prereqCourse.title}
                          </span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Actions (Inspect + Delete only - NO edit button as per specification) */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => setSelectedPrereqForDetails(cp)}
                            aria-label="View prerequisite details"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingPrereq(cp)}
                            aria-label="Delete prerequisite"
                            title="Delete Prerequisite"
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Prerequisite Modal (Requirement 12, 13, 14, 15, 16) */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#102A7A] dark:text-foreground font-bold flex items-center gap-2">
              <GitFork className="h-5 w-5 text-[#102A7A] dark:text-[#D4AF37]" /> Create Course Prerequisite
            </DialogTitle>
            <DialogDescription>
              Specify a course and the required prerequisite course students must complete before enrolling.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePrerequisite}>
            <DialogBody className="space-y-4 py-3">
              {formError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Course Selector (Target Course) */}
              <div>
                <Label htmlFor="targetCourseSelect" required>
                  Course (Target Course)
                </Label>
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  The course that requires a prerequisite.
                </p>
                <select
                  id="targetCourseSelect"
                  className={`${selectClass} ${
                    fieldErrors.course ? 'border-destructive focus:ring-destructive' : 'focus:border-[#102A7A] focus:ring-[#D4AF37]/50'
                  }`}
                  value={formData.course}
                  onChange={(e) => {
                    setFormData({ ...formData, course: e.target.value });
                    if (fieldErrors.course) {
                      setFieldErrors((prev) => ({ ...prev, course: '' }));
                    }
                  }}
                  disabled={isLoadingCourses || isSubmitting}
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((crs) => (
                    <option key={crs.id} value={crs.id}>
                      {crs.code} - {crs.name || crs.title} ({crs.creditHours} Cr.)
                    </option>
                  ))}
                </select>
                {fieldErrors.course && (
                  <p className="text-xs text-destructive mt-1 font-medium">{fieldErrors.course}</p>
                )}
              </div>

              {/* Prerequisite Course Selector */}
              <div>
                <Label htmlFor="prereqCourseSelect" required>
                  Prerequisite Course (Must be taken prior)
                </Label>
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  The prerequisite course that must be completed first.
                </p>
                <select
                  id="prereqCourseSelect"
                  className={`${selectClass} ${
                    fieldErrors.prerequisite_course
                      ? 'border-destructive focus:ring-destructive'
                      : 'focus:border-[#102A7A] focus:ring-[#D4AF37]/50'
                  }`}
                  value={formData.prerequisite_course}
                  onChange={(e) => {
                    setFormData({ ...formData, prerequisite_course: e.target.value });
                    if (fieldErrors.prerequisite_course) {
                      setFieldErrors((prev) => ({ ...prev, prerequisite_course: '' }));
                    }
                  }}
                  disabled={isLoadingCourses || isSubmitting}
                >
                  <option value="">-- Select Prerequisite Course --</option>
                  {courses.map((crs) => (
                    <option key={crs.id} value={crs.id}>
                      {crs.code} - {crs.name || crs.title} ({crs.creditHours} Cr.)
                    </option>
                  ))}
                </select>
                {fieldErrors.prerequisite_course && (
                  <p className="text-xs text-destructive mt-1 font-medium">{fieldErrors.prerequisite_course}</p>
                )}
              </div>

              {/* Visual Relationship Preview */}
              {formData.course && formData.prerequisite_course && formData.course !== formData.prerequisite_course && (
                <div className="p-3 bg-muted/50 rounded-lg border border-border/80 text-xs">
                  <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1 text-[11px]">
                    <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" /> Relationship Rule Preview:
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {getCourseInfo(formData.prerequisite_course).code}
                    </span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-bold text-primary">
                      {getCourseInfo(formData.course).code}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Students must pass {getCourseInfo(formData.prerequisite_course).code} before enrolling in {getCourseInfo(formData.course).code}.
                  </p>
                </div>
              )}
            </DialogBody>

            <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoadingCourses}
                className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-medium px-5"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Adding...
                  </span>
                ) : (
                  'Add Prerequisite'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inspect Details Modal (Requirement 19) */}
      <Dialog
        open={!!selectedPrereqForDetails}
        onOpenChange={(open) => {
          if (!open) setSelectedPrereqForDetails(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Prerequisite Relationship Details
            </DialogTitle>
            <DialogDescription>
              Complete rule specification between prerequisite and dependent course.
            </DialogDescription>
          </DialogHeader>

          {selectedPrereqForDetails && (() => {
            const target = getCourseInfo(selectedPrereqForDetails.course, selectedPrereqForDetails.course_detail);
            const prereq = getCourseInfo(selectedPrereqForDetails.prerequisite_course, selectedPrereqForDetails.prerequisite_course_detail);

            return (
              <DialogBody className="space-y-4 py-2">
                {/* Visual Flow Banner */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                    Enforcement Sequence
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="px-3 py-2 bg-background border border-amber-500/30 rounded-lg shadow-2xs text-center">
                      <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        {prereq.code}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Prerequisite</div>
                    </div>

                    <ArrowRight className="h-5 w-5 text-primary shrink-0" />

                    <div className="px-3 py-2 bg-background border border-primary/30 rounded-lg shadow-2xs text-center">
                      <div className="text-xs font-mono font-bold text-primary">
                        {target.code}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Target Course</div>
                    </div>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Prerequisite Course Card */}
                  <div className="p-3.5 rounded-lg border border-border bg-card space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <GraduationCap className="h-4 w-4" /> Required Prerequisite
                    </div>
                    <div className="font-mono text-sm font-bold text-foreground">{prereq.code}</div>
                    <div className="text-xs text-muted-foreground font-medium">{prereq.title}</div>
                    {prereq.creditHours !== undefined && (
                      <div className="text-[11px] text-muted-foreground font-mono">
                        Credits: {prereq.creditHours}
                      </div>
                    )}
                    {prereq.standing && (
                      <div className="text-[11px] text-muted-foreground">
                        Standing: {prereq.standing}
                      </div>
                    )}
                  </div>

                  {/* Target Course Card */}
                  <div className="p-3.5 rounded-lg border border-border bg-card space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <BookOpen className="h-4 w-4" /> Target Dependent Course
                    </div>
                    <div className="font-mono text-sm font-bold text-foreground">{target.code}</div>
                    <div className="text-xs text-muted-foreground font-medium">{target.title}</div>
                    {target.creditHours !== undefined && (
                      <div className="text-[11px] text-muted-foreground font-mono">
                        Credits: {target.creditHours}
                      </div>
                    )}
                    {target.standing && (
                      <div className="text-[11px] text-muted-foreground">
                        Standing: {target.standing}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamps & Identifiers */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" /> Relationship ID:
                    </span>
                    <span className="font-mono text-[11px]">{selectedPrereqForDetails.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Created At:
                    </span>
                    <span className="font-mono text-[11px]">
                      {selectedPrereqForDetails.created_at || selectedPrereqForDetails.createdAt || 'N/A'}
                    </span>
                  </div>
                </div>
              </DialogBody>
            );
          })()}

          <DialogFooter className="pt-3 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setSelectedPrereqForDetails(null)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog (Requirement 17) */}
      <Dialog
        open={!!deletingPrereq}
        onOpenChange={(open) => {
          if (!open) setDeletingPrereq(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <DialogTitle className="text-lg font-bold">Delete Prerequisite?</DialogTitle>
            </div>
            {deletingPrereq && (() => {
              const target = getCourseInfo(deletingPrereq.course, deletingPrereq.course_detail);
              const prereq = getCourseInfo(deletingPrereq.prerequisite_course, deletingPrereq.prerequisite_course_detail);

              return (
                <div className="pt-2 text-sm text-muted-foreground space-y-3">
                  <p>Are you sure you want to remove this prerequisite relationship?</p>

                  <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-xs space-y-1 font-medium text-foreground">
                    <div className="font-semibold text-destructive">
                      {target.code} — {target.title}
                    </div>
                    <div className="text-muted-foreground text-[11px] italic">requires</div>
                    <div className="font-semibold text-amber-600 dark:text-amber-400">
                      {prereq.code} — {prereq.title}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    This action cannot be undone. Students will no longer be restricted by this requirement during course enrollment.
                  </p>
                </div>
              );
            })()}
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setDeletingPrereq(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePrerequisite}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </span>
              ) : (
                'Delete Prerequisite'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
