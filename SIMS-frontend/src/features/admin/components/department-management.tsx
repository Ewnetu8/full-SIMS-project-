'use client';

import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  GraduationCap,
  BookOpen,
  School,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
    departmentCollegeFilter,
    fetchDepartments,
    fetchColleges,
    fetchPrograms,
    fetchCourses,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    setDepartmentSearchQuery,
    setDepartmentCollegeFilter,
  } = useAdminStore();

  // Modals & Selection State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingDept, setEditingDept] = React.useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = React.useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState<{
    code: string;
    name: string;
    collegeId: string;
  }>({
    code: '',
    name: '',
    collegeId: '',
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Initial Data Fetch
  React.useEffect(() => {
    void fetchDepartments();
    void fetchColleges();
    void fetchPrograms();
    void fetchCourses();
  }, [fetchDepartments, fetchColleges, fetchPrograms, fetchCourses]);

  // College Resolver (safely checks nested college_detail or loaded colleges list)
  const getCollegeDisplay = React.useCallback(
    (dept: Department): { name: string; code?: string } => {
      if (dept.college_detail?.name) {
        return {
          name: dept.college_detail.name,
          code: dept.college_detail.code,
        };
      }
      if (dept.college) {
        const found = colleges.find((c) => c.id === dept.college || c.code === dept.college);
        if (found?.name) {
          return {
            name: found.name,
            code: found.code,
          };
        }
      }
      return { name: '—' };
    },
    [colleges]
  );

  // Open Create Modal
  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormError(null);
    setFormData({
      code: '',
      name: '',
      collegeId: '',
    });
    setEditingDept(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (dept: Department) => {
    setFieldErrors({});
    setFormError(null);
    setEditingDept(dept);
    setFormData({
      code: dept.code,
      name: dept.name,
      collegeId: dept.college || dept.college_detail?.id || '',
    });
    setIsAddModalOpen(true);
  };

  // Form Validation
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

  // Save Department (Create / Edit)
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    const payload = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      college: formData.collegeId ? formData.collegeId : null,
    };

    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, payload);
        toast.success('Academic department updated successfully.');
        setEditingDept(null);
      } else {
        await addDepartment(payload);
        toast.success('Academic department created successfully.');
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

  // Delete Department
  const handleDeleteDepartment = async () => {
    if (!deletingDept) return;
    setIsDeleting(true);
    try {
      await deleteDepartment(deletingDept.id);
      toast.success('Academic department deleted successfully.');
      setDeletingDept(null);
    } catch {
      toast.error(
        'This department cannot be deleted because it is currently associated with active academic programs, courses, or faculty records.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Departments
  const filteredDepartments = React.useMemo(() => {
    return departments.filter((dept) => {
      // Search query (code or name)
      if (departmentSearchQuery.trim()) {
        const q = departmentSearchQuery.toLowerCase().trim();
        const codeMatch = dept.code.toLowerCase().includes(q);
        const nameMatch = dept.name.toLowerCase().includes(q);
        if (!codeMatch && !nameMatch) return false;
      }

      // College filter
      if (departmentCollegeFilter !== 'ALL') {
        const clgId = dept.college || dept.college_detail?.id;
        if (clgId !== departmentCollegeFilter) return false;
      }

      return true;
    });
  }, [departments, departmentSearchQuery, departmentCollegeFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage) || 1;
  const paginatedDepartments = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDepartments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDepartments, currentPage, itemsPerPage]);

  // Statistics
  const totalDepartmentsCount = departments.length;
  const assignedCollegesCount = React.useMemo(() => {
    return departments.filter((d) => Boolean(d.college || d.college_detail)).length;
  }, [departments]);
  const totalProgramsCount = programs ? programs.length : 0;
  const totalCoursesCount = courses ? courses.length : 0;

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-primary" /> Academic Departments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage academic departments, college affiliations, degree programs, and curriculum allocations.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void fetchDepartments();
              void fetchColleges();
              void fetchPrograms();
              void fetchCourses();
            }}
            disabled={isLoadingDepartments}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingDepartments ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 font-semibold"
          >
            <Plus className="h-4 w-4" /> Add Department
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Departments</p>
            <p className="text-2xl font-bold text-foreground">{totalDepartmentsCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0">
            <School className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assigned to College</p>
            <p className="text-2xl font-bold text-foreground">{assignedCollegesCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Programs</p>
            <p className="text-2xl font-bold text-foreground">{totalProgramsCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Courses</p>
            <p className="text-2xl font-bold text-foreground">{totalCoursesCount}</p>
          </div>
        </Card>
      </div>

      {/* Error Alert */}
      {departmentsError && (
        <Card className="p-4 border-destructive/40 bg-destructive/10 text-destructive flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{departmentsError}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchDepartments()}
            className="border-destructive/30 hover:bg-destructive/20 text-destructive shrink-0"
          >
            Try Again
          </Button>
        </Card>
      )}

      {/* Filter / Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <SearchInput
              placeholder="Search department by code or name..."
              value={departmentSearchQuery}
              onChange={(e) => {
                setDepartmentSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => {
                setDepartmentSearchQuery('');
                setCurrentPage(1);
              }}
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={departmentCollegeFilter}
              onChange={(e) => {
                setDepartmentCollegeFilter(e.target.value);
                setCurrentPage(1);
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

          <div className="flex items-center justify-end text-xs text-muted-foreground">
            Showing <strong className="text-foreground mx-1">{filteredDepartments.length}</strong> of{' '}
            <strong className="text-foreground mx-1">{departments.length}</strong> departments
          </div>
        </div>
      </Card>

      {/* Department Catalogue Table */}
      <Card className="overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Code</th>
                <th className="px-4 py-3.5">Department Name</th>
                <th className="px-4 py-3.5">Assigned College</th>
                <th className="px-4 py-3.5">Programs</th>
                <th className="px-4 py-3.5">Courses</th>
                <th className="px-4 py-3.5">Created Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingDepartments ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>Loading academic departments from backend...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building2 className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-base font-semibold text-foreground">
                        {departments.length === 0
                          ? 'No academic departments registered yet'
                          : 'No matching departments found'}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {departments.length === 0
                          ? 'Get started by clicking Add Department above to configure the university departmental structure.'
                          : 'Try adjusting your search criteria or resetting the active college filter.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDepartments.map((dept) => {
                  const collegeDisplay = getCollegeDisplay(dept);
                  const deptProgramsCount = programs
                    ? programs.filter((p) => p.department === dept.id || p.department === dept.name).length
                    : 0;
                  const deptCoursesCount = courses
                    ? courses.filter((c) => {
                        const prog = programs.find((p) => p.id === c.program) || c.programDetail;
                        return prog && (prog.department === dept.id || prog.department === dept.name);
                      }).length
                    : 0;

                  return (
                    <tr key={dept.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary">
                        <Badge variant="outline" className="font-mono text-xs font-bold">
                          {dept.code}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-foreground">
                        {dept.name}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {collegeDisplay.name === '—' ? (
                          <span className="text-muted-foreground/60">Unassigned</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground">{collegeDisplay.name}</span>
                            {collegeDisplay.code && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {collegeDisplay.code}
                              </Badge>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <Badge variant="secondary" className="text-[11px] font-medium">
                          {deptProgramsCount} {deptProgramsCount === 1 ? 'Program' : 'Programs'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <Badge variant="outline" className="text-[11px] font-medium">
                          {deptCoursesCount} {deptCoursesCount === 1 ? 'Course' : 'Courses'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => router.push(ROUTES.ADMIN.DEPARTMENT_DETAIL(dept.id))}
                            title="View Department Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenEditModal(dept)}
                            title="Edit Department"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingDept(dept)}
                            title="Delete Department"
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
        {filteredDepartments.length > itemsPerPage && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * itemsPerPage, filteredDepartments.length)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{filteredDepartments.length}</span> departments
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

      {/* Add / Edit Department Dialog */}
      <Dialog
        open={isAddModalOpen || !!editingDept}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingDept(null);
          }
        }}
      >
        <DialogContent size="md" className="p-0 overflow-hidden sm:max-w-lg">
          <form onSubmit={handleSaveDepartment}>
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  {editingDept ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>
                <span>{editingDept ? 'Edit Academic Department' : 'Add Academic Department'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {editingDept
                  ? 'Update academic department details and institutional college affiliation.'
                  : 'Add a new academic department to the university structure.'}
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4 px-6 py-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Department Code */}
              <div className="space-y-1.5">
                <Label htmlFor="deptCode" required>
                  Department Code
                </Label>
                <Input
                  id="deptCode"
                  value={formData.code}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
                    if (fieldErrors.code) {
                      setFieldErrors((prev) => ({ ...prev, code: '' }));
                    }
                  }}
                  placeholder="e.g. SE"
                  className="font-mono uppercase"
                  maxLength={10}
                />
                {fieldErrors.code && (
                  <p className="text-xs text-destructive font-medium">{fieldErrors.code}</p>
                )}
              </div>

              {/* Department Name */}
              <div className="space-y-1.5">
                <Label htmlFor="deptName" required>
                  Department Name
                </Label>
                <Input
                  id="deptName"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (fieldErrors.name) {
                      setFieldErrors((prev) => ({ ...prev, name: '' }));
                    }
                  }}
                  placeholder="e.g. Software Engineering"
                  maxLength={255}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-destructive font-medium">{fieldErrors.name}</p>
                )}
              </div>

              {/* Assigned College */}
              <div className="space-y-1.5">
                <Label htmlFor="deptCollege">
                  Assigned College (Optional)
                </Label>
                <select
                  id="deptCollege"
                  className={selectClass}
                  value={formData.collegeId}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, collegeId: e.target.value }));
                    if (fieldErrors.college) {
                      setFieldErrors((prev) => ({ ...prev, college: '' }));
                    }
                  }}
                >
                  <option value="">-- Unassigned College --</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                {fieldErrors.college && (
                  <p className="text-xs text-destructive font-medium">{fieldErrors.college}</p>
                )}
              </div>
            </DialogBody>

            <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingDept(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : editingDept
                  ? 'Save Changes'
                  : 'Add Department'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Department Confirmation Dialog */}
      <Dialog
        open={!!deletingDept}
        onOpenChange={(open) => {
          if (!open) setDeletingDept(null);
        }}
      >
        <DialogContent size="sm" className="p-0 overflow-hidden sm:max-w-md">
          <DialogHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-2.5 text-destructive">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-bold">Delete Academic Department</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete department{' '}
              <span className="font-semibold text-foreground">
                {deletingDept?.code} - {deletingDept?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingDept(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteDepartment}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
