'use client';

import { Calendar, Plus, Edit2, Trash2, XCircle } from 'lucide-react';
import * as React from 'react';

import { ConfirmationDialog, toast } from '@/components/feedback';
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';
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
  Input,
  SearchInput,
} from '@/components/ui';

import { useAdminStore } from '../store';
import type { AcademicYear } from '../types';

export function AcademicYearManagement() {
  const {
    academicYears,
    isLoadingAcademicYears,
    academicYearsError,
    academicYearSearchQuery,
    fetchAcademicYears,
    addAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    setAcademicYearSearchQuery,
  } = useAdminStore();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingYear, setEditingYear] = React.useState<AcademicYear | null>(null);
  const [deletingYear, setDeletingYear] = React.useState<AcademicYear | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    display_label: '',
    start_boundary: '',
    end_boundary: '',
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  const handleOpenAddModal = () => {
    setFieldErrors({});
    const todayStr = new Date().toISOString().split('T')[0] || '';
    setFormData({
      display_label: '2026/2027 Academic Year',
      start_boundary: todayStr,
      end_boundary: todayStr,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (year: AcademicYear) => {
    setFieldErrors({});
    setEditingYear(year);
    setFormData({
      display_label: year.displayLabel,
      start_boundary: year.startBoundary,
      end_boundary: year.endBoundary,
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.display_label.trim()) {
      errors.display_label = 'Display label is required.';
    } else if (formData.display_label.length > 100) {
      errors.display_label = 'Display label must not exceed 100 characters.';
    }

    if (!formData.start_boundary) {
      errors.start_boundary = 'Start boundary date is required.';
    }

    if (!formData.end_boundary) {
      errors.end_boundary = 'End boundary date is required.';
    }

    if (formData.start_boundary && formData.end_boundary && formData.start_boundary > formData.end_boundary) {
      errors.end_boundary = 'End date must be on or after start date.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAcademicYear = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingYear) {
        await updateAcademicYear(editingYear.id, {
          display_label: formData.display_label,
          start_boundary: formData.start_boundary,
          end_boundary: formData.end_boundary,
        });
        toast.success('Academic year updated successfully.');
        setEditingYear(null);
      } else {
        await addAcademicYear({
          display_label: formData.display_label,
          start_boundary: formData.start_boundary,
          end_boundary: formData.end_boundary,
        });
        toast.success('Academic year created successfully.');
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
    if (!deletingYear) return;
    try {
      await deleteAcademicYear(deletingYear.id);
      toast.success('Academic year deleted successfully.');
      setDeletingYear(null);
    } catch (err: any) {
      toast.error(getUserFriendlyErrorMessage(err));
    }
  };

  const filteredYears = academicYears.filter((y) =>
    y.displayLabel.toLowerCase().includes(academicYearSearchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102A7A] dark:text-foreground">
            Academic Years
          </h1>
          <p className="text-sm text-muted-foreground">
            Define calendar boundaries for academic years.
          </p>
        </div>
        <Button onClick={handleOpenAddModal} leftIcon={<Plus className="h-4 w-4" />}>
          Add Academic Year
        </Button>
      </div>

      {/* Error State Banner */}
      {academicYearsError && (
        <Card className="p-4 border-destructive/40 bg-destructive/10 flex items-center justify-between">
          <div className="flex items-center gap-3 text-destructive">
            <XCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{academicYearsError}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchAcademicYears()}>
            Retry
          </Button>
        </Card>
      )}

      {/* Filter / Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            placeholder="Search academic years..."
            value={academicYearSearchQuery}
            onChange={(e) => setAcademicYearSearchQuery(e.target.value)}
            onClear={() => setAcademicYearSearchQuery('')}
            className="w-full sm:w-80"
          />
          <span className="text-xs text-muted-foreground">
            Showing <strong>{filteredYears.length}</strong> of <strong>{academicYears.length}</strong> academic years
          </span>
        </div>
      </Card>

      {/* List */}
      {isLoadingAcademicYears ? (
        <Card className="p-12 text-center text-muted-foreground">
          Loading academic years...
        </Card>
      ) : filteredYears.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold text-[#102A7A] dark:text-foreground mb-1">
            No Academic Years Found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {academicYearSearchQuery ? 'No academic years matched your query.' : 'No academic years created yet.'}
          </p>
          <Button onClick={handleOpenAddModal} leftIcon={<Plus className="h-4 w-4" />}>
            Create Academic Year
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredYears.map((year) => (
            <Card key={year.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-bold bg-[#102A7A]/10 text-[#102A7A] dark:bg-primary/20 dark:text-blue-300 rounded-md">
                    Academic Year
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleOpenEditModal(year)}
                      aria-label="Edit academic year"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingYear(year)}
                      aria-label="Delete academic year"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-[#102A7A] dark:text-foreground mb-2">
                  {year.displayLabel}
                </h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Start: <strong className="text-foreground">{year.startBoundary}</strong></p>
                  <p>End: <strong className="text-foreground">{year.endBoundary}</strong></p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        open={isAddModalOpen || !!editingYear}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingYear(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#102A7A] dark:text-foreground font-bold">
              {editingYear ? 'Edit Academic Year' : 'Add Academic Year'}
            </DialogTitle>
            <DialogDescription>
              {editingYear
                ? 'Update academic year display label and calendar boundaries.'
                : 'Define a new academic year with start and end dates.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
            {(fieldErrors.non_field_errors || fieldErrors.detail || fieldErrors.message) && (
              <div className="p-3 text-xs font-medium rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                {fieldErrors.non_field_errors || fieldErrors.detail || fieldErrors.message}
              </div>
            )}

            <div>
              <Label htmlFor="display_label" required>
                Display Label
              </Label>
              <Input
                id="display_label"
                placeholder="e.g. 2026/2027 Academic Year"
                value={formData.display_label}
                onChange={(e) => setFormData({ ...formData, display_label: e.target.value })}
                className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                maxLength={100}
              />
              {fieldErrors.display_label && <p className="text-xs text-destructive mt-1">{fieldErrors.display_label}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="start_boundary" required>
                  Start Boundary Date
                </Label>
                <Input
                  id="start_boundary"
                  type="date"
                  value={formData.start_boundary}
                  onChange={(e) => setFormData({ ...formData, start_boundary: e.target.value })}
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                />
                {fieldErrors.start_boundary && <p className="text-xs text-destructive mt-1">{fieldErrors.start_boundary}</p>}
              </div>

              <div>
                <Label htmlFor="end_boundary" required>
                  End Boundary Date
                </Label>
                <Input
                  id="end_boundary"
                  type="date"
                  value={formData.end_boundary}
                  onChange={(e) => setFormData({ ...formData, end_boundary: e.target.value })}
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                />
                {fieldErrors.end_boundary && <p className="text-xs text-destructive mt-1">{fieldErrors.end_boundary}</p>}
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingYear(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAcademicYear}
              disabled={isSubmitting}
              className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-medium px-5"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </span>
              ) : editingYear ? (
                'Save Changes'
              ) : (
                'Create Academic Year'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deletingYear}
        onOpenChange={(open) => {
          if (!open) setDeletingYear(null);
        }}
        title="Delete Academic Year"
        description={`Are you sure you want to delete ${deletingYear?.displayLabel}? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingYear(null)}
      />
    </div>
  );
}
