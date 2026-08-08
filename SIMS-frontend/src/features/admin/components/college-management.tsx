'use client';

import { Landmark, Plus, Edit2, Trash2, Search } from 'lucide-react';
import * as React from 'react';

import { ConfirmationDialog, toast } from '@/components/feedback';
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';
import { Label } from '@/components/forms';
import {
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

import { useAdminStore } from '../store';
import { academicService } from '../services/academic-service';
import type { College } from '../types';

export function CollegeManagement() {
  const {
    colleges,
    isLoadingColleges,
    collegeSearchQuery,
    fetchColleges,
    addCollege,
    updateCollege,
    deleteCollege,
    setCollegeSearchQuery,
  } = useAdminStore();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingCollege, setEditingCollege] = React.useState<College | null>(null);
  const [deletingCollege, setDeletingCollege] = React.useState<College | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [universities, setUniversities] = React.useState<Array<{ id: string; name: string; code: string }>>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: '',
    code: '',
    university: '',
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    fetchColleges();
    loadUniversities();
  }, [fetchColleges]);

  const loadUniversities = async () => {
    setIsLoadingUniversities(true);
    try {
      const unis = await academicService.getUniversities();
      setUniversities(unis);
    } catch {
      // fallback
    } finally {
      setIsLoadingUniversities(false);
    }
  };

  const handleOpenAddModal = () => {
    setFieldErrors({});
    const defaultUni = universities[0]?.id || '';
    setFormData({ name: '', code: '', university: defaultUni });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (college: College) => {
    setFieldErrors({});
    setEditingCollege(college);
    setFormData({
      name: college.name,
      code: college.code,
      university: college.university || universities[0]?.id || '',
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.code.trim()) {
      errors.code = 'College code is required.';
    } else if (formData.code.length > 10) {
      errors.code = 'College code must not exceed 10 characters.';
    }

    if (!formData.name.trim()) {
      errors.name = 'College name is required.';
    } else if (formData.name.length > 255) {
      errors.name = 'College name must not exceed 255 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCollege = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingCollege) {
        await updateCollege(editingCollege.id, {
          name: formData.name,
          code: formData.code.toUpperCase(),
        });
        toast.success('College updated successfully.');
        setEditingCollege(null);
      } else {
        await addCollege({
          name: formData.name,
          code: formData.code.toUpperCase(),
          university: formData.university || undefined,
        });
        toast.success('College created successfully.');
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      setFieldErrors(parseFieldErrors(err));
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCollege) return;
    try {
      await deleteCollege(deletingCollege.id);
      toast.success('College deleted successfully.');
      setDeletingCollege(null);
    } catch (err: any) {
      toast.error(getUserFriendlyErrorMessage(err));
    }
  };

  const filteredColleges = colleges.filter(
    (c) =>
      c.name.toLowerCase().includes(collegeSearchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(collegeSearchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102A7A] dark:text-foreground">
            College Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage academic colleges connected to the university.
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add College
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            placeholder="Search by college code or name..."
            value={collegeSearchQuery}
            onChange={(e) => setCollegeSearchQuery(e.target.value)}
            onClear={() => setCollegeSearchQuery('')}
            className="w-full sm:w-80"
          />
          <span className="text-xs text-muted-foreground">
            Showing <strong>{filteredColleges.length}</strong> of <strong>{colleges.length}</strong> colleges
          </span>
        </div>
      </Card>

      {/* College List */}
      {isLoadingColleges ? (
        <Card className="p-12 text-center text-muted-foreground">
          Loading colleges...
        </Card>
      ) : filteredColleges.length === 0 ? (
        <Card className="p-12 text-center">
          <Landmark className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold text-[#102A7A] dark:text-foreground mb-1">
            No Colleges Found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {collegeSearchQuery ? 'No colleges matched your search query.' : 'No academic colleges have been created yet.'}
          </p>
          <Button onClick={handleOpenAddModal} leftIcon={<Plus className="h-4 w-4" />}>
            Create First College
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredColleges.map((college) => (
            <Card key={college.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold font-mono text-[#102A7A] dark:text-blue-400">
                    {college.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleOpenEditModal(college)}
                      aria-label="Edit college"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingCollege(college)}
                      aria-label="Delete college"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-[#102A7A] dark:text-foreground mb-1">
                  {college.name}
                </h3>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        open={isAddModalOpen || !!editingCollege}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingCollege(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#102A7A] dark:text-foreground font-bold">
              {editingCollege ? 'Edit College' : 'Add New College'}
            </DialogTitle>
            <DialogDescription>
              {editingCollege
                ? 'Update college details in the academic structure.'
                : 'Add a new college to the university academic structure.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label required>College Code</Label>
                <Input
                  placeholder="e.g. COEE"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                  maxLength={10}
                />
                {fieldErrors.code && <p className="text-xs text-destructive mt-1">{fieldErrors.code}</p>}
              </div>

              <div>
                <Label required>College Name</Label>
                <Input
                  placeholder="e.g. College of Electrical & Mechanical Engineering"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                  maxLength={255}
                />
                {fieldErrors.name && <p className="text-xs text-destructive mt-1">{fieldErrors.name}</p>}
              </div>
            </div>

            <div>
              <Label required>University</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus:border-[#102A7A] disabled:cursor-not-allowed disabled:opacity-50 mt-1.5 transition-all shadow-sm"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                disabled={isLoadingUniversities}
              >
                {isLoadingUniversities ? (
                  <option value="">Loading universities...</option>
                ) : universities.length === 0 ? (
                  <option value="">Addis Ababa Science and Technology University (Default)</option>
                ) : (
                  universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))
                )}
              </select>
              {fieldErrors.university && <p className="text-xs text-destructive mt-1">{fieldErrors.university}</p>}
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingCollege(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCollege}
              disabled={isSubmitting}
              className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-medium px-5"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </span>
              ) : editingCollege ? (
                'Save Changes'
              ) : (
                'Create College'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deletingCollege}
        onOpenChange={(open) => {
          if (!open) setDeletingCollege(null);
        }}
        title="Delete College"
        description={`Are you sure you want to delete ${deletingCollege?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingCollege(null)}
      />
    </div>
  );
}
