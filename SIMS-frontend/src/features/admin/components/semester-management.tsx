'use client';

import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';
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
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';

import { useAdminStore } from '../store';

import type { Semester, SemesterTerm } from '../types';

const SEMESTER_TERM_LABELS: Record<string, string> = {
  FIRST: 'First Semester',
  SECOND: 'Second Semester',
  SUMMER: 'Summer Term',
};

const SEMESTER_TERM_BADGE_VARIANTS: Record<string, string> = {
  FIRST: 'bg-primary/10 text-primary border-primary/30',
  SECOND: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
  SUMMER: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
};

export function SemesterManagement() {
  const {
    semesters,
    academicYears,
    isLoadingSemesters,
    isLoadingAcademicYears,
    semestersError,
    semesterSearchQuery,
    semesterYearFilter,
    fetchSemesters,
    fetchAcademicYears,
    addSemester,
    updateSemester,
    deleteSemester,
    setSemesterSearchQuery,
    setSemesterYearFilter,
  } = useAdminStore();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingSemester, setEditingSemester] = React.useState<Semester | null>(null);
  const [deletingSemester, setDeletingSemester] = React.useState<Semester | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState<{
    academicYear: string;
    semesterIndex: SemesterTerm;
  }>({
    academicYear: '',
    semesterIndex: 'FIRST',
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  React.useEffect(() => {
    fetchSemesters();
    fetchAcademicYears();
  }, [fetchSemesters, fetchAcademicYears]);

  const getAcademicYearLabel = React.useCallback(
    (sem: Semester) => {
      if (sem.academicYearDetail?.displayLabel) {
        return sem.academicYearDetail.displayLabel;
      }
      const matchedYear = academicYears.find((y) => y.id === sem.academicYear);
      if (matchedYear?.displayLabel) {
        return matchedYear.displayLabel;
      }
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sem.academicYear);
      return isUuid ? 'Academic Year' : sem.academicYear;
    },
    [academicYears]
  );

  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormError(null);
    setFormData({
      academicYear: academicYears[0]?.id || '',
      semesterIndex: 'FIRST',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (sem: Semester) => {
    setFieldErrors({});
    setFormError(null);
    setEditingSemester(sem);
    setFormData({
      academicYear: sem.academicYearDetail?.id || sem.academicYear || '',
      semesterIndex: (sem.semesterIndex as SemesterTerm) || 'FIRST',
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.academicYear.trim()) {
      errors.academic_year = 'Academic Year is required.';
    }
    if (!formData.semesterIndex) {
      errors.semester_index = 'Semester term is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      if (editingSemester) {
        await updateSemester(editingSemester.id, {
          academic_year: formData.academicYear.trim(),
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

  const handleDeleteConfirm = async () => {
    if (!deletingSemester) return;
    setIsSubmitting(true);
    try {
      await deleteSemester(deletingSemester.id);
      toast.success('Semester deleted successfully.');
      setDeletingSemester(null);
    } catch (err: unknown) {
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Semesters
  const filteredSemesters = React.useMemo(() => {
    return semesters.filter((sem) => {
      // Academic year filter
      if (semesterYearFilter !== 'ALL' && sem.academicYear !== semesterYearFilter && sem.academicYearDetail?.id !== semesterYearFilter) {
        return false;
      }

      // Search query filter
      if (semesterSearchQuery.trim()) {
        const q = semesterSearchQuery.toLowerCase().trim();
        const termLabel = (SEMESTER_TERM_LABELS[sem.semesterIndex] || sem.semesterIndex).toLowerCase();
        const yearLabel = getAcademicYearLabel(sem).toLowerCase();
        const idMatch = sem.id.toLowerCase().includes(q);
        return termLabel.includes(q) || yearLabel.includes(q) || idMatch;
      }

      return true;
    });
  }, [semesters, semesterYearFilter, semesterSearchQuery, getAcademicYearLabel]);

  // Pagination
  const totalPages = Math.ceil(filteredSemesters.length / itemsPerPage) || 1;
  const paginatedSemesters = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSemesters.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSemesters, currentPage, itemsPerPage]);

  // Statistics
  const firstTermCount = React.useMemo(() => semesters.filter((s) => s.semesterIndex === 'FIRST').length, [semesters]);
  const secondTermCount = React.useMemo(() => semesters.filter((s) => s.semesterIndex === 'SECOND').length, [semesters]);
  const summerTermCount = React.useMemo(() => semesters.filter((s) => s.semesterIndex === 'SUMMER').length, [semesters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" /> Academic Semesters
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage academic semester terms (First, Second, Summer) linked to academic years.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchSemesters();
              fetchAcademicYears();
            }}
            disabled={isLoadingSemesters || isLoadingAcademicYears}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingSemesters ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 font-semibold"
          >
            <Plus className="h-4 w-4" /> Add Semester
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Semesters</p>
            <p className="text-2xl font-bold text-foreground">{semesters.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">First Semesters</p>
            <p className="text-2xl font-bold text-foreground">{firstTermCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Second Semesters</p>
            <p className="text-2xl font-bold text-foreground">{secondTermCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Summer Terms</p>
            <p className="text-2xl font-bold text-foreground">{summerTermCount}</p>
          </div>
        </Card>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="w-full md:flex-1">
            <SearchInput
              placeholder="Search semesters by term, academic year, or ID..."
              value={semesterSearchQuery}
              onChange={(e) => {
                setSemesterSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => {
                setSemesterSearchQuery('');
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="w-full md:w-64">
            <Select
              value={semesterYearFilter}
              onValueChange={(val) => {
                setSemesterYearFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Academic Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Academic Years</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.displayLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {semestersError && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load semesters</p>
              <p className="text-xs text-destructive/90">{semestersError}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchSemesters()}
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" /> Retry
          </Button>
        </div>
      )}

      {/* Semesters Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Semester Term</th>
                <th className="px-4 py-3.5">Academic Year</th>
                <th className="px-4 py-3.5">Identifier (UUID)</th>
                <th className="px-4 py-3.5">Created Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingSemesters ? (
                // Loading Skeletons
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-6 w-32 bg-muted rounded-md" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-44 bg-muted rounded-sm" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-48 bg-muted rounded-sm" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 bg-muted rounded-sm" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-8 w-20 bg-muted rounded-md inline-block" />
                    </td>
                  </tr>
                ))
              ) : paginatedSemesters.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground mx-auto">
                        <Clock className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-foreground text-base">No Semesters Found</p>
                      <p className="text-xs text-muted-foreground">
                        {semesterSearchQuery.trim() || semesterYearFilter !== 'ALL'
                          ? 'No semesters matched your search criteria.'
                          : 'There are currently no semesters configured in the system. Add your first semester to begin managing academic terms.'}
                      </p>
                      {!semesterSearchQuery.trim() && semesterYearFilter === 'ALL' && (
                        <div className="pt-2">
                          <Button size="sm" onClick={handleOpenAddModal}>
                            <Plus className="h-4 w-4 mr-1.5" /> Add Semester
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                // Data Rows
                paginatedSemesters.map((sem) => {
                  const badgeStyle = SEMESTER_TERM_BADGE_VARIANTS[sem.semesterIndex] || 'bg-muted text-muted-foreground border-border';
                  const label = SEMESTER_TERM_LABELS[sem.semesterIndex] || sem.semesterIndex;
                  const yearLabel = getAcademicYearLabel(sem);

                  return (
                    <tr key={sem.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        <Badge variant="outline" className={`font-semibold text-xs py-0.5 px-2.5 ${badgeStyle}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-foreground font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{yearLabel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                        {sem.id}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {sem.createdAt ? (
                          new Date(sem.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(sem)}
                            title="Edit Semester"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingSemester(sem)}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            title="Delete Semester"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
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

        {/* Pagination Controls */}
        {!isLoadingSemesters && filteredSemesters.length > itemsPerPage && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * itemsPerPage, filteredSemesters.length)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{filteredSemesters.length}</span> semesters
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="font-medium text-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add / Edit Semester Dialog */}
      <Dialog
        open={isAddModalOpen || !!editingSemester}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingSemester(null);
          }
        }}
      >
        <DialogContent size="md" className="sm:max-w-md p-0 overflow-hidden">
          <form onSubmit={handleSaveSemester}>
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  {editingSemester ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>
                {editingSemester ? 'Edit Semester' : 'Add Semester'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {editingSemester
                  ? 'Update the academic year or term index for this semester.'
                  : 'Configure a new semester period linked to an academic year.'}
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4 px-6 py-4">
              {formError && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="semester-academic-year" required>
                  Academic Year
                </Label>
                <Select
                  value={formData.academicYear}
                  onValueChange={(val) => {
                    setFormData((prev) => ({ ...prev, academicYear: val }));
                    if (fieldErrors.academic_year) {
                      setFieldErrors((prev) => ({ ...prev, academic_year: '' }));
                    }
                  }}
                >
                  <SelectTrigger id="semester-academic-year">
                    <SelectValue placeholder="Select Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.displayLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.academic_year && (
                  <p className="text-xs text-destructive font-medium">{fieldErrors.academic_year}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="semester-term-index" required>
                  Semester Term
                </Label>
                <Select
                  value={formData.semesterIndex}
                  onValueChange={(val) => {
                    setFormData((prev) => ({ ...prev, semesterIndex: val as SemesterTerm }));
                    if (fieldErrors.semester_index) {
                      setFieldErrors((prev) => ({ ...prev, semester_index: '' }));
                    }
                  }}
                >
                  <SelectTrigger id="semester-term-index">
                    <SelectValue placeholder="Select Term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIRST">First Semester</SelectItem>
                    <SelectItem value="SECOND">Second Semester</SelectItem>
                    <SelectItem value="SUMMER">Summer Term</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.semester_index && (
                  <p className="text-xs text-destructive font-medium">{fieldErrors.semester_index}</p>
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
                  setEditingSemester(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : editingSemester
                    ? 'Save Changes'
                    : 'Create Semester'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deletingSemester}
        onOpenChange={(open) => {
          if (!open) setDeletingSemester(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Semester"
        description={`Are you sure you want to delete the "${deletingSemester ? SEMESTER_TERM_LABELS[deletingSemester.semesterIndex] || deletingSemester.semesterIndex : ''
          }" semester for ${deletingSemester ? getAcademicYearLabel(deletingSemester) : ''}? Records attached to this semester may be affected.`}
        confirmLabel="Delete Semester"
        destructive
        loading={isSubmitting}
      />
    </div>
  );
}
