'use client';

import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  BookOpen,
  GraduationCap,
  ArrowRight,
  MoreHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FormSelect,
  Input,
  SearchInput,
  Textarea,
} from '@/components/ui';
import { ROUTES } from '@/constants';

import { useAdminStore } from '../store';
import { COLLEGES, getDepartmentsByCollege } from '@/constants';

import type { Department } from '../types';

export function DepartmentManagement() {
  const router = useRouter();
  const {
    departments,
    lecturers,
    departmentSearchQuery,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    setDepartmentSearchQuery,
    fetchAdminData,
    isLoadingData,
  } = useAdminStore();

  React.useEffect(() => {
    void fetchAdminData();
  }, [fetchAdminData]);

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingDept, setEditingDept] = React.useState<Department | null>(null);
  const [assigningHODDept, setAssigningHODDept] = React.useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = React.useState<Department | null>(null);

  const [formData, setFormData] = React.useState({
    code: '',
    name: '',
    description: '',
    hodId: lecturers[0]?.id || '',
  });

  const handleOpenAddModal = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      hodId: lecturers[0]?.id || '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      code: dept.code,
      name: dept.name,
      description: dept.description,
      hodId: dept.headOfDepartment.id,
    });
  };

  const handleSaveDepartment = () => {
    if (!formData.name || !formData.code) {
      toast.error('Missing required fields', { description: 'Department code and name are required.' });
      return;
    }

    const selectedLecturer = lecturers.find((l) => l.id === formData.hodId) || lecturers[0];

    if (editingDept) {
      updateDepartment(editingDept.id, {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description,
        headOfDepartment: {
          id: selectedLecturer ? selectedLecturer.id : 'lec-1',
          name: selectedLecturer ? `Dr. ${selectedLecturer.firstName} ${selectedLecturer.lastName}` : 'Dr. Robert Vance',
          email: selectedLecturer ? selectedLecturer.email : 'robert.vance@university.edu',
        },
      });
      toast.success('Department updated', { description: `${formData.name} updated.` });
      setEditingDept(null);
    } else {
      addDepartment({
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description,
        headOfDepartment: {
          id: selectedLecturer?.id || 'lec-1',
          name: selectedLecturer ? `Dr. ${selectedLecturer.firstName} ${selectedLecturer.lastName}` : 'Dr. Robert Vance',
          email: selectedLecturer?.email || 'robert.vance@university.edu',
        },
      });
      toast.success('Department created', { description: `New department ${formData.name} created.` });
      setIsAddModalOpen(false);
    }
  };

  const handleAssignHOD = () => {
    if (assigningHODDept) {
      const selectedLecturer = lecturers.find((l) => l.id === formData.hodId);
      if (selectedLecturer) {
        updateDepartment(assigningHODDept.id, {
          headOfDepartment: {
            id: selectedLecturer.id,
            name: `Dr. ${selectedLecturer.firstName} ${selectedLecturer.lastName}`,
            email: selectedLecturer.email,
          },
        });
        toast.success('Head of Department assigned', {
          description: `Dr. ${selectedLecturer.firstName} ${selectedLecturer.lastName} assigned as HOD for ${assigningHODDept.name}.`,
        });
      }
      setAssigningHODDept(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingDept) {
      deleteDepartment(deletingDept.id);
      toast.success('Department deleted', { description: `${deletingDept.name} deleted.` });
      setDeletingDept(null);
    }
  };

  const [collegeFilter, setCollegeFilter] = React.useState<string>('ALL');

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      dept.name.toLowerCase().includes(departmentSearchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(departmentSearchQuery.toLowerCase());

    const foundInfo = getDepartmentsByCollege().find((d) => d.name === dept.name);
    const matchesCollege = collegeFilter === 'ALL' || (foundInfo && foundInfo.college === collegeFilter);

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
              {COLLEGES.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredDepartments.map((dept) => (
          <Card key={dept.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold font-mono text-base">
                    {dept.code}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{dept.name}</h3>
                    <p className="text-xs text-muted-foreground">Created {dept.createdAt}</p>
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
                      onClick={() => {
                        setAssigningHODDept(dept);
                        setFormData({ ...formData, hodId: dept.headOfDepartment.id });
                      }}
                    >
                      <UserCheck className="h-4 w-4 mr-2 text-primary" /> Assign HOD
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

              <p className="text-xs text-muted-foreground line-clamp-2">{dept.description}</p>

              {/* Head of Department Badge */}
              <div className="p-2.5 rounded-lg border border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Head of Department</p>
                    <p className="text-xs font-semibold text-foreground">{dept.headOfDepartment.name}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  HOD
                </Badge>
              </div>
            </div>

            {/* Department Quick Stats */}
            <div className="mt-4 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-muted/40">
                <p className="font-bold text-foreground text-sm">{dept.studentCount}</p>
                <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <GraduationCap className="h-3 w-3" /> Students
                </p>
              </div>

              <div className="p-2 rounded bg-muted/40">
                <p className="font-bold text-foreground text-sm">{dept.lecturerCount}</p>
                <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <UserCheck className="h-3 w-3" /> Lecturers
                </p>
              </div>

              <div className="p-2 rounded bg-muted/40">
                <p className="font-bold text-foreground text-sm">{dept.courseCount}</p>
                <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <BookOpen className="h-3 w-3" /> Courses
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingDept ? 'Edit Department' : 'Add New Department'}</DialogTitle>
            <DialogDescription>
              {editingDept
                ? 'Update department details, academic code, or designated Head of Department.'
                : 'Enter the department information below to create a new academic department.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="code" className="text-xs font-medium mb-1.5 block">
                  Department Code
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. SE"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="name" className="text-xs font-medium mb-1.5 block">
                  Department Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Software Engineering & AI"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-xs font-medium mb-1.5 block">
                Description
              </Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Overview of academic focus, research areas, and program offerings..."
              />
            </div>

            <div>
              <Label htmlFor="hod" className="text-xs font-medium mb-1.5 block">
                Head of Department (HOD)
              </Label>
              <FormSelect
                id="hod"
                value={formData.hodId}
                onChange={(e) => setFormData({ ...formData, hodId: e.target.value })}
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
                setEditingDept(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveDepartment}>
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign HOD Modal */}
      {assigningHODDept && (
        <Dialog open={!!assigningHODDept} onOpenChange={() => setAssigningHODDept(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" /> Assign Head of Department
              </DialogTitle>
              <DialogDescription>
                Select a senior faculty member to serve as HOD for {assigningHODDept.name}.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4 py-3">
              <div>
                <Label htmlFor="hodSelect" className="text-xs font-medium mb-1.5 block">
                  Designated HOD
                </Label>
                <FormSelect
                  id="hodSelect"
                  value={formData.hodId}
                  onChange={(e) => setFormData({ ...formData, hodId: e.target.value })}
                >
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>
                      Dr. {l.firstName} {l.lastName} — {l.department}
                    </option>
                  ))}
                </FormSelect>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAssigningHODDept(null)}>
                Cancel
              </Button>
              <Button onClick={handleAssignHOD}>Confirm Assignment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
