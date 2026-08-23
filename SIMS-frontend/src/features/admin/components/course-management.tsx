'use client';

import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import * as React from 'react';

import { toast } from '@/components/feedback';
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';
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

import { useAdminStore } from '../store';

import type { Course, ClassStanding } from '../types';

const CLASS_STANDING_LABELS: Record<ClassStanding, string> = {
  FRESHMAN: 'Freshman',
  SOPHOMORE: 'Sophomore',
  JUNIOR: 'Junior',
  SENIOR: 'Senior',
  GRADUATE: 'Graduate',
};

export function CourseManagement() {
  const {
    courses,
    programs,
    isLoadingCourses,
    courseSearchQuery,
    courseProgramFilter,
    courseStandingFilter,
    fetchCourses,
    fetchPrograms,
    addCourse,
    updateCourse,
    deleteCourse,
    setCourseSearchQuery,
    setCourseProgramFilter,
    setCourseStandingFilter,
  } = useAdminStore();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = React.useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

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

  React.useEffect(() => {
    void fetchCourses();
    void fetchPrograms();
  }, [fetchCourses, fetchPrograms]);

  // Helper to resolve Program Name
  const getProgramName = React.useCallback(
    (course: Course): string => {
      if (course.programDetail?.name) {
        return course.programDetail.name;
      }
      if (course.program) {
        const matched = programs.find((p) => p.id === course.program);
        if (matched?.name) return matched.name;
      }
      return 'Unassigned';
    },
    [programs]
  );

  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormData({
      code: '',
      title: '',
      creditHours: 3,
      programId: '',
      intendedClassStanding: 'FRESHMAN',
    });
    setEditingCourse(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setFieldErrors({});
    setEditingCourse(course);
    setFormData({
      code: course.code,
      title: course.name,
      creditHours: course.creditHours,
      programId: course.program || course.programDetail?.id || '',
      intendedClassStanding: course.intendedClassStanding || '',
    });
    setIsAddModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.code.trim()) {
      errors.code = 'Course code is required.';
    } else if (formData.code.length > 20) {
      errors.code = 'Course code must not exceed 20 characters.';
    }

    if (!formData.title.trim()) {
      errors.title = 'Course title is required.';
    } else if (formData.title.length > 255) {
      errors.title = 'Course title must not exceed 255 characters.';
    }

    if (Number(formData.creditHours) < 0 || isNaN(Number(formData.creditHours))) {
      errors.credit_hours = 'Credit hours must be a non-negative number.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCourse = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, {
          course_code: formData.code.trim().toUpperCase(),
          title: formData.title.trim(),
          credit_hours: Number(formData.creditHours),
          program: formData.programId ? formData.programId : null,
          intended_class_standing: formData.intendedClassStanding ? (formData.intendedClassStanding as ClassStanding) : undefined,
        });
        toast.success('Course updated successfully.');
        setEditingCourse(null);
        setIsAddModalOpen(false);
      } else {
        await addCourse({
          course_code: formData.code.trim().toUpperCase(),
          title: formData.title.trim(),
          credit_hours: Number(formData.creditHours),
          program: formData.programId ? formData.programId : null,
          intended_class_standing: formData.intendedClassStanding ? (formData.intendedClassStanding as ClassStanding) : undefined,
        });
        toast.success('Course created successfully.');
        setIsAddModalOpen(false);
      }
      void fetchCourses();
    } catch (err: unknown) {
      setFieldErrors(parseFieldErrors(err));
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    setIsDeleting(true);
    try {
      await deleteCourse(deletingCourse.id);
      toast.success('Course deleted successfully.');
      setDeletingCourse(null);
      void fetchCourses();
    } catch (err: unknown) {
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCourses = React.useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(courseSearchQuery.toLowerCase());

      const matchesProgram =
        courseProgramFilter === 'ALL' ||
        c.program === courseProgramFilter ||
        c.programDetail?.id === courseProgramFilter;

      const matchesStanding =
        courseStandingFilter === 'ALL' ||
        c.intendedClassStanding === courseStandingFilter;

      return matchesSearch && matchesProgram && matchesStanding;
    });
  }, [
    courses,
    courseSearchQuery,
    courseProgramFilter,
    courseStandingFilter,
  ]);

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-success" /> Course Catalogue & Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, configure, and manage academic courses across curriculum programs.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleOpenAddModal}>
          Register New Course
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <SearchInput
              placeholder="Search course title or code..."
              value={courseSearchQuery}
              onChange={(e) => setCourseSearchQuery(e.target.value)}
              onClear={() => setCourseSearchQuery('')}
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={courseProgramFilter}
              onChange={(e) => setCourseProgramFilter(e.target.value)}
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
              value={courseStandingFilter}
              onChange={(e) => setCourseStandingFilter(e.target.value)}
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
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Course Code</th>
                <th className="px-4 py-3.5">Course Title</th>
                <th className="px-4 py-3.5">Credits</th>
                <th className="px-4 py-3.5">Program</th>
                <th className="px-4 py-3.5">Intended Class Standing</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingCourses ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>Loading courses...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {courses.length === 0 ? 'No courses found.' : 'No courses match the current filters.'}
                  </td>
                </tr>
              ) : (
                filteredCourses.map((crs) => {
                  const programDisplay = getProgramName(crs);
                  const standingDisplay = crs.intendedClassStanding
                    ? CLASS_STANDING_LABELS[crs.intendedClassStanding] || crs.intendedClassStanding
                    : '—';

                  return (
                    <tr key={crs.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary">{crs.code}</td>
                      <td className="px-4 py-3.5 text-xs font-medium text-foreground">{crs.name}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">{crs.creditHours} Cr.</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {programDisplay === 'Unassigned' ? (
                          <span className="italic text-muted-foreground/60">Unassigned</span>
                        ) : (
                          programDisplay
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {crs.intendedClassStanding ? (
                          <Badge variant="outline" className="text-[11px] font-normal">
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
                            className="h-7 w-7 p-0"
                            onClick={() => handleOpenEditModal(crs)}
                            aria-label="Edit course"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingCourse(crs)}
                            aria-label="Delete course"
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
      </Card>

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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#102A7A] dark:text-foreground font-bold">
              {editingCourse ? 'Edit Course' : 'Register New Course'}
            </DialogTitle>
            <DialogDescription>
              {editingCourse
                ? 'Update academic course details, credits, program, and intended class standing.'
                : 'Add a new academic course into the university curriculum registry.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="crsCode" required>
                  Course Code
                </Label>
                <Input
                  id="crsCode"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. SE4201"
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50 font-mono"
                  maxLength={20}
                />
                {fieldErrors.code && <p className="text-xs text-destructive mt-1">{fieldErrors.code}</p>}
              </div>

              <div>
                <Label htmlFor="crsTitle" required>
                  Course Title
                </Label>
                <Input
                  id="crsTitle"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                  maxLength={255}
                />
                {fieldErrors.title && <p className="text-xs text-destructive mt-1">{fieldErrors.title}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="programId">Program (Optional)</Label>
                <select
                  id="programId"
                  className={`${selectClass} mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50`}
                  value={formData.programId}
                  onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                >
                  <option value="">-- Unassigned Program --</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
                {fieldErrors.program && <p className="text-xs text-destructive mt-1">{fieldErrors.program}</p>}
              </div>

              <div>
                <Label htmlFor="classStanding">Intended Class Standing</Label>
                <select
                  id="classStanding"
                  className={`${selectClass} mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50`}
                  value={formData.intendedClassStanding}
                  onChange={(e) => setFormData({ ...formData, intendedClassStanding: e.target.value as ClassStanding | '' })}
                >
                  <option value="">-- Not Specified --</option>
                  <option value="FRESHMAN">Freshman</option>
                  <option value="SOPHOMORE">Sophomore</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="SENIOR">Senior</option>
                  <option value="GRADUATE">Graduate</option>
                </select>
                {fieldErrors.intended_class_standing && (
                  <p className="text-xs text-destructive mt-1">{fieldErrors.intended_class_standing}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="credits" required>
                Credit Hours
              </Label>
              <Input
                id="credits"
                type="number"
                min={0}
                value={formData.creditHours}
                onChange={(e) => setFormData({ ...formData, creditHours: parseInt(e.target.value) || 0 })}
                className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
              />
              {fieldErrors.credit_hours && <p className="text-xs text-destructive mt-1">{fieldErrors.credit_hours}</p>}
            </div>
          </DialogBody>

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingCourse(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCourse}
              disabled={isSubmitting}
              className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-medium px-5"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </span>
              ) : editingCourse ? (
                'Save Changes'
              ) : (
                'Register Course'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Course Confirmation Dialog */}
      <Dialog
        open={!!deletingCourse}
        onOpenChange={(open) => {
          if (!open) setDeletingCourse(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">Delete Course</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Are you sure you want to delete course{' '}
              <span className="font-semibold text-foreground">
                {deletingCourse?.code} - {deletingCourse?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setDeletingCourse(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
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
