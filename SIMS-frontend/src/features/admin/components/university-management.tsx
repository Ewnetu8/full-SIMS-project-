'use client';

import {
  School,
  Plus,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Hash,
  Calendar,
  Clock,
  Copy,
  Check,
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
  Input,
  SearchInput,
} from '@/components/ui';
import {
  useUniversities,
  useCreateUniversity,
  useUpdateUniversity,
  useDeleteUniversity,
  universitiesApi,
} from '@/features/universities';
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';

import type { University } from '../types';

export function UniversityManagement() {
  const {
    data: universities = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useUniversities();

  const createMutation = useCreateUniversity();
  const updateMutation = useUpdateUniversity();
  const deleteMutation = useDeleteUniversity();

  // Search & Filter State (Client-side)
  const [searchQuery, setSearchQuery] = React.useState('');

  // Modals & Dialogs State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingUniversity, setEditingUniversity] = React.useState<University | null>(null);
  const [deletingUniversity, setDeletingUniversity] = React.useState<University | null>(null);
  const [viewingUniId, setViewingUniId] = React.useState<string | null>(null);
  const [viewingUniDetail, setViewingUniDetail] = React.useState<University | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState({ name: '', code: '' });
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Filtered universities
  const filteredUniversities = React.useMemo(() => {
    if (!searchQuery.trim()) return universities;
    const q = searchQuery.toLowerCase().trim();
    return universities.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.code.toLowerCase().includes(q)
    );
  }, [universities, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUniversities.length / itemsPerPage));
  const paginatedUniversities = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUniversities.slice(start, start + itemsPerPage);
  }, [filteredUniversities, currentPage, itemsPerPage]);

  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormError(null);
    setFormData({ name: '', code: '' });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (uni: University) => {
    setFieldErrors({});
    setFormError(null);
    setEditingUniversity(uni);
    setFormData({ name: uni.name, code: uni.code });
  };

  const handleOpenViewModal = async (uni: University) => {
    setViewingUniId(uni.id);
    setViewingUniDetail(uni);
    setIsLoadingDetail(true);
    try {
      const detail = await universitiesApi.getUniversity(uni.id);
      setViewingUniDetail(detail);
    } catch {
      // Keep prefilled
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'University name is required.';
    } else if (formData.name.trim().length > 255) {
      errors.name = 'University name must not exceed 255 characters.';
    }

    if (!formData.code.trim()) {
      errors.code = 'University code is required.';
    } else if (formData.code.trim().length > 10) {
      errors.code = 'University code must not exceed 10 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormError(null);
    setFieldErrors({});

    createMutation.mutate(
      {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
      },
      {
        onSuccess: (newUni) => {
          toast.success(`University "${newUni.name}" created successfully.`);
          setIsAddModalOpen(false);
        },
        onError: (err) => {
          const parsed = parseFieldErrors(err);
          if (Object.keys(parsed).length > 0) {
            setFieldErrors(parsed);
          }
          setFormError(getUserFriendlyErrorMessage(err, 'Failed to create university.'));
        },
      }
    );
  };

  const handleUpdateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUniversity || !validateForm()) return;

    setFormError(null);
    setFieldErrors({});

    updateMutation.mutate(
      {
        id: editingUniversity.id,
        data: {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
        },
      },
      {
        onSuccess: (updatedUni) => {
          toast.success(`University "${updatedUni.name}" updated successfully.`);
          setEditingUniversity(null);
        },
        onError: (err) => {
          const parsed = parseFieldErrors(err);
          if (Object.keys(parsed).length > 0) {
            setFieldErrors(parsed);
          }
          setFormError(getUserFriendlyErrorMessage(err, 'Failed to update university.'));
        },
      }
    );
  };

  const handleDeleteUniversity = async () => {
    if (!deletingUniversity) return;

    deleteMutation.mutate(deletingUniversity.id, {
      onSuccess: () => {
        toast.success(`University "${deletingUniversity.name}" deleted successfully.`);
        setDeletingUniversity(null);
      },
      onError: (err) => {
        toast.error(
          getUserFriendlyErrorMessage(
            err,
            'Failed to delete university. It may be referenced by existing colleges or academic records.'
          )
        );
        setDeletingUniversity(null);
      },
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
              <School className="h-6 w-6 text-primary" /> University Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage higher education institutions and university entities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenAddModal}
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add University
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <Card className="p-4 border-destructive/40 bg-destructive/10 text-destructive flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              {getUserFriendlyErrorMessage(error, 'Unable to load universities. Please try again.')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="border-destructive/30 hover:bg-destructive/20 text-destructive shrink-0"
          >
            Retry
          </Button>
        </Card>
      )}

      {/* Search & Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <SearchInput
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            Showing {filteredUniversities.length} {filteredUniversities.length === 1 ? 'university' : 'universities'}
          </div>
        </div>
      </Card>

      {/* Universities Table Card */}
      <Card className="overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-4 w-48 rounded bg-muted" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-16 rounded bg-muted" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 rounded bg-muted" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 rounded bg-muted" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="ml-auto h-7 w-20 rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : filteredUniversities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <School className="h-10 w-10 text-muted-foreground/40" />
                      <p className="text-base font-semibold text-foreground">
                        {searchQuery ? 'No matching universities found' : 'No universities found'}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {searchQuery
                          ? 'Try adjusting your search criteria.'
                          : 'Get started by creating your first university entity.'}
                      </p>
                      {!searchQuery && (
                        <Button
                          onClick={handleOpenAddModal}
                          size="sm"
                          className="mt-3 flex items-center gap-1.5"
                        >
                          <Plus className="h-4 w-4" /> Add University
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUniversities.map((uni) => (
                  <tr key={uni.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-primary shrink-0" />
                        <span>{uni.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="font-mono text-xs">
                        {uni.code}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs">
                      {formatDate(uni.created_at || uni.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs">
                      {formatDate(uni.updated_at || uni.updatedAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenViewModal(uni)}
                          title="View Details"
                          aria-label={`View details for ${uni.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEditModal(uni)}
                          title="Edit University"
                          aria-label={`Edit ${uni.name}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletingUniversity(uni)}
                          title="Delete University"
                          aria-label={`Delete ${uni.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredUniversities.length > itemsPerPage && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add University Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <School className="h-5 w-5 text-primary" /> Add New University
            </DialogTitle>
            <DialogDescription>
              Create a new higher education institution entity in the system.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUniversity} className="space-y-4">
            <DialogBody className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="create-uni-name" required>
                  University Name
                </Label>
                <Input
                  id="create-uni-name"
                  placeholder="e.g. Addis Ababa Science and Technology University"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={255}
                  disabled={createMutation.isPending}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-destructive">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-uni-code" required>
                  University Code
                </Label>
                <Input
                  id="create-uni-code"
                  placeholder="e.g. AASTU"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  maxLength={10}
                  disabled={createMutation.isPending}
                />
                {fieldErrors.code && (
                  <p className="text-xs text-destructive">{fieldErrors.code}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Short institutional identifier (up to 10 uppercase characters).
                </p>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create University'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit University Modal */}
      <Dialog
        open={Boolean(editingUniversity)}
        onOpenChange={(open) => {
          if (!open) setEditingUniversity(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" /> Edit University
            </DialogTitle>
            <DialogDescription>
              Update university institution name and code.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateUniversity} className="space-y-4">
            <DialogBody className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="edit-uni-name" required>
                  University Name
                </Label>
                <Input
                  id="edit-uni-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={255}
                  disabled={updateMutation.isPending}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-destructive">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-uni-code" required>
                  University Code
                </Label>
                <Input
                  id="edit-uni-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  maxLength={10}
                  disabled={updateMutation.isPending}
                />
                {fieldErrors.code && (
                  <p className="text-xs text-destructive">{fieldErrors.code}</p>
                )}
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUniversity(null)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog
        open={Boolean(viewingUniId)}
        onOpenChange={(open) => {
          if (!open) {
            setViewingUniId(null);
            setViewingUniDetail(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <School className="h-5 w-5 text-primary" /> University Details
            </DialogTitle>
            <DialogDescription>
              Detailed information for the selected university.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {isLoadingDetail ? (
              <div className="space-y-3 py-4">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                <div className="h-4 w-40 bg-muted rounded animate-pulse" />
              </div>
            ) : viewingUniDetail ? (
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg space-y-2 border border-border">
                  <div>
                    <span className="text-xs text-muted-foreground block">University Name</span>
                    <span className="text-sm font-semibold text-foreground">
                      {viewingUniDetail.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <div>
                      <span className="text-xs text-muted-foreground block">Code</span>
                      <Badge variant="outline" className="font-mono text-xs mt-0.5">
                        {viewingUniDetail.code}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between py-1 border-b border-border">
                    <span className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5" /> ID
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[11px] text-foreground">
                        {viewingUniDetail.id}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopyId(viewingUniDetail.id)}
                        title="Copy UUID"
                      >
                        {copiedId ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-border">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Created Date
                    </span>
                    <span className="text-foreground">
                      {formatDate(viewingUniDetail.created_at || viewingUniDetail.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Last Updated
                    </span>
                    <span className="text-foreground">
                      {formatDate(viewingUniDetail.updated_at || viewingUniDetail.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setViewingUniId(null);
                setViewingUniDetail(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={Boolean(deletingUniversity)}
        onOpenChange={(open) => {
          if (!open) setDeletingUniversity(null);
        }}
        onConfirm={handleDeleteUniversity}
        title="Delete University"
        description={`Are you sure you want to delete "${deletingUniversity?.name}" (${deletingUniversity?.code})? This action cannot be undone and will fail if related colleges or academic structures are attached.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
