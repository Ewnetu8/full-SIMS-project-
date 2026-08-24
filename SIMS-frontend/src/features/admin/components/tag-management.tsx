'use client';

import {
  Tag as TagIcon,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Hash,
  Calendar,
  Clock,
  Sparkles,
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
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';

import { useAdminStore } from '../store';

import type { Tag } from '../types';

export function TagManagement() {
  const {
    tags,
    isLoadingTags,
    tagsError,
    tagSearchQuery,
    fetchTags,
    addTag,
    updateTag,
    deleteTag,
    setTagSearchQuery,
  } = useAdminStore();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingTag, setEditingTag] = React.useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = React.useState<Tag | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({ name: '' });
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  React.useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormError(null);
    setFormData({ name: '' });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (tag: Tag) => {
    setFieldErrors({});
    setFormError(null);
    setEditingTag(tag);
    setFormData({ name: tag.name });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      errors.name = 'Tag name is required.';
    } else if (trimmedName.length > 100) {
      errors.name = 'Tag name must not exceed 100 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      await addTag({ name: formData.name.trim() });
      toast.success('Tag created successfully.');
      setIsAddModalOpen(false);
      setFormData({ name: '' });
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

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !validateForm()) return;

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      await updateTag(editingTag.id, { name: formData.name.trim() });
      toast.success('Tag updated successfully.');
      setEditingTag(null);
      setFormData({ name: '' });
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
    if (!deletingTag) return;

    setIsSubmitting(true);
    try {
      await deleteTag(deletingTag.id);
      toast.success('Tag deleted successfully.');
      setDeletingTag(null);
    } catch (err: unknown) {
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTags = React.useMemo(() => {
    if (!tagSearchQuery.trim()) return tags;
    const query = tagSearchQuery.toLowerCase().trim();
    return tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(query) ||
        tag.id.toLowerCase().includes(query)
    );
  }, [tags, tagSearchQuery]);

  const totalPages = Math.ceil(filteredTags.length / itemsPerPage) || 1;
  const paginatedTags = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTags.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTags, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <TagIcon className="h-6 w-6 text-primary" /> Tags Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage question classification and subject domain tags used across examinations and question banks.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTags()}
            disabled={isLoadingTags}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingTags ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 font-semibold"
          >
            <Plus className="h-4 w-4" /> Create Tag
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <TagIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Tags</p>
            <p className="text-2xl font-bold text-foreground">{tags.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filtered Results</p>
            <p className="text-2xl font-bold text-foreground">{filteredTags.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
            <Hash className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Taxonomy</p>
            <p className="text-2xl font-bold text-foreground">Global</p>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <SearchInput
          placeholder="Search tags by name or ID..."
          value={tagSearchQuery}
          onChange={(e) => {
            setTagSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          onClear={() => {
            setTagSearchQuery('');
            setCurrentPage(1);
          }}
        />
      </Card>

      {/* Error Alert */}
      {tagsError && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load tags</p>
              <p className="text-xs text-destructive/90">{tagsError}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchTags()}
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" /> Retry
          </Button>
        </div>
      )}

      {/* Tags Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Tag Name</th>
                <th className="px-4 py-3.5">Identifier (UUID)</th>
                <th className="px-4 py-3.5">Created Date</th>
                <th className="px-4 py-3.5">Last Updated</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingTags ? (
                // Loading Skeletons
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-6 w-28 bg-muted rounded-md" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-48 bg-muted rounded-sm" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 bg-muted rounded-sm" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 bg-muted rounded-sm" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-8 w-20 bg-muted rounded-md inline-block" />
                    </td>
                  </tr>
                ))
              ) : paginatedTags.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground mx-auto">
                        <TagIcon className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-foreground text-base">No Tags Found</p>
                      <p className="text-xs text-muted-foreground">
                        {tagSearchQuery.trim()
                          ? `No tags match your search keyword "${tagSearchQuery}".`
                          : 'There are currently no tags created in the system. Create your first tag to classify examination questions.'}
                      </p>
                      {!tagSearchQuery.trim() && (
                        <div className="pt-2">
                          <Button size="sm" onClick={handleOpenAddModal}>
                            <Plus className="h-4 w-4 mr-1.5" /> Create Tag
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                // Data Rows
                paginatedTags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-foreground">
                      <Badge variant="outline" className="font-semibold text-xs border-primary/30 text-primary bg-primary/5 py-0.5 px-2.5">
                        <Hash className="h-3 w-3 mr-1 text-primary" />
                        {tag.name}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                      {tag.id}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                        {new Date(tag.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                        {new Date(tag.updated_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(tag)}
                          title="Edit Tag"
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingTag(tag)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Delete Tag"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
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
        {!isLoadingTags && filteredTags.length > itemsPerPage && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * itemsPerPage, filteredTags.length)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{filteredTags.length}</span> tags
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

      {/* Create Tag Modal */}
      {isAddModalOpen && (
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent size="md" className="sm:max-w-md p-0 overflow-hidden">
            <form onSubmit={handleCreateSubmit}>
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Plus className="h-4 w-4" />
                  </div>
                  Create New Tag
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Add a new subject or taxonomy tag to categorize questions across the system.
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
                  <Label htmlFor="create-tag-name" required>
                    Tag Name
                  </Label>
                  <Input
                    id="create-tag-name"
                    placeholder="e.g. Data Structures, Calculus, AI"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ name: e.target.value });
                      if (fieldErrors.name) {
                        setFieldErrors((prev) => ({ ...prev, name: '' }));
                      }
                    }}
                    error={!!fieldErrors.name}
                    autoFocus
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-destructive font-medium">{fieldErrors.name}</p>
                  )}
                </div>
              </DialogBody>

              <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Tag'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Tag Modal */}
      {editingTag && (
        <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
          <DialogContent size="md" className="sm:max-w-md p-0 overflow-hidden">
            <form onSubmit={handleUpdateSubmit}>
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Edit2 className="h-4 w-4" />
                  </div>
                  Edit Tag
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update the name of tag &ldquo;{editingTag.name}&rdquo;.
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
                  <Label htmlFor="edit-tag-name" required>
                    Tag Name
                  </Label>
                  <Input
                    id="edit-tag-name"
                    placeholder="e.g. Data Structures"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ name: e.target.value });
                      if (fieldErrors.name) {
                        setFieldErrors((prev) => ({ ...prev, name: '' }));
                      }
                    }}
                    error={!!fieldErrors.name}
                    autoFocus
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-destructive font-medium">{fieldErrors.name}</p>
                  )}
                </div>
              </DialogBody>

              <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTag(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deletingTag}
        onOpenChange={(open) => {
          if (!open) setDeletingTag(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Tag"
        description={`Are you sure you want to delete the tag "${deletingTag?.name}"? Questions tagged with this tag will have it removed.`}
        confirmLabel="Delete Tag"
        destructive
        loading={isSubmitting}
      />
    </div>
  );
}
