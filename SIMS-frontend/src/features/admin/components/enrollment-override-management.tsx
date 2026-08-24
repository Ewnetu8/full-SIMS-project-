'use client';

import {
  ShieldCheck,
  Plus,
  Trash2,
  Eye,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Layers,
  GraduationCap,
  CheckCircle2,
  XCircle,
  UserCheck,
  FileText,
  Clock,
  Search,
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
  SearchInput,
} from '@/components/ui';
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';

import { useAdminStore } from '../store';

import type { CreateEnrollmentOverridePayload, EnrollmentOverride, OverrideType } from '../types';

const OVERRIDE_TYPES: {
  value: OverrideType;
  label: string;
  badgeClass: string;
  description: string;
}[] = [
  {
    value: 'PREREQUISITE',
    label: 'Prerequisite',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    description: 'Bypasses required course prerequisite completion check.',
  },
  {
    value: 'STANDING',
    label: 'Class Standing',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    description: 'Allows enrollment in courses intended for a different student class standing.',
  },
  {
    value: 'CREDIT_LIMIT',
    label: 'Credit Limit',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    description: 'Permits student to exceed maximum or fall below minimum credit-hour boundaries.',
  },
  {
    value: 'DUPLICATE',
    label: 'Duplicate Enrollment',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    description: 'Enables repeated or concurrent enrollment in equivalent course sections.',
  },
];

export function EnrollmentOverrideManagement() {
  const {
    enrollmentOverrides,
    isLoadingEnrollmentOverrides,
    enrollmentOverridesError,
    enrollmentOverrideSearchQuery,
    students,
    isLoadingStudents,
    studentsError,
    semesters,
    isLoadingSemesters,
    semestersError,
    academicYears,
    users,
    isLoadingUsers,
    fetchEnrollmentOverrides,
    fetchStudents,
    fetchSemesters,
    fetchAcademicYears,
    fetchUsers,
    addEnrollmentOverride,
    deleteEnrollmentOverride,
    setEnrollmentOverrideSearchQuery,
  } = useAdminStore();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedOverrideForDetails, setSelectedOverrideForDetails] = React.useState<EnrollmentOverride | null>(null);
  const [deletingOverride, setDeletingOverride] = React.useState<EnrollmentOverride | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState<{
    student: string;
    semester: string;
    override_type: OverrideType | '';
    approved_by: string;
    reason: string;
    is_active: boolean;
  }>({
    student: '',
    semester: '',
    override_type: 'PREREQUISITE',
    approved_by: '',
    reason: '',
    is_active: true,
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  // Initial Data Fetch
  React.useEffect(() => {
    void fetchEnrollmentOverrides();
    void fetchStudents();
    void fetchSemesters();
    void fetchAcademicYears();
    void fetchUsers();
  }, [fetchEnrollmentOverrides, fetchStudents, fetchSemesters, fetchAcademicYears, fetchUsers]);

  // Lookup helpers
  const getStudentDisplay = React.useCallback(
    (studentId: string) => {
      const found = students.find((s) => s.id === studentId);
      if (found) {
        return {
          id: found.id,
          identifier: found.student_identifier || 'Unknown ID',
          fullName: found.user_full_name || 'Unnamed Student',
          email: found.user_email || '',
          classStanding: found.class_standing || '',
        };
      }
      return {
        id: studentId,
        identifier: 'Student ID: ' + (studentId.length > 8 ? studentId.slice(0, 8) + '...' : studentId),
        fullName: 'Registered Student',
        email: '',
        classStanding: '',
      };
    },
    [students]
  );

  const getSemesterDisplay = React.useCallback(
    (semesterId: string) => {
      const found = semesters.find((s) => s.id === semesterId);
      if (found) {
        let yearLabel = found.academicYearDetail?.displayLabel;
        if (!yearLabel) {
          const matchedYear = academicYears.find((ay) => ay.id === found.academicYear);
          yearLabel = matchedYear?.displayLabel || found.academicYear || 'Academic Year';
        }

        const semIndex = found.semesterIndex || 'Semester';
        return {
          id: found.id,
          label: `${yearLabel} • ${semIndex} Sem`,
          year: yearLabel,
          semesterIndex: semIndex,
        };
      }
      return {
        id: semesterId,
        label: 'Semester (' + (semesterId.length > 8 ? semesterId.slice(0, 8) + '...' : semesterId) + ')',
        year: 'Academic Period',
        semesterIndex: '',
      };
    },
    [semesters, academicYears]
  );

  const getUserDisplay = React.useCallback(
    (userId?: string | null) => {
      if (!userId) return null;
      const found = users.find((u) => u.id === userId);
      if (found) {
        const nameParts = [found.first_name, found.last_name].filter(Boolean);
        const name = nameParts.length > 0 ? nameParts.join(' ') : found.email;
        return {
          id: found.id,
          name,
          email: found.email,
        };
      }
      return {
        id: userId,
        name: 'Administrator',
        email: '',
      };
    },
    [users]
  );

  const getOverrideTypeConfig = React.useCallback((type?: string) => {
    const matched = OVERRIDE_TYPES.find((ot) => ot.value.toUpperCase() === String(type).toUpperCase());
    if (matched) return matched;
    return {
      value: (type || 'PREREQUISITE') as OverrideType,
      label: type || 'Override',
      badgeClass: 'bg-primary/10 text-primary border-primary/30',
      description: 'Administrative rule override.',
    };
  }, []);

  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormError(null);
    setFormData({
      student: '',
      semester: '',
      override_type: 'PREREQUISITE',
      approved_by: '',
      reason: '',
      is_active: true,
    });
    setIsAddModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    setFormError(null);

    if (!formData.student) {
      errors.student = 'Please select a registered student.';
    }

    if (!formData.semester) {
      errors.semester = 'Please select an academic semester.';
    }

    // Duplicate Check
    if (formData.student && formData.semester && formData.override_type) {
      const existing = enrollmentOverrides.find(
        (o) =>
          o.student === formData.student &&
          o.semester === formData.semester &&
          o.override_type === formData.override_type
      );
      if (existing) {
        const typeLabel = getOverrideTypeConfig(formData.override_type).label;
        const msg = `An enrollment override of type "${typeLabel}" already exists for this student and semester.`;
        errors.override_type = msg;
        setFormError(msg);
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload: CreateEnrollmentOverridePayload = {
        student: formData.student.trim(),
        semester: formData.semester.trim(),
        override_type: (formData.override_type as OverrideType) || 'PREREQUISITE',
        is_active: formData.is_active,
      };

      if (formData.approved_by && formData.approved_by.trim()) {
        payload.approved_by = formData.approved_by.trim();
      }

      if (formData.reason && formData.reason.trim()) {
        payload.reason = formData.reason.trim();
      }

      await addEnrollmentOverride(payload);
      toast.success('Enrollment override created successfully.');
      setIsAddModalOpen(false);
      void fetchEnrollmentOverrides();
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

  const handleDeleteOverride = async () => {
    if (!deletingOverride) return;
    setIsDeleting(true);
    try {
      await deleteEnrollmentOverride(deletingOverride.id);
      toast.success('Enrollment override deleted successfully.');
      setDeletingOverride(null);
      void fetchEnrollmentOverrides();
    } catch (err: unknown) {
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  // Search Filtering
  const approverUsers = React.useMemo(() => {
    return users.filter((user) => String(user.role).toUpperCase() === 'LECTURER');
  }, [users]);

  const filteredOverrides = React.useMemo(() => {
    const q = enrollmentOverrideSearchQuery.toLowerCase().trim();
    if (!q) return enrollmentOverrides;

    return enrollmentOverrides.filter((override) => {
      const student = getStudentDisplay(override.student);
      const semester = getSemesterDisplay(override.semester);
      const typeConfig = getOverrideTypeConfig(override.override_type);

      const studentMatch =
        student.identifier.toLowerCase().includes(q) ||
        student.fullName.toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q);

      const semesterMatch = semester.label.toLowerCase().includes(q);
      const typeMatch =
        typeConfig.label.toLowerCase().includes(q) ||
        typeConfig.value.toLowerCase().includes(q);

      const reasonMatch = override.reason ? override.reason.toLowerCase().includes(q) : false;

      return studentMatch || semesterMatch || typeMatch || reasonMatch;
    });
  }, [
    enrollmentOverrides,
    enrollmentOverrideSearchQuery,
    getStudentDisplay,
    getSemesterDisplay,
    getOverrideTypeConfig,
  ]);

  const selectClass =
    'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-hidden focus:ring-2 focus:ring-ring text-foreground transition-all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#102A7A] dark:text-[#D4AF37]" /> Enrollment Overrides
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage exceptional enrollment approvals and rule overrides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void fetchEnrollmentOverrides();
              void fetchStudents();
              void fetchSemesters();
              void fetchUsers();
            }}
            disabled={isLoadingEnrollmentOverrides}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoadingEnrollmentOverrides ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleOpenAddModal}
            className="bg-[#102A7A] text-white hover:bg-[#102A7A]/90 dark:bg-[#D4AF37] dark:text-[#102A7A] dark:hover:bg-[#D4AF37]/90 font-medium shadow-xs"
          >
            Create Override
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border-border/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <SearchInput
              placeholder="Search by student identifier, name, semester, override type, or reason..."
              value={enrollmentOverrideSearchQuery}
              onChange={(e) => setEnrollmentOverrideSearchQuery(e.target.value)}
              onClear={() => setEnrollmentOverrideSearchQuery('')}
            />
          </div>
          {filteredOverrides.length > 0 && (
            <div className="text-xs text-muted-foreground shrink-0 font-medium">
              Showing {filteredOverrides.length} of {enrollmentOverrides.length} override{enrollmentOverrides.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
      </Card>

      {/* Error state if fetch failed */}
      {enrollmentOverridesError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{enrollmentOverridesError}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchEnrollmentOverrides()}
            className="border-destructive/30 hover:bg-destructive/20 text-destructive text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Overrides Table */}
      <Card className="overflow-hidden border-border/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Student</th>
                <th className="px-4 py-3.5">Semester</th>
                <th className="px-4 py-3.5">Override Type</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Reason</th>
                <th className="px-4 py-3.5">Created Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingEnrollmentOverrides ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#102A7A] dark:border-[#D4AF37] border-t-transparent" />
                      <span className="font-medium text-foreground">Loading enrollment overrides...</span>
                      <span className="text-xs text-muted-foreground">Fetching academic policy exceptions</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOverrides.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      {enrollmentOverrides.length === 0 ? (
                        <>
                          <h3 className="text-base font-semibold text-foreground">No Enrollment Overrides</h3>
                          <p className="text-xs text-muted-foreground text-center">
                            No enrollment exceptions have been configured yet. Authorize policy waivers for prerequisites, standing, or credit limits.
                          </p>
                          <Button
                            leftIcon={<Plus className="h-4 w-4" />}
                            onClick={handleOpenAddModal}
                            className="mt-2 bg-[#102A7A] text-white hover:bg-[#102A7A]/90 dark:bg-[#D4AF37] dark:text-[#102A7A] text-xs font-medium"
                          >
                            Create Override
                          </Button>
                        </>
                      ) : (
                        <>
                          <h3 className="text-base font-semibold text-foreground">No matching overrides found</h3>
                          <p className="text-xs text-muted-foreground text-center">
                            No enrollment overrides matched &quot;{enrollmentOverrideSearchQuery}&quot;. Try clearing your search.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEnrollmentOverrideSearchQuery('')}
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
                filteredOverrides.map((override) => {
                  const student = getStudentDisplay(override.student);
                  const semester = getSemesterDisplay(override.semester);
                  const typeConfig = getOverrideTypeConfig(override.override_type);
                  const isActive = override.is_active !== false;

                  const formattedDate = override.created_at || override.createdAt
                    ? new Date(override.created_at || override.createdAt || '').toLocaleDateString(
                        undefined,
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )
                    : '—';

                  return (
                    <tr key={override.id} className="hover:bg-accent/40 transition-colors group">
                      {/* Student */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <div className="font-medium text-foreground flex items-center gap-1.5">
                            <span>{student.fullName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                            <span className="bg-muted px-1.5 py-0.5 rounded-sm">{student.identifier}</span>
                            {student.classStanding && (
                              <span className="text-[11px] text-muted-foreground/80">• {student.classStanding}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Semester */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                          <span>{semester.label}</span>
                        </div>
                      </td>

                      {/* Override Type */}
                      <td className="px-4 py-3.5">
                        <Badge variant="outline" className={`font-semibold text-xs ${typeConfig.badgeClass}`}>
                          {typeConfig.label}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {isActive ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-medium inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-muted text-muted-foreground border-border text-xs font-medium inline-flex items-center gap-1"
                          >
                            <XCircle className="h-3 w-3" /> Inactive
                          </Badge>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="text-xs text-muted-foreground truncate" title={override.reason || 'No reason provided'}>
                          {override.reason || <span className="italic opacity-60">None provided</span>}
                        </p>
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">
                        {formattedDate}
                      </td>

                      {/* Actions: Inspect Details, Delete (Strictly NO Edit) */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => setSelectedOverrideForDetails(override)}
                            aria-label="View override details"
                            title="Inspect Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingOverride(override)}
                            aria-label="Delete override"
                            title="Delete Override"
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

      {/* Create Override Modal */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsAddModalOpen(false);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#102A7A] dark:text-foreground font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#102A7A] dark:text-[#D4AF37]" /> Create Enrollment Override
            </DialogTitle>
            <DialogDescription>
              Authorize an academic policy waiver for a student in a specific semester.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOverride}>
            <DialogBody className="space-y-4 py-3">
              {formError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Student Select */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="createStudentSelect" required>
                    Student
                  </Label>
                  {students.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">{students.length} available</span>
                  )}
                </div>

                {isLoadingStudents ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4 animate-spin text-primary shrink-0" />
                    <span>Loading student directory...</span>
                  </div>
                ) : studentsError ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                    <span className="truncate">Unable to load students.</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs shrink-0"
                      onClick={() => void fetchStudents()}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Retry
                    </Button>
                  </div>
                ) : (
                  <select
                    id="createStudentSelect"
                    className={`${selectClass} ${
                      fieldErrors.student
                        ? 'border-destructive focus:ring-destructive'
                        : 'focus:border-[#102A7A] focus:ring-[#D4AF37]/50'
                    }`}
                    value={formData.student}
                    onChange={(e) => {
                      setFormData({ ...formData, student: e.target.value });
                      if (fieldErrors.student) {
                        setFieldErrors((prev) => ({ ...prev, student: '' }));
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <option value="">-- Select Registered Student --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.student_identifier} — {st.user_full_name || st.user_email} ({st.class_standing})
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.student && (
                  <p className="text-xs text-destructive mt-1 font-medium">{fieldErrors.student}</p>
                )}
              </div>

              {/* Semester Select */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="createSemesterSelect" required>
                    Semester
                  </Label>
                  {semesters.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">{semesters.length} available</span>
                  )}
                </div>

                {isLoadingSemesters ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4 animate-spin text-primary shrink-0" />
                    <span>Loading academic semesters...</span>
                  </div>
                ) : semestersError ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                    <span className="truncate">Unable to load semesters.</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs shrink-0"
                      onClick={() => void fetchSemesters()}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Retry
                    </Button>
                  </div>
                ) : (
                  <select
                    id="createSemesterSelect"
                    className={`${selectClass} ${
                      fieldErrors.semester
                        ? 'border-destructive focus:ring-destructive'
                        : 'focus:border-[#102A7A] focus:ring-[#D4AF37]/50'
                    }`}
                    value={formData.semester}
                    onChange={(e) => {
                      setFormData({ ...formData, semester: e.target.value });
                      if (fieldErrors.semester) {
                        setFieldErrors((prev) => ({ ...prev, semester: '' }));
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <option value="">-- Select Academic Semester --</option>
                    {semesters.map((sem) => {
                      const semDisplay = getSemesterDisplay(sem.id);
                      return (
                        <option key={sem.id} value={sem.id}>
                          {semDisplay.label}
                        </option>
                      );
                    })}
                  </select>
                )}
                {fieldErrors.semester && (
                  <p className="text-xs text-destructive mt-1 font-medium">{fieldErrors.semester}</p>
                )}
              </div>

              {/* Override Type Select */}
              <div>
                <Label htmlFor="createOverrideTypeSelect" required>
                  Override Type
                </Label>
                <select
                  id="createOverrideTypeSelect"
                  className={`${selectClass} ${
                    fieldErrors.override_type
                      ? 'border-destructive focus:ring-destructive'
                      : 'focus:border-[#102A7A] focus:ring-[#D4AF37]/50'
                  }`}
                  value={formData.override_type}
                  onChange={(e) => {
                    setFormData({ ...formData, override_type: e.target.value as OverrideType });
                    if (fieldErrors.override_type) {
                      setFieldErrors((prev) => ({ ...prev, override_type: '' }));
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {OVERRIDE_TYPES.map((ot) => (
                    <option key={ot.value} value={ot.value}>
                      {ot.label} — {ot.description}
                    </option>
                  ))}
                </select>
                {fieldErrors.override_type && (
                  <p className="text-xs text-destructive mt-1 font-medium">{fieldErrors.override_type}</p>
                )}
              </div>

              {/* Approved By Select (Optional - Lecturers Only) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="createApprovedBySelect">
                    Approved By <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
                  </Label>
                  {approverUsers.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      {approverUsers.length} lecturer{approverUsers.length === 1 ? '' : 's'} available
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  Academic faculty / lecturer authorizing this waiver.
                </p>
                <select
                  id="createApprovedBySelect"
                  className={selectClass}
                  value={formData.approved_by}
                  onChange={(e) => setFormData({ ...formData, approved_by: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="">-- Leave Unassigned / System Default --</option>
                  {approverUsers.map((u) => {
                    const uDisp = getUserDisplay(u.id);
                    return (
                      <option key={u.id} value={u.id}>
                        {uDisp?.name || u.email} (Lecturer)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Reason Textarea */}
              <div>
                <Label htmlFor="createReasonTextarea">
                  Reason <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
                </Label>
                <textarea
                  id="createReasonTextarea"
                  rows={3}
                  placeholder="Explain why this enrollment rule override was approved..."
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-hidden focus:ring-2 focus:ring-ring text-foreground transition-all resize-y"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Active Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="createIsActiveCheckbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  disabled={isSubmitting}
                  className="h-4 w-4 rounded-sm border-input text-primary focus:ring-primary"
                />
                <Label htmlFor="createIsActiveCheckbox" className="text-sm font-medium cursor-pointer">
                  Activate override immediately upon creation
                </Label>
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
                  'Create Override'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog
        open={!!selectedOverrideForDetails}
        onOpenChange={(open) => {
          if (!open) setSelectedOverrideForDetails(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Enrollment Override Details
            </DialogTitle>
            <DialogDescription>
              Complete record of academic rule waiver and approval status.
            </DialogDescription>
          </DialogHeader>

          {selectedOverrideForDetails && (() => {
            const student = getStudentDisplay(selectedOverrideForDetails.student);
            const semester = getSemesterDisplay(selectedOverrideForDetails.semester);
            const typeConfig = getOverrideTypeConfig(selectedOverrideForDetails.override_type);
            const approver = getUserDisplay(selectedOverrideForDetails.approved_by);
            const isActive = selectedOverrideForDetails.is_active !== false;

            return (
              <DialogBody className="space-y-4 py-2">
                {/* Student Card */}
                <div className="rounded-lg border border-border bg-card p-3.5 space-y-1.5">
                  <div className="text-xs text-muted-foreground font-medium">Target Student</div>
                  <div className="flex items-center justify-between">
                    <div className="text-base font-bold text-foreground">{student.fullName}</div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {student.identifier}
                    </Badge>
                  </div>
                  {student.classStanding && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" /> Class Standing: {student.classStanding}
                    </div>
                  )}
                </div>

                {/* Grid Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Academic Semester</div>
                    <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{semester.label}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Override Status</div>
                    <div>
                      {isActive ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-medium inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-muted text-muted-foreground border-border text-xs font-medium inline-flex items-center gap-1"
                        >
                          <XCircle className="h-3 w-3" /> Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Override Type Box */}
                <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1.5">
                  <div className="text-xs text-muted-foreground font-medium">Override Policy Type</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`font-semibold text-xs ${typeConfig.badgeClass}`}>
                      {typeConfig.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{typeConfig.description}</p>
                </div>

                {/* Reason & Approver */}
                <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2 text-xs">
                  <div>
                    <div className="text-muted-foreground font-medium flex items-center gap-1 mb-0.5">
                      <UserCheck className="h-3.5 w-3.5 text-primary" /> Approved By:
                    </div>
                    <div className="text-foreground font-medium">
                      {approver ? `${approver.name} (${approver.email})` : 'System Record / Unassigned'}
                    </div>
                  </div>

                  <div>
                    <div className="text-muted-foreground font-medium flex items-center gap-1 mb-0.5">
                      <FileText className="h-3.5 w-3.5 text-primary" /> Reason / Rationale:
                    </div>
                    <p className="text-foreground whitespace-pre-wrap bg-background/60 p-2 rounded-md border border-border/50">
                      {selectedOverrideForDetails.reason || 'No specific rationale provided.'}
                    </p>
                  </div>
                </div>

                {/* Timestamps & Identifier */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" /> Override ID:
                    </span>
                    <span className="font-mono text-[11px]">{selectedOverrideForDetails.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Created At:
                    </span>
                    <span className="font-mono text-[11px]">
                      {selectedOverrideForDetails.created_at || selectedOverrideForDetails.createdAt || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Last Updated:
                    </span>
                    <span className="font-mono text-[11px]">
                      {selectedOverrideForDetails.updated_at || selectedOverrideForDetails.updatedAt || 'N/A'}
                    </span>
                  </div>
                </div>
              </DialogBody>
            );
          })()}

          <DialogFooter className="pt-3 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setSelectedOverrideForDetails(null)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingOverride}
        onOpenChange={(open) => {
          if (!open) setDeletingOverride(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <DialogTitle className="text-lg font-bold">Delete Enrollment Override?</DialogTitle>
            </div>
            {deletingOverride && (() => {
              const student = getStudentDisplay(deletingOverride.student);
              const semester = getSemesterDisplay(deletingOverride.semester);
              const typeConfig = getOverrideTypeConfig(deletingOverride.override_type);

              return (
                <div className="pt-2 text-sm text-muted-foreground space-y-3">
                  <p>
                    Are you sure you want to delete this enrollment override?
                  </p>

                  <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-xs space-y-1.5 font-medium text-foreground">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Student:</span>
                      <span className="font-semibold text-foreground">
                        {student.fullName} ({student.identifier})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Semester:</span>
                      <span className="font-medium text-foreground">{semester.label}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Override:</span>
                      <Badge variant="outline" className={`text-[11px] ${typeConfig.badgeClass}`}>
                        {typeConfig.label}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    This will remove the override and restore standard academic rule validation for this student during course enrollment.
                  </p>
                </div>
              );
            })()}
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setDeletingOverride(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOverride}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </span>
              ) : (
                'Delete Override'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
