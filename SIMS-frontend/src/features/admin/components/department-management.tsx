'use client';

import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  GraduationCap,
  ArrowRight,
  MoreHorizontal,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { ConfirmationDialog, toast } from '@/components/feedback';
import { Label } from '@/components/forms';
import {
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  SearchInput,
} from '@/components/ui';
import { ROUTES } from '@/constants';
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';

import { useAdminStore } from '../store';

import type { Department } from '../types';

export function DepartmentManagement() {
  const router = useRouter();
  const {
    departments,
    colleges,
    programs,
    courses,
    isLoadingDepartments,
    departmentsError,
    departmentSearchQuery,
    fetchDepartments,
    fetchColleges,
    fetchPrograms,
    fetchCourses,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    setDepartmentSearchQuery,
  } = useAdminStore();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingDept, setEditingDept] = React.useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = React.useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    code: '',
    name: '',
    collegeId: '',
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    fetchDepartments();
    fetchColleges();
    fetchPrograms();
    fetchCourses();
  }, [fetchDepartments, fetchColleges, fetchPrograms, fetchCourses]);

  const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormData({
      code: '',
      name: '',
      collegeId: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setFieldErrors({});
    setEditingDept(dept);
    setFormData({
      code: dept.code,
      name: dept.name,
      collegeId: dept.college && UUID_REGEX.test(dept.college) ? dept.college : '',
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const trimmedCode = formData.code.trim();
    const trimmedName = formData.name.trim();

    if (!trimmedCode) {
      errors.code = 'Department code is required.';
    } else if (trimmedCode.length > 10) {
      errors.code = 'Department code must not exceed 10 characters.';
    }

    if (!trimmedName) {
      errors.name = 'Department name is required.';
    } else if (trimmedName.length > 255) {
      errors.name = 'Department name must not exceed 255 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDepartment = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          college: formData.collegeId ? formData.collegeId : null,
        });
        toast.success('Department updated successfully.');
        setEditingDept(null);
      } else {
        await addDepartment({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          college: formData.collegeId ? formData.collegeId : null,
        });
        toast.success('Department created successfully.');
        setIsAddModalOpen(false);
      }
      await fetchDepartments();
    } catch (err: unknown) {
      setFieldErrors(parseFieldErrors(err));
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingDept) {
      try {
        await deleteDepartment(deletingDept.id);
        toast.success('Department deleted successfully.');
        setDeletingDept(null);
        await fetchDepartments();
      } catch (err: unknown) {
        toast.error(getUserFriendlyErrorMessage(err));
      }
    }
  };

  const [collegeFilter, setCollegeFilter] = React.useState<string>('ALL');

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      dept.name.toLowerCase().includes(departmentSearchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(departmentSearchQuery.toLowerCase());

    const selectedCollege = colleges.find((c) => c.name === collegeFilter || c.id === collegeFilter || c.code === collegeFilter);
    const matchesCollege =
      collegeFilter === 'ALL' ||
      (selectedCollege ? dept.college === selectedCollege.id || dept.college === selectedCollege.name : dept.college === collegeFilter);

    return matchesSearch && matchesCollege;
  });

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Academic Departments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage institutional faculties, departments, Heads of Department (HOD), and course allocations.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleOpenAddModal}>
          Add Department
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <SearchInput
              placeholder="Search department by name or code..."
              value={departmentSearchQuery}
              onChange={(e) => setDepartmentSearchQuery(e.target.value)}
              onClear={() => setDepartmentSearchQuery('')}
            />
          </div>
          <div>
            <select
              className={selectClass}
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
            >
              <option value="ALL">All Colleges</option>
              {colleges.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoadingDepartments ? (
        <Card className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium">Loading departments from backend...</p>
        </Card>
      ) : departmentsError ? (
        /* Error & Retry State */
        <Card className="p-8 border-destructive/30 bg-destructive/5 text-center flex flex-col items-center justify-center gap-3">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Failed to Load Departments</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{departmentsError}</p>
          </div>
          <Button
            variant="outline"
            className="mt-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => fetchDepartments()}
          >
            Attempt Retry
          </Button>
        </Card>
      ) : filteredDepartments.length === 0 ? (
        /* Empty State */
        <Card className="p-12 text-center flex flex-col items-center justify-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-semibold text-[#102A7A] dark:text-foreground mb-1">
            {departmentSearchQuery ? 'No Matching Departments Found' : 'No departments have been created yet.'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {departmentSearchQuery
              ? 'Try refining your search filter.'
              : 'Add your first academic department to configure the university structure.'}
          </p>
          <Button onClick={handleOpenAddModal} leftIcon={<Plus className="h-4 w-4" />}>
            Add Department
          </Button>
        </Card>
      ) : (
        /* Department Cards Grid */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredDepartments.map((dept) => {
            const parentCollege = colleges.find((c) => c.id === dept.college || c.code === dept.college);
            const deptProgramsCount = programs ? programs.filter((p) => p.department === dept.id || p.department === dept.name).length : 0;
            const deptCoursesCount = courses ? courses.filter((c) => c.department === dept.name || c.department === dept.code).length : 0;

            return (
              <Card key={dept.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow border-border">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#102A7A]/10 text-[#102A7A] dark:bg-primary/20 dark:text-blue-300 font-bold font-mono text-base">
                        {dept.code}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">{dept.name}</h3>
                        {parentCollege && (
                          <span className="text-xs text-[#102A7A] dark:text-blue-400 font-medium">
                            {parentCollege.name} ({parentCollege.code})
                          </span>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Created {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(ROUTES.ADMIN.DEPARTMENT_DETAIL(dept.id))}>
                          <ArrowRight className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEditModal(dept)}>
                          <Edit2 className="h-4 w-4 mr-2" /> Edit Department
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletingDept(dept)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete Department
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Department Quick Stats */}
                <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                    <p className="font-bold text-foreground text-sm">{deptProgramsCount}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                      <GraduationCap className="h-3 w-3 text-primary" /> Academic Programs
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                    <p className="font-bold text-foreground text-sm">{deptCoursesCount}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                      <BookOpen className="h-3 w-3 text-primary" /> Active Courses
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Department Modal */}
      <Dialog
        open={isAddModalOpen || !!editingDept}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingDept(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#102A7A] dark:text-foreground font-bold">
              {editingDept ? 'Edit Department' : 'Add New Department'}
            </DialogTitle>
            <DialogDescription>
              {editingDept
                ? 'Update department details in the institutional hierarchy.'
                : 'Add a new academic department to the university.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
            {(fieldErrors.non_field_errors || fieldErrors.detail || fieldErrors.message) && (
              <div className="p-3 text-xs font-medium rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                {fieldErrors.non_field_errors || fieldErrors.detail || fieldErrors.message}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="code" required>
                  Department Code
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. SE"
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                  maxLength={10}
                />
                {fieldErrors.code && <p className="text-xs text-destructive mt-1">{fieldErrors.code}</p>}
              </div>

              <div>
                <Label htmlFor="name" required>
                  Department Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Software Engineering"
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                  maxLength={255}
                />
                {fieldErrors.name && <p className="text-xs text-destructive mt-1">{fieldErrors.name}</p>}
              </div>
            </div>

            <div>
              <Label>Assigned College (Optional)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus:border-[#102A7A] mt-1.5 transition-all shadow-sm text-foreground"
                value={formData.collegeId}
                onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
              >
                <option value="">-- Unassigned College --</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              {fieldErrors.college && <p className="text-xs text-destructive mt-1">{fieldErrors.college}</p>}
            </div>
          </DialogBody>

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingDept(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDepartment}
              disabled={isSubmitting}
              className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-medium px-5"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </span>
              ) : editingDept ? (
                'Save Changes'
              ) : (
                'Create Department'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {deletingDept && (
        <ConfirmationDialog
          open={!!deletingDept}
          onOpenChange={(open) => {
            if (!open) setDeletingDept(null);
          }}
          title="Delete Department"
          description={`Are you sure you want to delete ${deletingDept.name}? All associated course links will require re-assignment.`}
          confirmLabel="Delete Department"
          destructive
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingDept(null)}
        />
      )}
    </div>
  );
}
