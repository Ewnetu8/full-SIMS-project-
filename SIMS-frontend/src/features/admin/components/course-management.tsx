'use client';

import {
  BookOpen,
  Plus,
  Edit2,
  Archive,
  RotateCcw,
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
  FormSelect,
  Input,
  SearchInput,
} from '@/components/ui';

import { useAdminStore } from '../store';

import type { Course } from '../types';

export function CourseManagement() {
  const {
    courses,
    departments,
    lecturers,
    programs,
    colleges,
    isLoadingCourses,
    courseSearchQuery,
    courseDeptFilter,
    fetchCourses,
    fetchPrograms,
    fetchColleges,
    fetchDepartments,
    addCourse,
    updateCourse,
    toggleCourseArchive,
    setCourseSearchQuery,
    setCourseDeptFilter,
    fetchAdminData,
    isLoadingData,
  } = useAdminStore();

  React.useEffect(() => {
    void fetchAdminData();
  }, [fetchAdminData]);

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [courseCollegeFilter, setCourseCollegeFilter] = React.useState<string>('ALL');

  const filteredDepartments = React.useMemo(() => {
    if (!courseCollegeFilter || courseCollegeFilter === 'ALL') return departments;
    return departments.filter(
      (d) =>
        d.college === courseCollegeFilter ||
        (colleges.find((c) => c.name === courseCollegeFilter || c.code === courseCollegeFilter)?.id === d.college)
    );
  }, [departments, colleges, courseCollegeFilter]);

  const formAvailableDepartments = React.useMemo(() => {
    if (!courseCollegeFilter) return departments;
    return departments;
  }, [departments, courseCollegeFilter]);

  const [formData, setFormData] = React.useState({
    code: '',
    title: '',
    creditHours: 3,
    departmentId: '',
    programId: '',
    intendedClassStanding: '',
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    fetchCourses();
    fetchPrograms();
    fetchColleges();
    fetchDepartments();
  }, [fetchCourses, fetchPrograms, fetchColleges, fetchDepartments]);

  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormData({
      code: '',
      title: '',
      creditHours: 3,
      departmentId: '',
      programId: '',
      intendedClassStanding: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setFieldErrors({});
    setEditingCourse(course);
    const courseProgram = programs.find((p) => p.id === course.program);
    setFormData({
      code: course.code,
      title: course.name,
      creditHours: course.creditHours,
      departmentId: courseProgram?.department || '',
      programId: course.program || '',
      intendedClassStanding: course.intendedClassStanding || '',
    });
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

    if (formData.creditHours < 0) {
      errors.credit_hours = 'Credit hours must be non-negative.';
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
          intended_class_standing: formData.intendedClassStanding || undefined,
        });
        toast.success('Course updated successfully.');
        setEditingCourse(null);
      } else {
        await addCourse({
          course_code: formData.code.trim().toUpperCase(),
          title: formData.title.trim(),
          credit_hours: Number(formData.creditHours),
          program: formData.programId ? formData.programId : undefined,
          intended_class_standing: formData.intendedClassStanding || undefined,
        });
        toast.success('Course created successfully.');
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      setFieldErrors(parseFieldErrors(err));
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleArchive = (course: Course) => {
    try {
      toggleCourseArchive(course.id);
      const isArchived = course.status === 'active';
      toast.success(`Course ${isArchived ? 'archived' : 'restored'} successfully.`);
    } catch (err: any) {
      toast.error(getUserFriendlyErrorMessage(err));
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(courseSearchQuery.toLowerCase());
    const matchesDept = courseDeptFilter === 'ALL' || c.department === courseDeptFilter;
    return matchesSearch && matchesDept;
  });

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
            Create, configure, and assign faculty lecturers to academic courses across all departments.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleOpenAddModal}>
          Create New Course
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
              value={courseCollegeFilter}
              onChange={(e) => {
                setCourseCollegeFilter(e.target.value);
                setCourseDeptFilter('ALL');
              }}
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
              value={courseDeptFilter}
              onChange={(e) => setCourseDeptFilter(e.target.value)}
            >
              <option value="ALL">All Academic Departments</option>
              {filteredDepartments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} ({d.code})
                </option>
              ))}
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
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Assigned Lecturer</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No courses match the current filters.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((crs) => (
                  <tr key={crs.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary">{crs.code}</td>
                    <td className="px-4 py-3.5 text-xs font-medium text-foreground">{crs.name}</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">{crs.creditHours} Cr.</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{crs.department}</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{crs.assignedLecturer?.name || '—'}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={crs.status === 'active' ? 'success' : 'secondary'} className="text-[11px]">
                        {crs.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleOpenEditModal(crs)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 ${crs.status === 'active' ? 'text-destructive' : 'text-success'}`}
                          onClick={() => handleToggleArchive(crs)}
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
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
              {editingCourse ? 'Edit Course Offering' : 'Register New Course Offering'}
            </DialogTitle>
            <DialogDescription>
              {editingCourse
                ? 'Modify the course curriculum metadata, credits, and prerequisites.'
                : 'Add a new academic course offering into the university curriculum registry.'}
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
                <Label htmlFor="courseDepartment">
                  Filter by Department (Optional)
                </Label>
                <select
                  id="courseDepartment"
                  className={`${selectClass} mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50`}
                  value={formData.departmentId}
                  onChange={(e) => {
                    const deptId = e.target.value;
                    setFormData({
                      ...formData,
                      departmentId: deptId,
                    });
                  }}
                >
                  <option value="">-- All Departments --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="programId">Program (Optional)</Label>
                <select
                  id="programId"
                  className={`${selectClass} mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50`}
                  value={formData.programId}
                  onChange={(e) => {
                    const progId = e.target.value;
                    const prog = programs.find((p) => p.id === progId);
                    setFormData({
                      ...formData,
                      programId: progId,
                      ...(prog?.department ? { departmentId: prog.department } : {}),
                    });
                  }}
                >
                  <option value="">-- Unassigned Program --</option>
                  {programs
                    .filter((p) => !formData.departmentId || p.department === formData.departmentId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                </select>
                {fieldErrors.program && <p className="text-xs text-destructive mt-1">{fieldErrors.program}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="classStanding">Intended Class Standing</Label>
                <select
                  id="classStanding"
                  className={`${selectClass} mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50`}
                  value={formData.intendedClassStanding}
                  onChange={(e) => setFormData({ ...formData, intendedClassStanding: e.target.value })}
                >
                  <option value="">-- Not Specified --</option>
                  <option value="FRESHMAN">Freshman</option>
                  <option value="SOPHOMORE">Sophomore</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="SENIOR">Senior</option>
                  <option value="GRADUATE">Graduate</option>
                </select>
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
                'Create Course'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
