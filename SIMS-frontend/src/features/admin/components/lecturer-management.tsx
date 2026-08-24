'use client';

import {
  UserCheck,
  Eye,
  Edit2,
  Building,
  Mail,
  Calendar,
  Clock,
  Shield,
  RefreshCw,
  AlertCircle,
  School,
} from 'lucide-react';
import * as React from 'react';

import { toast } from '@/components/feedback';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  SearchInput,
} from '@/components/ui';
import { parseFieldErrors, getUserFriendlyErrorMessage } from '@/lib/errors';

import { useAdminStore } from '../store';

import type {
  ApiLecturerListItem,
  ApiLecturerDetail,
  UpdateLecturerPayload,
} from '../types';

export function LecturerManagement() {
  const {
    lecturers,
    departments,
    colleges,
    isLoadingLecturers,
    lecturersError,
    lecturerSearchQuery,
    lecturerDeptFilter,
    fetchLecturers,
    fetchLecturerById,
    updateLecturer,
    fetchDepartments,
    fetchColleges,
    setLecturerSearchQuery,
    setLecturerDeptFilter,
  } = useAdminStore();

  // Local college filter to narrow down department dropdown
  const [lecturerCollegeFilter, setLecturerCollegeFilter] = React.useState<string>('ALL');

  // Search input with debounce
  const [localSearch, setLocalSearch] = React.useState(lecturerSearchQuery);

  // Modals state
  const [viewingLecturerId, setViewingLecturerId] = React.useState<string | null>(null);
  const [viewingLecturerDetail, setViewingLecturerDetail] = React.useState<ApiLecturerDetail | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);

  const [editingLecturer, setEditingLecturer] = React.useState<ApiLecturerListItem | null>(null);
  const [editForm, setEditForm] = React.useState<{
    faculty_identifier: string;
    department_id: string;
  }>({
    faculty_identifier: '',
    department_id: '',
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [editErrors, setEditErrors] = React.useState<Record<string, string>>({});
  const [editFormError, setEditFormError] = React.useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Immediate initial load on mount
  React.useEffect(() => {
    fetchDepartments();
    fetchColleges();
    fetchLecturers({
      search: localSearch,
      department: lecturerDeptFilter,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search effect when typing in search input
  const isFirstSearchRun = React.useRef(true);
  React.useEffect(() => {
    if (isFirstSearchRun.current) {
      isFirstSearchRun.current = false;
      return;
    }

    const timer = setTimeout(() => {
      setLecturerSearchQuery(localSearch);
      fetchLecturers({
        search: localSearch,
        department: lecturerDeptFilter,
      });
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [localSearch, lecturerDeptFilter, fetchLecturers, setLecturerSearchQuery]);

  const handleDepartmentChange = (newDept: string) => {
    setLecturerDeptFilter(newDept);
    setCurrentPage(1);
    fetchLecturers({
      search: localSearch,
      department: newDept,
    });
  };

  const handleCollegeChange = (newCollege: string) => {
    setLecturerCollegeFilter(newCollege);
    setLecturerDeptFilter('ALL');
    setCurrentPage(1);
    fetchLecturers({
      search: localSearch,
      department: 'ALL',
    });
  };

  // Filter departments dropdown by selected college
  const filteredDepartments = React.useMemo(() => {
    if (!lecturerCollegeFilter || lecturerCollegeFilter === 'ALL') return departments;
    return departments.filter(
      (d) =>
        d.college === lecturerCollegeFilter ||
        colleges.find((c) => c.name === lecturerCollegeFilter || c.code === lecturerCollegeFilter)?.id === d.college
    );
  }, [departments, colleges, lecturerCollegeFilter]);

  // Open Details Modal
  const handleOpenDetails = async (lecturer: ApiLecturerListItem) => {
    setViewingLecturerId(lecturer.id);
    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      const detail = await fetchLecturerById(lecturer.id);
      setViewingLecturerDetail(detail);
    } catch (err: unknown) {
      setProfileError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (lecturer: ApiLecturerListItem) => {
    setEditingLecturer(lecturer);
    setEditForm({
      faculty_identifier: lecturer.faculty_identifier,
      department_id: lecturer.department || '',
    });
    setEditErrors({});
    setEditFormError(null);
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLecturer) return;

    setIsSaving(true);
    setEditErrors({});
    setEditFormError(null);

    const payload: UpdateLecturerPayload = {
      faculty_identifier: editForm.faculty_identifier.trim(),
      department_id: editForm.department_id ? editForm.department_id : null,
    };

    try {
      await updateLecturer(editingLecturer.id, payload);
      toast.success('Lecturer profile updated successfully');
      setEditingLecturer(null);
      // Refresh list to update current table
      fetchLecturers({
        search: localSearch,
        department: lecturerDeptFilter,
      });
    } catch (err: unknown) {
      const parsedErrors = parseFieldErrors(err);
      if (Object.keys(parsedErrors).length > 0) {
        setEditErrors(parsedErrors);
      } else {
        setEditFormError(getUserFriendlyErrorMessage(err));
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(lecturers.length / itemsPerPage) || 1;
  const paginatedLecturers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return lecturers.slice(startIndex, startIndex + itemsPerPage);
  }, [lecturers, currentPage, itemsPerPage]);

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" /> Lecturer &amp; Faculty Directory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse and manage verified academic faculty records, faculty identifiers, and department affiliations.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <SearchInput
              placeholder="Search by faculty ID, name, or email..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onClear={() => {
                setLocalSearch('');
                setLecturerSearchQuery('');
                fetchLecturers({ search: '', department: lecturerDeptFilter });
              }}
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={lecturerCollegeFilter}
              aria-label="Filter by College"
              onChange={(e) => handleCollegeChange(e.target.value)}
            >
              <option value="ALL">All Colleges</option>
              {colleges.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className={selectClass}
              value={lecturerDeptFilter}
              aria-label="Filter by Department"
              onChange={(e) => handleDepartmentChange(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {filteredDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Error state alert */}
      {lecturersError && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load lecturers</p>
              <p className="text-xs text-destructive/90">{lecturersError}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              fetchLecturers({
                search: localSearch,
                department: lecturerDeptFilter,
              })
            }
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" /> Retry
          </Button>
        </div>
      )}

      {/* Lecturer List Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Faculty ID</th>
                <th className="px-4 py-3.5">Faculty Member</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">College</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingLecturers ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 bg-muted rounded-sm" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-32 bg-muted rounded-sm" />
                          <div className="h-3 w-40 bg-muted/60 rounded-sm" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 bg-muted rounded-sm" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 bg-muted rounded-sm" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-5 w-16 bg-muted rounded-full" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-8 w-24 bg-muted rounded-md inline-block" />
                    </td>
                  </tr>
                ))
              ) : paginatedLecturers.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <div className="max-w-md mx-auto space-y-2">
                      <UserCheck className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                      <p className="font-semibold text-foreground text-base">No Lecturers Found</p>
                      <p className="text-xs text-muted-foreground">
                        {localSearch || lecturerDeptFilter !== 'ALL' || lecturerCollegeFilter !== 'ALL'
                          ? 'No lecturer records match your active search and filter criteria.'
                          : 'There are currently no lecturer records available in the system.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Data rows
                paginatedLecturers.map((lec) => {
                  const deptName = lec.department_detail?.name || 'Unassigned';
                  const collegeName = lec.department_detail?.college_detail?.name || '—';
                  const initials = lec.user_full_name
                    ? lec.user_full_name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                    : 'LC';

                  return (
                    <tr key={lec.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-primary">
                        {lec.faculty_identifier}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {lec.user_full_name || 'Academic Faculty'}
                            </p>
                            <p className="text-xs text-muted-foreground">{lec.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[200px] truncate">
                        {deptName}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[200px] truncate">
                        {collegeName}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={lec.user_is_active ? 'success' : 'secondary'}
                          className="capitalize text-[11px]"
                        >
                          {lec.user_is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetails(lec)}
                            title="View full profile"
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(lec)}
                            title="Edit lecturer record"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
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

        {/* Pagination controls */}
        {!isLoadingLecturers && lecturers.length > itemsPerPage && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * itemsPerPage, lecturers.length)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{lecturers.length}</span> faculty members
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

      {/* Lecturer Profile Detail Modal */}
      {viewingLecturerId && (
        <Dialog open={!!viewingLecturerId} onOpenChange={() => setViewingLecturerId(null)}>
          <DialogContent size="3xl" className="sm:max-w-3xl w-[92vw] max-w-3xl p-0 overflow-hidden">
            <DialogHeader className="px-8 pt-7 pb-3">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                Faculty Member Profile
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Full academic profile details retrieved from the Lecturer Management API.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-6 px-8 py-5 max-h-[80vh] overflow-y-auto">
              {isLoadingProfile ? (
                <div className="space-y-4 py-8 animate-pulse">
                  <div className="h-20 bg-muted rounded-2xl" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-muted rounded-xl" />
                    <div className="h-20 bg-muted rounded-xl" />
                  </div>
                </div>
              ) : profileError ? (
                <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Unable to load lecturer profile</p>
                    <p className="text-xs">{profileError}</p>
                  </div>
                </div>
              ) : viewingLecturerDetail ? (
                <>
                  {/* Top Profile Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-2xl border border-border bg-muted/30 p-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl uppercase shadow-xs shrink-0">
                      {viewingLecturerDetail.user_first_name?.[0] || 'L'}
                      {viewingLecturerDetail.user_last_name?.[0] || 'M'}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h3 className="text-xl font-bold text-foreground">
                        Dr. {viewingLecturerDetail.user_first_name} {viewingLecturerDetail.user_last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 font-mono">
                        <Mail className="h-4 w-4 text-primary" /> {viewingLecturerDetail.user_email}
                      </p>
                      <div className="pt-1 flex items-center gap-2.5">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs font-bold border-primary/40 text-primary bg-primary/5"
                        >
                          Faculty ID: {viewingLecturerDetail.faculty_identifier}
                        </Badge>
                        <Badge
                          variant={viewingLecturerDetail.user_is_active ? 'success' : 'secondary'}
                          className="capitalize text-xs"
                        >
                          {viewingLecturerDetail.user_is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Academic Affiliation Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1.5 shadow-xs">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-primary" /> Department
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {viewingLecturerDetail.department_detail?.name || 'Unassigned'}
                      </p>
                      {viewingLecturerDetail.department_detail?.code && (
                        <p className="text-xs font-mono text-muted-foreground">
                          Code: {viewingLecturerDetail.department_detail.code}
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1.5 shadow-xs">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <School className="h-4 w-4 text-primary" /> College / Faculty
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {viewingLecturerDetail.department_detail?.college_detail?.name || '—'}
                      </p>
                      {viewingLecturerDetail.department_detail?.college_detail?.code && (
                        <p className="text-xs font-mono text-muted-foreground">
                          Code: {viewingLecturerDetail.department_detail.college_detail.code}
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1.5 shadow-xs">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-primary" /> Member Since
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(viewingLecturerDetail.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1.5 shadow-xs">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary" /> Record Updated
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(viewingLecturerDetail.updated_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </DialogBody>

            <DialogFooter className="px-8 py-4 border-t border-border bg-muted/20 flex justify-end">
              <Button
                onClick={() => setViewingLecturerId(null)}
                className="font-semibold px-7"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Lecturer Modal */}
      {editingLecturer && (
        <Dialog open={!!editingLecturer} onOpenChange={() => setEditingLecturer(null)}>
          <DialogContent size="lg" className="sm:max-w-lg p-0 overflow-hidden">
            <form onSubmit={handleSaveEdit}>
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Edit2 className="h-4 w-4" />
                  </div>
                  Edit Lecturer Information
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update faculty identifier or department assignment for {editingLecturer.user_full_name}.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-4 px-6 py-4">
                {editFormError && (
                  <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{editFormError}</span>
                  </div>
                )}

                {/* Read-only User Summary */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
                  <p className="font-semibold text-foreground">{editingLecturer.user_full_name}</p>
                  <p className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" /> {editingLecturer.user_email}
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <Badge variant={editingLecturer.user_is_active ? 'success' : 'secondary'} className="text-[10px]">
                      {editingLecturer.user_is_active ? 'Active Account' : 'Inactive Account'}
                    </Badge>
                  </div>
                </div>

                {/* Faculty Identifier */}
                <div className="space-y-1.5">
                  <label htmlFor="faculty_identifier" className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-primary" /> Faculty Identifier *
                  </label>
                  <input
                    id="faculty_identifier"
                    type="text"
                    required
                    value={editForm.faculty_identifier}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, faculty_identifier: e.target.value }))
                    }
                    placeholder="e.g. FAC-1029"
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring text-foreground font-mono"
                  />
                  {editErrors.faculty_identifier && (
                    <p className="text-xs text-destructive font-medium">{editErrors.faculty_identifier}</p>
                  )}
                </div>

                {/* Department Dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor="department_id" className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-primary" /> Department
                  </label>
                  <select
                    id="department_id"
                    value={editForm.department_id}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, department_id: e.target.value }))
                    }
                    className={selectClass}
                  >
                    <option value="">-- No Department Assigned --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                  {editErrors.department_id && (
                    <p className="text-xs text-destructive font-medium">{editErrors.department_id}</p>
                  )}
                </div>
              </DialogBody>

              <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingLecturer(null)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
