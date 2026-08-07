'use client';

import { Clock, Plus, Edit2, Trash2 } from 'lucide-react';
import * as React from 'react';

import { ConfirmationDialog, toast } from '@/components/feedback';
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';
import { Label } from '@/components/forms';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

import { useAdminStore } from '../store';
import type { Semester } from '../types';

export function SemesterManagement() {
  const {
    semesters,
    academicYears,
    isLoadingSemesters,
    semesterSearchQuery,
    fetchSemesters,
    fetchAcademicYears,
    addSemester,
    updateSemester,
    deleteSemester,
    setSemesterSearchQuery,
  } = useAdminStore();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingSemester, setEditingSemester] = React.useState<Semester | null>(null);
  const [deletingSemester, setDeletingSemester] = React.useState<Semester | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    academicYear: '',
    semesterIndex: 'FIRST' as Semester['semesterIndex'],
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    fetchSemesters();
    fetchAcademicYears();
  }, [fetchSemesters, fetchAcademicYears]);

  const getAcademicYearLabel = (sem: Semester) => {
    if (sem.academicYearDetail?.displayLabel) {
      return sem.academicYearDetail.displayLabel;
    }
    const matchedYear = academicYears.find((y) => y.id === sem.academicYear);
    if (matchedYear?.displayLabel) {
      return matchedYear.displayLabel;
    }
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sem.academicYear);
    return isUuid ? 'Academic Year' : sem.academicYear;
  };

  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormData({
      academicYear: '',
      semesterIndex: 'FIRST',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (sem: Semester) => {
    setFieldErrors({});
    setEditingSemester(sem);
    setFormData({
      academicYear: sem.academicYearDetail?.displayLabel || sem.academicYear || '',
      semesterIndex: sem.semesterIndex,
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.academicYear.trim()) {
      errors.academic_year = 'Academic Year is required (e.g., 2025/2026).';
    }

    if (!formData.semesterIndex) {
      errors.semester_index = 'Semester term index is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveSemester = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingSemester) {
        await updateSemester(editingSemester.id, {
          semester_index: formData.semesterIndex,
        });
        toast.success('Semester updated successfully.');
        setEditingSemester(null);
      } else {
        await addSemester({
          academic_year: formData.academicYear.trim(),
          semester_index: formData.semesterIndex,
        });
        toast.success('Semester created successfully.');
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
    if (!deletingSemester) return;
    try {
      await deleteSemester(deletingSemester.id);
      toast.success('Semester deleted successfully.');
      setDeletingSemester(null);
    } catch (err: any) {
      toast.error(getUserFriendlyErrorMessage(err));
    }
  };

  const filteredSemesters = semesters.filter(
    (s) =>
      s.semesterIndex.toLowerCase().includes(semesterSearchQuery.toLowerCase()) ||
      getAcademicYearLabel(s).toLowerCase().includes(semesterSearchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102A7A] dark:text-foreground">
            Academic Semesters
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage academic semester periods (First, Second, Summer).
          </p>
        </div>
        <Button onClick={handleOpenAddModal} leftIcon={<Plus className="h-4 w-4" />}>
          Add Semester
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            placeholder="Search semesters..."
            value={semesterSearchQuery}
            onChange={(e) => setSemesterSearchQuery(e.target.value)}
            onClear={() => setSemesterSearchQuery('')}
            className="w-full sm:w-80"
          />
          <span className="text-xs text-muted-foreground">
            Showing <strong>{filteredSemesters.length}</strong> of <strong>{semesters.length}</strong> semesters
          </span>
        </div>
      </Card>

      {/* Semester List */}
      {isLoadingSemesters ? (
        <Card className="p-12 text-center text-muted-foreground">
          Loading semesters...
        </Card>
      ) : filteredSemesters.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold text-[#102A7A] dark:text-foreground mb-1">
            No Semesters Found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {semesterSearchQuery ? 'No semesters matched your query.' : 'No semesters have been configured yet.'}
          </p>
          <Button onClick={handleOpenAddModal} leftIcon={<Plus className="h-4 w-4" />}>
            Create Semester
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSemesters.map((sem) => (
            <Card key={sem.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline">{sem.semesterIndex} Semester</Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleOpenEditModal(sem)}
                      aria-label="Edit semester"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingSemester(sem)}
                      aria-label="Delete semester"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-[#102A7A] dark:text-foreground mb-1">
                  {sem.semesterIndex === 'FIRST' ? 'First Semester' : 'Second Semester'}
                </h3>
                <p className="text-xs text-muted-foreground mt-2">
                  Academic Year: <strong className="text-foreground">{getAcademicYearLabel(sem)}</strong>
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        open={isAddModalOpen || !!editingSemester}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingSemester(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#102A7A] dark:text-foreground font-bold">
              {editingSemester ? 'Edit Semester' : 'Add Semester'}
            </DialogTitle>
            <DialogDescription>
              {editingSemester
                ? 'Update semester term index.'
                : 'Configure a new semester within an academic year.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label required>Academic Year</Label>
                <Input
                  placeholder="e.g. 2025/2026"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  disabled={!!editingSemester}
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                />
                {fieldErrors.academic_year && <p className="text-xs text-destructive mt-1">{fieldErrors.academic_year}</p>}
              </div>

              <div>
                <Label required>Semester Term</Label>
                <Select
                  value={formData.semesterIndex}
                  onValueChange={(val: any) => setFormData({ ...formData, semesterIndex: val })}
                >
                  <SelectTrigger className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIRST">First Semester</SelectItem>
                    <SelectItem value="SECOND">Second Semester</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.semester_index && <p className="text-xs text-destructive mt-1">{fieldErrors.semester_index}</p>}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingSemester(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSemester}
              disabled={isSubmitting}
              className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-medium px-5"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </span>
              ) : editingSemester ? (
                'Save Changes'
              ) : (
                'Create Semester'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deletingSemester}
        onOpenChange={(open) => {
          if (!open) setDeletingSemester(null);
        }}
        title="Delete Semester"
        description="Are you sure you want to delete this semester? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingSemester(null)}
      />
    </div>
  );
}
