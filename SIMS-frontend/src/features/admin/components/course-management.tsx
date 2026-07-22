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
  Input,
  SearchInput,
} from '@/components/ui';
import { Label } from '@/components/forms';
import { useAdminStore } from '../store';
import type { Course } from '../types';

export function CourseManagement() {
  const {
    courses,
    departments,
    lecturers,
    courseSearchQuery,
    courseDeptFilter,
    addCourse,
    updateCourse,
    toggleCourseArchive,
    setCourseSearchQuery,
    setCourseDeptFilter,
  } = useAdminStore();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null);

  const [formData, setFormData] = React.useState({
    code: '',
    name: '',
    creditHours: 3,
    department: departments[0]?.name || 'Computer Science & Software Engineering',
    lecturerId: lecturers[0]?.id || '',
    semester: 'Spring 2026',
  });

  const handleOpenAddModal = () => {
    setFormData({
      code: '',
      name: '',
      creditHours: 3,
      department: departments[0]?.name || 'Computer Science & Software Engineering',
      lecturerId: lecturers[0]?.id || '',
      semester: 'Spring 2026',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      creditHours: course.creditHours,
      department: course.department,
      lecturerId: course.assignedLecturer.id,
      semester: course.semester,
    });
  };

  const handleSaveCourse = () => {
    if (!formData.code || !formData.name) {
      toast.error('Missing fields', { description: 'Course code and title are required.' });
      return;
    }

    const assignedLec = lecturers.find((l) => l.id === formData.lecturerId) || lecturers[0];

    if (editingCourse) {
      updateCourse(editingCourse.id, {
        code: formData.code.toUpperCase(),
        name: formData.name,
        creditHours: formData.creditHours,
        department: formData.department,
        assignedLecturer: {
          id: assignedLec ? assignedLec.id : 'lec-1',
          name: assignedLec ? `Dr. ${assignedLec.firstName} ${assignedLec.lastName}` : 'Dr. Robert Vance',
        },
        semester: formData.semester,
      });
      toast.success('Course updated', { description: `${formData.code} - ${formData.name} updated.` });
      setEditingCourse(null);
    } else {
      addCourse({
        code: formData.code.toUpperCase(),
        name: formData.name,
        creditHours: formData.creditHours,
        department: formData.department,
        assignedLecturer: {
          id: assignedLec?.id || 'lec-1',
          name: assignedLec ? `Dr. ${assignedLec.firstName} ${assignedLec.lastName}` : 'Dr. Robert Vance',
        },
        status: 'active',
        semester: formData.semester,
      });
      toast.success('Course created', { description: `${formData.code} created.` });
      setIsAddModalOpen(false);
    }
  };

  const handleToggleArchive = (course: Course) => {
    toggleCourseArchive(course.id);
    const isArchived = course.status === 'active';
    toast.success(`Course ${isArchived ? 'archived' : 'restored'}`, {
      description: `${course.code} is now ${isArchived ? 'archived' : 'active'}.`,
    });
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
            <BookOpen className="h-6 w-6 text-emerald-500" /> Course Catalogue & Management
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
              value={courseDeptFilter}
              onChange={(e) => setCourseDeptFilter(e.target.value)}
            >
              <option value="ALL">All Academic Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
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
                <th className="px-4 py-3.5">Enrolled</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No courses match the specified filter conditions.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((crs) => (
                  <tr key={crs.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-emerald-500">{crs.code}</td>
                    <td className="px-4 py-3.5 font-semibold text-foreground">{crs.name}</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{crs.creditHours} Hrs</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[180px] truncate">{crs.department}</td>
                    <td className="px-4 py-3.5 text-xs text-foreground font-medium">{crs.assignedLecturer.name}</td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-foreground">{crs.studentCount} Students</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={crs.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                        {crs.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(crs)}>
                        <Edit2 className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleArchive(crs)}>
                        {crs.status === 'active' ? (
                          <>
                            <Archive className="h-4 w-4 mr-1 text-amber-500" /> Archive
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-1 text-emerald-500" /> Restore
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Course Modal */}
      <Dialog
        open={isAddModalOpen || !!editingCourse}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingCourse(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course Details' : 'Create New Course'}</DialogTitle>
            <DialogDescription>
              {editingCourse ? 'Update course metadata and instructor assignments.' : 'Define a new course offer for student registration.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="crsCode">Code</Label>
                <Input
                  id="crsCode"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. CS301"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="crsTitle">Course Title</Label>
                <Input
                  id="crsTitle"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Advanced Data Structures"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="credits">Credit Hours</Label>
                <Input
                  id="credits"
                  type="number"
                  min={1}
                  max={6}
                  value={formData.creditHours}
                  onChange={(e) => setFormData({ ...formData, creditHours: parseInt(e.target.value) || 3 })}
                />
              </div>
              <div>
                <Label htmlFor="semester">Semester</Label>
                <Input
                  id="semester"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="crsDept">Department</Label>
              <select
                id="crsDept"
                className={selectClass}
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="crsLec">Assigned Lecturer</Label>
              <select
                id="crsLec"
                className={selectClass}
                value={formData.lecturerId}
                onChange={(e) => setFormData({ ...formData, lecturerId: e.target.value })}
              >
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    Dr. {l.firstName} {l.lastName} ({l.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingCourse(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCourse}>
              {editingCourse ? 'Save Changes' : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
