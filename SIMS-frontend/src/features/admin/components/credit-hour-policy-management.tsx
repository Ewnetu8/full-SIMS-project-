'use client';

import {
  Scale,
  Plus,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
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
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';

import { useAdminStore } from '../store';

import type { ClassStanding, CreditHourPolicy } from '../types';

const CLASS_STANDINGS: { value: ClassStanding; label: string; badgeClass: string }[] = [
  {
    value: 'FRESHMAN',
    label: 'Freshman',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  {
    value: 'SOPHOMORE',
    label: 'Sophomore',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  {
    value: 'JUNIOR',
    label: 'Junior',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  {
    value: 'SENIOR',
    label: 'Senior',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
];

export function CreditHourPolicyManagement() {
  const {
    creditHourPolicies,
    isLoadingCreditHourPolicies,
    creditHourPoliciesError,
    creditHourPolicySearchQuery,
    fetchCreditHourPolicies,
    addCreditHourPolicy,
    updateCreditHourPolicy,
    deleteCreditHourPolicy,
    setCreditHourPolicySearchQuery,
  } = useAdminStore();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingPolicy, setEditingPolicy] = React.useState<CreditHourPolicy | null>(null);
  const [selectedPolicyForDetails, setSelectedPolicyForDetails] = React.useState<CreditHourPolicy | null>(null);
  const [deletingPolicy, setDeletingPolicy] = React.useState<CreditHourPolicy | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState<{
    class_standing: ClassStanding | '';
    min_credit_hours: string;
    max_credit_hours: string;
  }>({
    class_standing: '',
    min_credit_hours: '',
    max_credit_hours: '',
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  // Initial Data Fetch
  React.useEffect(() => {
    void fetchCreditHourPolicies();
  }, [fetchCreditHourPolicies]);

  const getClassStandingConfig = React.useCallback((standing: string) => {
    const matched = CLASS_STANDINGS.find(
      (cs) => cs.value.toUpperCase() === String(standing).toUpperCase()
    );
    if (matched) return matched;
    return {
      value: standing as ClassStanding,
      label: standing.charAt(0).toUpperCase() + standing.slice(1).toLowerCase(),
      badgeClass: 'bg-primary/10 text-primary border-primary/30',
    };
  }, []);

  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormError(null);
    setFormData({
      class_standing: '',
      min_credit_hours: '',
      max_credit_hours: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (policy: CreditHourPolicy) => {
    setFieldErrors({});
    setFormError(null);
    setEditingPolicy(policy);
    setFormData({
      class_standing: policy.class_standing,
      min_credit_hours: policy.min_credit_hours !== undefined ? String(policy.min_credit_hours) : '',
      max_credit_hours: policy.max_credit_hours !== undefined ? String(policy.max_credit_hours) : '',
    });
  };

  const validateForm = (isEditing = false): boolean => {
    const errors: Record<string, string> = {};
    setFormError(null);

    if (!formData.class_standing) {
      errors.class_standing = 'Please select a student class standing.';
    }

    const minNum = formData.min_credit_hours.trim() !== '' ? Number(formData.min_credit_hours) : undefined;
    const maxNum = formData.max_credit_hours.trim() !== '' ? Number(formData.max_credit_hours) : undefined;

    if (minNum !== undefined) {
      if (isNaN(minNum) || minNum < 0) {
        errors.min_credit_hours = 'Minimum credit hours must be greater than or equal to 0.';
      }
    }

    if (maxNum !== undefined) {
      if (isNaN(maxNum) || maxNum < 0) {
        errors.max_credit_hours = 'Maximum credit hours must be greater than or equal to 0.';
      }
    }

    if (minNum !== undefined && maxNum !== undefined && !isNaN(minNum) && !isNaN(maxNum)) {
      if (minNum > maxNum) {
        errors.min_credit_hours = 'Minimum credit hours cannot be greater than maximum credit hours.';
        setFormError('Minimum credit hours cannot exceed maximum credit hours.');
      }
    }

    // Duplicate Check
    if (formData.class_standing) {
      const existing = creditHourPolicies.find(
        (p) =>
          p.class_standing.toUpperCase() === formData.class_standing.toUpperCase() &&
          (!isEditing || (editingPolicy && p.id !== editingPolicy.id))
      );
      if (existing) {
        const standingLabel = getClassStandingConfig(formData.class_standing).label;
        const msg = `A credit-hour policy already exists for ${standingLabel}. Please edit the existing policy instead.`;
        errors.class_standing = msg;
        setFormError(msg);
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload: {
        class_standing: ClassStanding;
        min_credit_hours?: number;
        max_credit_hours?: number;
      } = {
        class_standing: formData.class_standing as ClassStanding,
      };

      if (formData.min_credit_hours.trim() !== '') {
        payload.min_credit_hours = Number(formData.min_credit_hours);
      }
      if (formData.max_credit_hours.trim() !== '') {
        payload.max_credit_hours = Number(formData.max_credit_hours);
      }

      await addCreditHourPolicy(payload);
      toast.success('Credit hour policy created successfully.');
      setIsAddModalOpen(false);
      void fetchCreditHourPolicies();
    } catch (err: unknown) {
      const parsedErrors = parseFieldErrors(err);
      setFieldErrors(parsedErrors);
      const friendlyMsg = getUserFriendlyErrorMessage(err);
      setFormError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy || !validateForm(true)) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload: {
        class_standing: ClassStanding;
        min_credit_hours?: number;
        max_credit_hours?: number;
      } = {
        class_standing: formData.class_standing as ClassStanding,
      };

      if (formData.min_credit_hours.trim() !== '') {
        payload.min_credit_hours = Number(formData.min_credit_hours);
      }
      if (formData.max_credit_hours.trim() !== '') {
        payload.max_credit_hours = Number(formData.max_credit_hours);
      }

      await updateCreditHourPolicy(editingPolicy.id, payload);
      toast.success('Credit hour policy updated successfully.');
      setEditingPolicy(null);
      void fetchCreditHourPolicies();
    } catch (err: unknown) {
      const parsedErrors = parseFieldErrors(err);
      setFieldErrors(parsedErrors);
      const friendlyMsg = getUserFriendlyErrorMessage(err);
      setFormError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePolicy = async () => {
    if (!deletingPolicy) return;
    setIsDeleting(true);
    try {
      await deleteCreditHourPolicy(deletingPolicy.id);
      toast.success('Credit hour policy deleted successfully.');
      setDeletingPolicy(null);
      void fetchCreditHourPolicies();
    } catch (err: unknown) {
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  // Search Filtering
  const filteredPolicies = React.useMemo(() => {
    const q = creditHourPolicySearchQuery.toLowerCase().trim();
    if (!q) return creditHourPolicies;

    return creditHourPolicies.filter((policy) => {
      const config = getClassStandingConfig(policy.class_standing);
      const standingMatch =
        config.label.toLowerCase().includes(q) ||
        config.value.toLowerCase().includes(q);

      const minMatch = policy.min_credit_hours !== undefined && String(policy.min_credit_hours).includes(q);
      const maxMatch = policy.max_credit_hours !== undefined && String(policy.max_credit_hours).includes(q);

      return standingMatch || minMatch || maxMatch;
    });
  }, [creditHourPolicies, creditHourPolicySearchQuery, getClassStandingConfig]);

  const selectClass =
    'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-hidden focus:ring-2 focus:ring-ring text-foreground transition-all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <Scale className="h-6 w-6 text-[#102A7A] dark:text-[#D4AF37]" /> Credit Hour Policies
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure minimum and maximum credit-hour limits for each student class standing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchCreditHourPolicies()}
            disabled={isLoadingCreditHourPolicies}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoadingCreditHourPolicies ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleOpenAddModal}
            className="bg-[#102A7A] text-white hover:bg-[#102A7A]/90 dark:bg-[#D4AF37] dark:text-[#102A7A] dark:hover:bg-[#D4AF37]/90 font-medium shadow-xs"
          >
            Add Policy
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border-border/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <SearchInput
              placeholder="Search by class standing (Freshman, Sophomore, Junior, Senior)..."
              value={creditHourPolicySearchQuery}
              onChange={(e) => setCreditHourPolicySearchQuery(e.target.value)}
              onClear={() => setCreditHourPolicySearchQuery('')}
            />
          </div>
          {filteredPolicies.length > 0 && (
            <div className="text-xs text-muted-foreground shrink-0 font-medium">
              Showing {filteredPolicies.length} of {creditHourPolicies.length} polic{creditHourPolicies.length === 1 ? 'y' : 'ies'}
            </div>
          )}
        </div>
      </Card>

      {/* Error state if fetch failed */}
      {creditHourPoliciesError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{creditHourPoliciesError}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchCreditHourPolicies()}
            className="border-destructive/30 hover:bg-destructive/20 text-destructive text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Policies Table */}
      <Card className="overflow-hidden border-border/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Class Standing</th>
                <th className="px-4 py-3.5 text-center">Minimum Credit Hours</th>
                <th className="px-4 py-3.5 text-center">Maximum Credit Hours</th>
                <th className="px-4 py-3.5">Last Updated</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingCreditHourPolicies ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#102A7A] dark:border-[#D4AF37] border-t-transparent" />
                      <span className="font-medium text-foreground">Loading credit hour policies...</span>
                      <span className="text-xs text-muted-foreground">Fetching academic policy rules</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPolicies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Scale className="h-6 w-6" />
                      </div>
                      {creditHourPolicies.length === 0 ? (
                        <>
                          <h3 className="text-base font-semibold text-foreground">No Credit Hour Policies</h3>
                          <p className="text-xs text-muted-foreground text-center">
                            No credit-hour policies have been configured yet. Define baseline limits for student enrollment boundaries.
                          </p>
                          <Button
                            leftIcon={<Plus className="h-4 w-4" />}
                            onClick={handleOpenAddModal}
                            className="mt-2 bg-[#102A7A] text-white hover:bg-[#102A7A]/90 dark:bg-[#D4AF37] dark:text-[#102A7A] text-xs font-medium"
                          >
                            Add Policy
                          </Button>
                        </>
                      ) : (
                        <>
                          <h3 className="text-base font-semibold text-foreground">No matching policies found</h3>
                          <p className="text-xs text-muted-foreground text-center">
                            No credit hour policies matched &quot;{creditHourPolicySearchQuery}&quot;. Try clearing your search.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCreditHourPolicySearchQuery('')}
                            className="mt-2 text-xs"
                          >
                            Clear Search
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPolicies.map((policy) => {
                  const config = getClassStandingConfig(policy.class_standing);
                  const formattedDate = policy.updated_at || policy.updatedAt || policy.created_at || policy.createdAt
                    ? new Date(policy.updated_at || policy.updatedAt || policy.created_at || policy.createdAt || '').toLocaleDateString(
                        undefined,
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )
                    : '—';

                  return (
                    <tr key={policy.id} className="hover:bg-accent/40 transition-colors group">
                      {/* Class Standing */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`font-semibold text-xs ${config.badgeClass}`}>
                            {config.label}
                          </Badge>
                        </div>
                      </td>

                      {/* Min Credit Hours */}
                      <td className="px-4 py-3.5 text-center">
                        {policy.min_credit_hours !== undefined ? (
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {policy.min_credit_hours} <span className="text-xs text-muted-foreground font-normal">Cr.</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* Max Credit Hours */}
                      <td className="px-4 py-3.5 text-center">
                        {policy.max_credit_hours !== undefined ? (
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {policy.max_credit_hours} <span className="text-xs text-muted-foreground font-normal">Cr.</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Actions: View Details, Edit (PUT), Delete */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => setSelectedPolicyForDetails(policy)}
                            aria-label="View policy details"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => handleOpenEditModal(policy)}
                            aria-label="Edit policy"
                            title="Edit Policy"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingPolicy(policy)}
                            aria-label="Delete policy"
                            title="Delete Policy"
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
      </Card>

      {/* Create Policy Modal */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsAddModalOpen(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#102A7A] dark:text-foreground font-bold flex items-center gap-2">
              <Scale className="h-5 w-5 text-[#102A7A] dark:text-[#D4AF37]" /> Create Credit Hour Policy
            </DialogTitle>
            <DialogDescription>
              Specify minimum and maximum credit hours allowable during enrollment for a class standing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePolicy}>
            <DialogBody className="space-y-4 py-3">
              {formError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Class Standing Select */}
              <div>
                <Label htmlFor="createClassStanding" required>
                  Class Standing
                </Label>
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  The target academic standing level for this policy.
                </p>
                <select
                  id="createClassStanding"
                  className={`${selectClass} ${
                    fieldErrors.class_standing
                      ? 'border-destructive focus:ring-destructive'
                      : 'focus:border-[#102A7A] focus:ring-[#D4AF37]/50'
                  }`}
                  value={formData.class_standing}
                  onChange={(e) => {
                    setFormData({ ...formData, class_standing: e.target.value as ClassStanding });
                    if (fieldErrors.class_standing) {
                      setFieldErrors((prev) => ({ ...prev, class_standing: '' }));
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <option value="">-- Select Class Standing --</option>
                  {CLASS_STANDINGS.map((cs) => (
                    <option key={cs.value} value={cs.value}>
                      {cs.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.class_standing && (
                  <p className="text-xs text-destructive mt-1 font-medium">{fieldErrors.class_standing}</p>
                )}
              </div>

              {/* Minimum Credit Hours */}
              <div>
                <Label htmlFor="createMinCredits">Minimum Credit Hours</Label>
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  Minimum credits required (e.g. 12).
                </p>
                <Input
                  id="createMinCredits"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Enter minimum credit hours"
                  value={formData.min_credit_hours}
                  onChange={(e) => {
                    setFormData({ ...formData, min_credit_hours: e.target.value });
                    if (fieldErrors.min_credit_hours) {
                      setFieldErrors((prev) => ({ ...prev, min_credit_hours: '' }));
                    }
                  }}
                  disabled={isSubmitting}
                />
                {fieldErrors.min_credit_hours && (
                  <p className="text-xs text-destructive mt-1 font-medium">{fieldErrors.min_credit_hours}</p>
                )}
              </div>

              {/* Maximum Credit Hours */}
              <div>
                <Label htmlFor="createMaxCredits">Maximum Credit Hours</Label>
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  Maximum credits allowable without override (e.g. 21).
                </p>
                <Input
                  id="createMaxCredits"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Enter maximum credit hours"
                  value={formData.max_credit_hours}
                  onChange={(e) => {
                    setFormData({ ...formData, max_credit_hours: e.target.value });
                    if (fieldErrors.max_credit_hours) {
                      setFieldErrors((prev) => ({ ...prev, max_credit_hours: '' }));
                    }
                  }}
                  disabled={isSubmitting}
                />
                {fieldErrors.max_credit_hours && (
                  <p className="text-xs text-destructive mt-1 font-medium">{fieldErrors.max_credit_hours}</p>
                )}
              </div>
            </DialogBody>

            <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-medium px-5"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </span>
                ) : (
                  'Create Policy'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Policy Modal (Full PUT) */}
      <Dialog
        open={!!editingPolicy}
        onOpenChange={(open) => {
          if (!open) setEditingPolicy(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#102A7A] dark:text-foreground font-bold flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-[#102A7A] dark:text-[#D4AF37]" /> Edit Credit Hour Policy
            </DialogTitle>
            <DialogDescription>
              Update baseline credit-hour boundaries for {editingPolicy && getClassStandingConfig(editingPolicy.class_standing).label}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePolicy}>
            <DialogBody className="space-y-4 py-3">
              {formError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Class Standing Select */}
              <div>
                <Label htmlFor="editClassStanding" required>
                  Class Standing
                </Label>
                <select
                  id="editClassStanding"
                  className={`${selectClass} ${
                    fieldErrors.class_standing
                      ? 'border-destructive focus:ring-destructive'
                      : 'focus:border-[#102A7A] focus:ring-[#D4AF37]/50'
                  }`}
                  value={formData.class_standing}
                  onChange={(e) => {
                    setFormData({ ...formData, class_standing: e.target.value as ClassStanding });
                    if (fieldErrors.class_standing) {
                      setFieldErrors((prev) => ({ ...prev, class_standing: '' }));
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {CLASS_STANDINGS.map((cs) => (
                    <option key={cs.value} value={cs.value}>
                      {cs.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.class_standing && (
                  <p className="text-xs text-destructive mt-1 font-medium">{fieldErrors.class_standing}</p>
                )}
              </div>

              {/* Minimum Credit Hours */}
              <div>
                <Label htmlFor="editMinCredits">Minimum Credit Hours</Label>
                <Input
                  id="editMinCredits"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Enter minimum credit hours"
                  value={formData.min_credit_hours}
                  onChange={(e) => {
                    setFormData({ ...formData, min_credit_hours: e.target.value });
                    if (fieldErrors.min_credit_hours) {
                      setFieldErrors((prev) => ({ ...prev, min_credit_hours: '' }));
                    }
                  }}
                  disabled={isSubmitting}
                />
                {fieldErrors.min_credit_hours && (
                  <p className="text-xs text-destructive mt-1 font-medium">{fieldErrors.min_credit_hours}</p>
                )}
              </div>

              {/* Maximum Credit Hours */}
              <div>
                <Label htmlFor="editMaxCredits">Maximum Credit Hours</Label>
                <Input
                  id="editMaxCredits"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Enter maximum credit hours"
                  value={formData.max_credit_hours}
                  onChange={(e) => {
                    setFormData({ ...formData, max_credit_hours: e.target.value });
                    if (fieldErrors.max_credit_hours) {
                      setFieldErrors((prev) => ({ ...prev, max_credit_hours: '' }));
                    }
                  }}
                  disabled={isSubmitting}
                />
                {fieldErrors.max_credit_hours && (
                  <p className="text-xs text-destructive mt-1 font-medium">{fieldErrors.max_credit_hours}</p>
                )}
              </div>
            </DialogBody>

            <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingPolicy(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-medium px-5"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog
        open={!!selectedPolicyForDetails}
        onOpenChange={(open) => {
          if (!open) setSelectedPolicyForDetails(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" /> Credit Hour Policy Details
            </DialogTitle>
            <DialogDescription>
              Complete policy specification and enrollment limit boundaries.
            </DialogDescription>
          </DialogHeader>

          {selectedPolicyForDetails && (() => {
            const config = getClassStandingConfig(selectedPolicyForDetails.class_standing);

            return (
              <DialogBody className="space-y-4 py-2">
                {/* Standing Header Card */}
                <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Academic Standing</div>
                    <div className="text-lg font-bold text-foreground">{config.label}</div>
                  </div>
                  <Badge variant="outline" className={`font-semibold text-xs px-2.5 py-1 ${config.badgeClass}`}>
                    <GraduationCap className="h-3.5 w-3.5 mr-1" /> {config.value}
                  </Badge>
                </div>

                {/* Credit Limits Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border bg-muted/30 text-center space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Minimum Credits</div>
                    <div className="font-mono text-xl font-bold text-foreground">
                      {selectedPolicyForDetails.min_credit_hours !== undefined
                        ? selectedPolicyForDetails.min_credit_hours
                        : '—'}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Baseline floor</div>
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-muted/30 text-center space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Maximum Credits</div>
                    <div className="font-mono text-xl font-bold text-foreground">
                      {selectedPolicyForDetails.max_credit_hours !== undefined
                        ? selectedPolicyForDetails.max_credit_hours
                        : '—'}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Max threshold</div>
                  </div>
                </div>

                {/* Timestamps & Identifier */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" /> Policy ID:
                    </span>
                    <span className="font-mono text-[11px]">{selectedPolicyForDetails.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Created At:
                    </span>
                    <span className="font-mono text-[11px]">
                      {selectedPolicyForDetails.created_at || selectedPolicyForDetails.createdAt || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Last Updated:
                    </span>
                    <span className="font-mono text-[11px]">
                      {selectedPolicyForDetails.updated_at || selectedPolicyForDetails.updatedAt || 'N/A'}
                    </span>
                  </div>
                </div>
              </DialogBody>
            );
          })()}

          <DialogFooter className="pt-3 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setSelectedPolicyForDetails(null)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingPolicy}
        onOpenChange={(open) => {
          if (!open) setDeletingPolicy(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <DialogTitle className="text-lg font-bold">Delete Credit Hour Policy?</DialogTitle>
            </div>
            {deletingPolicy && (() => {
              const config = getClassStandingConfig(deletingPolicy.class_standing);

              return (
                <div className="pt-2 text-sm text-muted-foreground space-y-3">
                  <p>
                    Are you sure you want to delete the <strong className="text-foreground font-semibold">{config.label}</strong> credit-hour policy?
                  </p>

                  <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-xs space-y-1 font-medium text-foreground">
                    <div className="flex items-center justify-between">
                      <span className="text-destructive font-semibold">{config.label} Standing</span>
                      <span className="font-mono text-muted-foreground">
                        {deletingPolicy.min_credit_hours ?? '—'} - {deletingPolicy.max_credit_hours ?? '—'} Credits
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>This may affect student course enrollment validation and credit boundaries.</span>
                  </p>
                </div>
              );
            })()}
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setDeletingPolicy(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePolicy}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </span>
              ) : (
                'Delete Policy'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
