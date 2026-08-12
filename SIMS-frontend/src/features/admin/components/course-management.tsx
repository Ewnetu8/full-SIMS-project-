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
import { COLLEGES, getDepartmentsByCollege } from '@/constants';

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
    fetchAdminData,
    isLoadingData,
  } = useAdminStore();

  React.useEffect(() => {
    void fetchAdminData();
  }, [fetchAdminData]);

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null);
  const [courseCollegeFilter, setCourseCollegeFilter] = React.useState<string>('ALL');

  const [formData, setFormData] = React.useState({
    code: '',
    name: '',
    creditHours: 3,
    college: 'College of Engineering',
    department: 'Software Engineering',
    lecturerId: lecturers[0]?.id || '',
    semester: 'Spring 2026',
  });

  const handleOpenAddModal = () => {
    const defaultCol = 'College of Engineering';
    const depts = getDepartmentsByCollege(defaultCol);
    setFormData({
      code: '',
      name: '',
      creditHours: 3,
      college: defaultCol,
      department: depts[0]?.name || 'Software Engineering',
      lecturerId: lecturers[0]?.id || '',
      semester: 'Spring 2026',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    const foundDept = getDepartmentsByCollege().find((d) => d.name === course.department);
    const crsCol = foundDept ? foundDept.college : 'College of Engineering';
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      creditHours: course.creditHours,
      college: crsCol,
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
              {COLLEGES.map((col) => (
                <option key={col} value={col}>
                  {col}
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
              {getDepartmentsByCollege(courseCollegeFilter).map((d) => (
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
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-success">{crs.code}</td>
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
                            <Archive className="h-4 w-4 mr-1 text-accent" /> Archive
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-1 text-success" /> Restore
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course Details' : 'Create New Course'}</DialogTitle>
            <DialogDescription>
              {editingCourse
                ? 'Update course details, credit allocation, or assigned lecturer.'
                : 'Enter the course details below to create a new course offering.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="crsCode" className="text-xs font-medium mb-1.5 block">
                  Course Code
                </Label>
                <Input
                  id="crsCode"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. ECE301"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="crsTitle" className="text-xs font-medium mb-1.5 block">
                  Course Title
                </Label>
                <Input
                  id="crsTitle"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Data Structures & Algorithms"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="credits" className="text-xs font-medium mb-1.5 block">
                  Credit Hours
                </Label>
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
                <Label htmlFor="semester" className="text-xs font-medium mb-1.5 block">
                  Semester
                </Label>
                <Input
                  id="semester"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  placeholder="e.g. Semester 1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="crsCollege" className="text-xs font-medium mb-1.5 block">
                College *
              </Label>
              <FormSelect
                id="crsCollege"
                value={formData.college}
                onChange={(e) => {
                  const newCol = e.target.value;
                  const depts = getDepartmentsByCollege(newCol);
                  setFormData({
                    ...formData,
                    college: newCol,
                    department: depts[0]?.name || '',
                  });
                }}
              >
                {COLLEGES.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <Label htmlFor="crsDept" className="text-xs font-medium mb-1.5 block">
                Department *
              </Label>
              <FormSelect
                id="crsDept"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                {getDepartmentsByCollege(formData.college).map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <Label htmlFor="crsLec" className="text-xs font-medium mb-1.5 block">
                Assigned Lecturer
              </Label>
              <FormSelect
                id="crsLec"
                value={formData.lecturerId}
                onChange={(e) => setFormData({ ...formData, lecturerId: e.target.value })}
              >
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    Dr. {l.firstName} {l.lastName} ({l.department})
                  </option>
                ))}
              </FormSelect>
            </div>
          </DialogBody>

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
