'use client';

import { Layers, Plus, Edit2, Trash2 } from 'lucide-react';
import * as React from 'react';

import { ConfirmationDialog, toast } from '@/components/feedback';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

import { useAdminStore } from '../store';
import type { Program } from '../types';

export function ProgramManagement() {
  const {
    programs,
    departments,
    colleges,
    isLoadingPrograms,
    programSearchQuery,
    fetchPrograms,
    fetchDepartments,
    fetchColleges,
    addProgram,
    updateProgram,
    deleteProgram,
    setProgramSearchQuery,
  } = useAdminStore();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingProgram, setEditingProgram] = React.useState<Program | null>(null);
  const [deletingProgram, setDeletingProgram] = React.useState<Program | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  const [formData, setFormData] = React.useState({
    collegeId: '',
    departmentId: '',
    name: '',
    code: '',
    degreeLevel: 'BACHELOR' as Program['degreeLevel'],
    totalCreditHoursRequired: 120,
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    fetchPrograms();
    fetchDepartments();
    fetchColleges();
  }, [fetchPrograms, fetchDepartments, fetchColleges]);

  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormData({
      collegeId: '',
      departmentId: '',
      name: '',
      code: '',
      degreeLevel: 'BACHELOR',
      totalCreditHoursRequired: 120,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (prog: Program) => {
    setFieldErrors({});
    setEditingProgram(prog);
    const progDept = departments.find((d) => d.id === prog.department);
    const foundCollegeId = progDept?.college || colleges[0]?.id || '';
    setFormData({
      collegeId: foundCollegeId,
      departmentId: prog.department,
      name: prog.name,
      code: prog.code,
      degreeLevel: prog.degreeLevel,
      totalCreditHoursRequired: prog.totalCreditHoursRequired,
    });
  };

  // Debug: log data available for dropdowns
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG] Program Form - Colleges loaded:', colleges.map(c => ({ id: c.id, name: c.name, code: c.code })));
      console.log('[DEBUG] Program Form - Departments loaded:', departments.map(d => ({ id: d.id, name: d.name, code: d.code, college: d.college })));
    }
  }, [colleges, departments]);

  const availableDepartments = React.useMemo(() => {
    if (!formData.collegeId) return departments;

    const selectedCollege = colleges.find(
      (c) => c.id === formData.collegeId || c.name === formData.collegeId || c.code === formData.collegeId
    );

    return departments.filter((d) => {
      if (d.college === formData.collegeId) return true;
      if (selectedCollege && (d.college === selectedCollege.id || d.college === selectedCollege.name || d.college === selectedCollege.code)) return true;
      if (!d.college) return true;
      return false;
    });
  }, [departments, colleges, formData.collegeId]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const trimmedCode = formData.code.trim();
    const trimmedName = formData.name.trim();

    if (!formData.departmentId) {
      errors.department = 'Department selection is required.';
    }

    if (!trimmedCode) {
      errors.code = 'Program code is required.';
    } else if (trimmedCode.length > 20) {
      errors.code = 'Program code must not exceed 20 characters.';
    }

    if (!trimmedName) {
      errors.name = 'Program name is required.';
    } else if (trimmedName.length > 255) {
      errors.name = 'Program name must not exceed 255 characters.';
    }

    if (isNaN(formData.totalCreditHoursRequired) || formData.totalCreditHoursRequired < 0) {
      errors.total_credit_hours_required = 'Credit hours must be a non-negative number.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProgram = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFieldErrors({});

    const payload = {
      department: formData.departmentId,
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      degree_level: formData.degreeLevel,
      total_credit_hours_required: Number(formData.totalCreditHoursRequired),
    };

    try {
      if (editingProgram) {
        await updateProgram(editingProgram.id, payload);
        toast.success('Program updated successfully.');
        setEditingProgram(null);
      } else {
        await addProgram(payload);
        toast.success('Program created successfully.');
        setIsAddModalOpen(false);
      }
      await fetchPrograms();
    } catch (err: any) {
      setFieldErrors(parseFieldErrors(err));
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProgram) return;
    try {
      await deleteProgram(deletingProgram.id);
      toast.success('Program deleted successfully.');
      setDeletingProgram(null);
      await fetchPrograms();
    } catch (err: any) {
      toast.error(getUserFriendlyErrorMessage(err));
    }
  };

  const filteredPrograms = programs.filter(
    (p) =>
      p.name.toLowerCase().includes(programSearchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(programSearchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102A7A] dark:text-foreground">
            Academic Programs
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage degree programs and curriculum specifications.
          </p>
        </div>
        <Button onClick={handleOpenAddModal} leftIcon={<Plus className="h-4 w-4" />}>
          Add Program
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            placeholder="Search by program code or name..."
            value={programSearchQuery}
            onChange={(e) => setProgramSearchQuery(e.target.value)}
            onClear={() => setProgramSearchQuery('')}
            className="w-full sm:w-80"
          />
          <span className="text-xs text-muted-foreground">
            Showing <strong>{filteredPrograms.length}</strong> of <strong>{programs.length}</strong> programs
          </span>
        </div>
      </Card>

      {/* Program List */}
      {isLoadingPrograms ? (
        <Card className="p-12 text-center text-muted-foreground">
          Loading academic programs...
        </Card>
      ) : filteredPrograms.length === 0 ? (
        <Card className="p-12 text-center">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold text-[#102A7A] dark:text-foreground mb-1">
            No Programs Found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {programSearchQuery ? 'No programs matched your search query.' : 'No degree programs have been registered yet.'}
          </p>
          <Button onClick={handleOpenAddModal} leftIcon={<Plus className="h-4 w-4" />}>
            Create First Program
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map((prog) => {
            const dept = departments.find((d) => d.id === prog.department);
            return (
              <Card key={prog.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold font-mono text-[#102A7A] dark:text-blue-400">
                      {prog.code}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleOpenEditModal(prog)}
                        aria-label="Edit program"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingProgram(prog)}
                        aria-label="Delete program"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg text-[#102A7A] dark:text-foreground mb-1">
                    {prog.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{prog.degreeLevel}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {prog.totalCreditHoursRequired} Credit Hours
                    </span>
                  </div>
                  {dept && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Dept: <strong className="text-foreground">{dept.name}</strong>
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        open={isAddModalOpen || !!editingProgram}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingProgram(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#102A7A] dark:text-foreground font-bold">
              {editingProgram ? 'Edit Academic Program' : 'Add New Academic Program'}
            </DialogTitle>
            <DialogDescription>
              {editingProgram
                ? 'Update degree program requirements and details.'
                : 'Add a new degree program to the academic catalog.'}
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
                <Label htmlFor="college">
                  Filter by College (Optional)
                </Label>
                <select
                  id="college"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus:border-[#102A7A] mt-1.5 transition-all shadow-sm text-foreground"
                  value={formData.collegeId}
                  onChange={(e) => {
                    const newCollegeId = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      collegeId: newCollegeId,
                    }));
                  }}
                >
                  <option value="">-- All Colleges --</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="department" required>
                  Department
                </Label>
                <select
                  id="department"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus:border-[#102A7A] disabled:cursor-not-allowed disabled:opacity-50 mt-1.5 transition-all shadow-sm text-foreground"
                  value={formData.departmentId}
                  onChange={(e) => {
                    const deptId = e.target.value;
                    const dept = departments.find((d) => d.id === deptId);
                    setFormData((prev) => ({
                      ...prev,
                      departmentId: deptId,
                      ...(dept?.college ? { collegeId: dept.college } : {}),
                    }));
                  }}
                >
                  <option value="">-- Select Department --</option>
                  {availableDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
                {fieldErrors.department && <p className="text-xs text-destructive mt-1">{fieldErrors.department}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="code" required>
                  Program Code
                </Label>
                <Input
                  id="code"
                  placeholder="e.g. BS-CS"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                  maxLength={20}
                />
                {fieldErrors.code && <p className="text-xs text-destructive mt-1">{fieldErrors.code}</p>}
              </div>

              <div>
                <Label htmlFor="name" required>
                  Program Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. B.Sc. in Computer Science"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                  maxLength={255}
                />
                {fieldErrors.name && <p className="text-xs text-destructive mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <Label htmlFor="degreeLevel" required>
                  Degree Level
                </Label>
                <Select
                  value={formData.degreeLevel}
                  onValueChange={(val: any) => setFormData({ ...formData, degreeLevel: val })}
                >
                  <SelectTrigger id="degreeLevel" className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BACHELOR">Bachelor</SelectItem>
                    <SelectItem value="MASTER">Master</SelectItem>
                    <SelectItem value="DOCTORATE">Doctorate</SelectItem>
                    <SelectItem value="DIPLOMA">Diploma</SelectItem>
                    <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.degree_level && <p className="text-xs text-destructive mt-1">{fieldErrors.degree_level}</p>}
              </div>

              <div>
                <Label htmlFor="totalCreditHoursRequired" required>
                  Total Credit Hours
                </Label>
                <Input
                  id="totalCreditHoursRequired"
                  type="number"
                  min={0}
                  value={formData.totalCreditHoursRequired}
                  onChange={(e) => setFormData({ ...formData, totalCreditHoursRequired: Number(e.target.value) })}
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                />
                {fieldErrors.total_credit_hours_required && (
                  <p className="text-xs text-destructive mt-1">{fieldErrors.total_credit_hours_required}</p>
                )}
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingProgram(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProgram}
              disabled={isSubmitting}
              className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-medium px-5"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </span>
              ) : editingProgram ? (
                'Save Changes'
              ) : (
                'Create Program'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deletingProgram}
        onOpenChange={(open) => {
          if (!open) setDeletingProgram(null);
        }}
        title="Delete Program"
        description={`Are you sure you want to delete ${deletingProgram?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingProgram(null)}
      />
    </div>
  );
}
