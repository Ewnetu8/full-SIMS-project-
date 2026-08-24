'use client';

import {
  GraduationCap,
  Eye,
  Edit2,
  Building,
  Mail,
  Calendar,
  Clock,
  Shield,
  RefreshCw,
  AlertCircle,
  Copy,
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
  ApiStudentListItem,
  ApiStudentDetail,
  ClassStanding,
  UpdateStudentPayload,
} from '../types';

const CLASS_STANDING_OPTIONS: { label: string; value: ClassStanding }[] = [
  { label: 'Freshman (Year 1)', value: 'FRESHMAN' },
  { label: 'Sophomore (Year 2)', value: 'SOPHOMORE' },
  { label: 'Junior (Year 3)', value: 'JUNIOR' },
  { label: 'Senior (Year 4)', value: 'SENIOR' },
  { label: 'Graduate (Postgrad)', value: 'GRADUATE' },
];

export function StudentManagement() {
  const {
    students,
    departments,
    colleges,
    isLoadingStudents,
    studentsError,
    studentSearchQuery,
    studentDeptFilter,
    studentClassStandingFilter,
    fetchStudents,
    fetchStudentById,
    updateStudent,
    fetchDepartments,
    fetchColleges,
    setStudentSearchQuery,
    setStudentDeptFilter,
    setStudentClassStandingFilter,
  } = useAdminStore();

  // Local college filter to narrow down department dropdown
  const [studentCollegeFilter, setStudentCollegeFilter] = React.useState<string>('ALL');

  // Search input with debounce
  const [localSearch, setLocalSearch] = React.useState(studentSearchQuery);

  // Modals state
  const [viewingStudentId, setViewingStudentId] = React.useState<string | null>(null);
  const [viewingStudentDetail, setViewingStudentDetail] = React.useState<ApiStudentDetail | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);

  const [editingStudent, setEditingStudent] = React.useState<ApiStudentListItem | null>(null);
  const [editForm, setEditForm] = React.useState<{
    student_identifier: string;
    class_standing: ClassStanding;
    department_id: string;
  }>({
    student_identifier: '',
    class_standing: 'FRESHMAN',
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
    fetchStudents({
      search: localSearch,
      department: studentDeptFilter,
      class_standing: studentClassStandingFilter,
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
      setStudentSearchQuery(localSearch);
      fetchStudents({
        search: localSearch,
        department: studentDeptFilter,
        class_standing: studentClassStandingFilter,
      });
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [localSearch, studentDeptFilter, studentClassStandingFilter, fetchStudents, setStudentSearchQuery]);

  const handleDepartmentChange = (newDept: string) => {
    setStudentDeptFilter(newDept);
    setCurrentPage(1);
    fetchStudents({
      search: localSearch,
      department: newDept,
      class_standing: studentClassStandingFilter,
    });
  };

  const handleClassStandingChange = (newStanding: string) => {
    setStudentClassStandingFilter(newStanding);
    setCurrentPage(1);
    fetchStudents({
      search: localSearch,
      department: studentDeptFilter,
      class_standing: newStanding,
    });
  };

  const handleOpenView = async (studentId: string) => {
    setViewingStudentId(studentId);
    setViewingStudentDetail(null);
    setIsLoadingProfile(true);
    setProfileError(null);

    try {
      const detail = await fetchStudentById(studentId);
      setViewingStudentDetail(detail);
    } catch (err: unknown) {
      setProfileError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Filter departments for dropdown by chosen college
  const filteredDepartments = React.useMemo(() => {
    if (!studentCollegeFilter || studentCollegeFilter === 'ALL') return departments;
    return departments.filter(
      (d) =>
        d.college === studentCollegeFilter ||
        (colleges.find((c) => c.name === studentCollegeFilter || c.code === studentCollegeFilter)?.id === d.college)
    );
  }, [departments, colleges, studentCollegeFilter]);

  // Client-side pagination
  const totalPages = Math.ceil(students.length / itemsPerPage) || 1;
  const paginatedStudents = students.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenEdit = (student: ApiStudentListItem) => {
    setEditingStudent(student);
    setEditForm({
      student_identifier: student.student_identifier || '',
      class_standing: student.class_standing || 'FRESHMAN',
      department_id: student.department || '',
    });
    setEditErrors({});
    setEditFormError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsSaving(true);
    setEditErrors({});
    setEditFormError(null);

    const payload: UpdateStudentPayload = {
      student_identifier: editForm.student_identifier.trim(),
      class_standing: editForm.class_standing,
      department_id: editForm.department_id ? editForm.department_id : null,
    };

    try {
      await updateStudent(editingStudent.id, payload);
      toast.success('Student profile updated successfully.');
      setEditingStudent(null);
      // Refresh list
      fetchStudents();
    } catch (err: unknown) {
      const fieldErrs = parseFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) {
        setEditErrors(fieldErrs);
      }
      setEditFormError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            Student Directory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Official student directory powered by the Student Management API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStudents({
                search: localSearch,
                department: studentDeptFilter,
                class_standing: studentClassStandingFilter,
              });
            }}
            disabled={isLoadingStudents}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingStudents ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {studentsError && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{studentsError}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStudents()}
            className="border-destructive/40 hover:bg-destructive/20 text-xs shrink-0"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <SearchInput
              placeholder="Search by name, ID, or email..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onClear={() => setLocalSearch('')}
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={studentCollegeFilter}
              onChange={(e) => {
                const newCol = e.target.value;
                setStudentCollegeFilter(newCol);
                handleDepartmentChange('ALL');
              }}
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
              value={studentDeptFilter}
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

          <div>
            <select
              className={selectClass}
              value={studentClassStandingFilter}
              onChange={(e) => handleClassStandingChange(e.target.value)}
            >
              <option value="ALL">All Class Standings</option>
              {CLASS_STANDING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Student List Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Student ID</th>
                <th className="px-4 py-3.5">Student Name</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Class Standing</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingStudents ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 rounded bg-muted" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted" />
                        <div className="space-y-1">
                          <div className="h-4 w-32 rounded bg-muted" />
                          <div className="h-3 w-40 rounded bg-muted" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 rounded bg-muted" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 rounded bg-muted" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-16 rounded bg-muted" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-8 w-24 rounded bg-muted ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-3">
                        <GraduationCap className="h-7 w-7" />
                      </div>
                      <p className="text-base font-bold text-foreground">No Students Found</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        {localSearch || studentDeptFilter !== 'ALL' || studentClassStandingFilter !== 'ALL'
                          ? 'No student profiles match your search criteria. Try adjusting your filters.'
                          : 'There are currently no student records available from the server.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-primary">
                      {std.student_identifier || '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                          {std.user_full_name?.[0] || std.user_email?.[0] || 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {std.user_full_name || '—'}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {std.user_email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[220px]">
                      {std.department_detail ? (
                        <div>
                          <p className="font-medium text-foreground truncate">{std.department_detail.name}</p>
                          <p className="text-[11px] text-muted-foreground">{std.department_detail.code}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="font-medium text-xs">
                        {std.class_standing || '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={std.user_is_active ? 'success' : 'secondary'} className="capitalize text-xs">
                        {std.user_is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenView(std.id)}
                          className="h-8 px-2.5 text-xs flex items-center gap-1 hover:text-primary"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Profile
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(std)}
                          className="h-8 px-2.5 text-xs flex items-center gap-1 hover:text-primary"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {!isLoadingStudents && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages} ({students.length} total students)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Student Profile Modal */}
      {viewingStudentId && (
        <Dialog open={!!viewingStudentId} onOpenChange={() => setViewingStudentId(null)}>
          <DialogContent size="3xl" className="sm:max-w-3xl w-[92vw] max-w-3xl p-0 overflow-hidden">
            <DialogHeader className="px-8 pt-7 pb-3">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <GraduationCap className="h-5 w-5" />
                </div>
                Student Profile & Academic Record
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Verified student profile details retrieved from the backend.
              </DialogDescription>
            </DialogHeader>

            {isLoadingProfile ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading student profile...
                </div>
              </div>
            ) : profileError ? (
              <div className="p-8 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
                <p className="text-sm font-medium text-destructive">{profileError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (viewingStudentId) handleOpenView(viewingStudentId);
                  }}
                >
                  Retry Loading
                </Button>
              </div>
            ) : viewingStudentDetail ? (
              <DialogBody className="space-y-6 px-8 py-5 max-h-[80vh] overflow-y-auto">
                {/* Hero profile card */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-2xl border border-border bg-muted/30 p-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#102A7A] text-white font-bold text-2xl uppercase shadow-sm shrink-0">
                    {(viewingStudentDetail.user_first_name?.[0] || '') + (viewingStudentDetail.user_last_name?.[0] || '') || (viewingStudentDetail.user_email?.[0] || 'S')}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <h3 className="text-xl font-bold text-foreground">
                      {`${viewingStudentDetail.user_first_name || ''} ${viewingStudentDetail.user_last_name || ''}`.trim() || '—'}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 font-mono">
                      <Mail className="h-4 w-4 text-primary shrink-0" /> {viewingStudentDetail.user_email}
                    </p>
                    <div className="pt-1 flex items-center gap-2.5 flex-wrap">
                      <Badge variant="outline" className="font-mono text-xs font-bold border-primary/40 text-primary bg-primary/5 px-2.5 py-0.5">
                        ID: {viewingStudentDetail.student_identifier || '—'}
                      </Badge>
                      <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-medium">
                        {viewingStudentDetail.class_standing || '—'}
                      </Badge>
                      <Badge variant={viewingStudentDetail.user_is_active ? 'success' : 'secondary'} className="capitalize text-xs px-2.5 py-0.5">
                        {viewingStudentDetail.user_is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Profile Key-Value Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Academic & Profile Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1.5 shadow-xs">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-primary" /> Department
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {viewingStudentDetail.department_detail?.name || 'Not assigned'}
                      </p>
                      {viewingStudentDetail.department_detail?.code && (
                        <p className="text-xs text-muted-foreground font-mono">
                          Code: {viewingStudentDetail.department_detail.code}
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1.5 shadow-xs">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-primary" /> College
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {viewingStudentDetail.department_detail?.college_detail?.name || '—'}
                      </p>
                      {viewingStudentDetail.department_detail?.college_detail?.code && (
                        <p className="text-xs text-muted-foreground font-mono">
                          Code: {viewingStudentDetail.department_detail.college_detail.code}
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1.5 shadow-xs">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4 text-primary" /> Class Standing
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {viewingStudentDetail.class_standing || 'Not set'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Shield className="h-4 w-4 text-primary" /> User Account ID
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(viewingStudentDetail.user);
                            toast.success('User ID copied to clipboard');
                          }}
                          className="hover:text-primary transition-colors p-1 rounded hover:bg-accent/40"
                          title="Copy User ID"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="font-mono text-xs font-semibold text-foreground break-all select-all pt-0.5">
                        {viewingStudentDetail.user}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1.5 shadow-xs">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-primary" /> Created Date
                      </span>
                      <p className="text-xs font-semibold text-foreground pt-0.5">
                        {viewingStudentDetail.created_at
                          ? new Date(viewingStudentDetail.created_at).toLocaleString()
                          : '—'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1.5 shadow-xs">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary" /> Last Updated
                      </span>
                      <p className="text-xs font-semibold text-foreground pt-0.5">
                        {viewingStudentDetail.updated_at
                          ? new Date(viewingStudentDetail.updated_at).toLocaleString()
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </DialogBody>
            ) : null}

            <DialogFooter className="px-8 py-4 border-t border-border bg-muted/20 flex justify-end">
              <Button
                onClick={() => setViewingStudentId(null)}
                className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-semibold px-7"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
          <DialogContent size="2xl" className="sm:max-w-2xl w-[92vw] max-w-2xl p-0 overflow-hidden">
            <form onSubmit={handleSaveEdit}>
              <DialogHeader className="px-8 pt-7 pb-3">
                <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Edit2 className="h-5 w-5" />
                  </div>
                  Edit Student Information
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Update student identifier, academic standing, or department assignment.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-5 px-8 py-5 max-h-[75vh] overflow-y-auto">
                {editFormError && (
                  <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{editFormError}</span>
                  </div>
                )}

                {/* Readonly Student Identity */}
                <div className="p-4 rounded-xl border border-border/80 bg-muted/30 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102A7A] text-white font-bold text-sm shrink-0">
                    {editingStudent.user_full_name?.[0] || 'S'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{editingStudent.user_full_name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{editingStudent.user_email}</p>
                  </div>
                </div>

                {/* Student Identifier */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Student Identifier (ID) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.student_identifier}
                    onChange={(e) => setEditForm({ ...editForm, student_identifier: e.target.value })}
                    placeholder="e.g. ETS1234/14"
                    className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring font-mono ${
                      editErrors.student_identifier ? 'border-destructive' : 'border-input'
                    }`}
                  />
                  {editErrors.student_identifier && (
                    <p className="text-xs text-destructive">{editErrors.student_identifier}</p>
                  )}
                </div>

                {/* Class Standing */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Class Standing <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={editForm.class_standing}
                    onChange={(e) => setEditForm({ ...editForm, class_standing: e.target.value as ClassStanding })}
                    className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring ${
                      editErrors.class_standing ? 'border-destructive' : 'border-input'
                    }`}
                  >
                    {CLASS_STANDING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {editErrors.class_standing && (
                    <p className="text-xs text-destructive">{editErrors.class_standing}</p>
                  )}
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Academic Department
                  </label>
                  <select
                    value={editForm.department_id}
                    onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                    className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring ${
                      editErrors.department_id ? 'border-destructive' : 'border-input'
                    }`}
                  >
                    <option value="">Unassigned</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                  {editErrors.department_id && (
                    <p className="text-xs text-destructive">{editErrors.department_id}</p>
                  )}
                </div>
              </DialogBody>

              <DialogFooter className="px-8 py-4 border-t border-border bg-muted/20 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingStudent(null)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-semibold px-6"
                >
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
