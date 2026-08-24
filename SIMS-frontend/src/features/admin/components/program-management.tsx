'use client';

import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  GraduationCap,
  Building2,
  School,
  Clock,
  Calendar,
  Hash,
  ChevronLeft,
  ChevronRight,
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

import type { Program, DegreeLevel } from '../types';

const DEGREE_LEVEL_LABELS: Record<string, string> = {
  BACHELOR: 'Bachelor',
  MASTER: 'Master',
  DOCTORATE: 'Doctorate',
  DIPLOMA: 'Diploma',
  CERTIFICATE: 'Certificate',
};

const DEGREE_LEVEL_BADGES: Record<string, string> = {
  BACHELOR: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  MASTER: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  DOCTORATE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  DIPLOMA: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  CERTIFICATE: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
};

export function ProgramManagement() {
  const {
    programs,
    departments,
    colleges,
    isLoadingPrograms,
    programsError,
    isLoadingDepartments,
    isLoadingColleges,
    programSearchQuery,
    programDeptFilter,
    programDegreeFilter,
    fetchPrograms,
    fetchDepartments,
    fetchColleges,
    fetchProgramById,
    addProgram,
    updateProgram,
    deleteProgram,
    setProgramSearchQuery,
    setProgramDeptFilter,
    setProgramDegreeFilter,
  } = useAdminStore();

  // Modals & Selection State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingProgram, setEditingProgram] = React.useState<Program | null>(null);
  const [deletingProgram, setDeletingProgram] = React.useState<Program | null>(null);
  const [viewingProgramId, setViewingProgramId] = React.useState<string | null>(null);
  const [detailedProgram, setDetailedProgram] = React.useState<Program | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  // College filter on main page
  const [programCollegeFilter, setProgramCollegeFilter] = React.useState('ALL');

  // Form State
  const [formData, setFormData] = React.useState<{
    collegeFilterId: string;
    departmentId: string;
    name: string;
    code: string;
    degreeLevel: DegreeLevel | string;
    totalCreditHoursRequired: number;
  }>({
    collegeFilterId: '',
    departmentId: '',
    name: '',
    code: '',
    degreeLevel: 'BACHELOR',
    totalCreditHoursRequired: 120,
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Initial Data Fetch
  React.useEffect(() => {
    void fetchPrograms();
    void fetchDepartments();
    void fetchColleges();
  }, [fetchPrograms, fetchDepartments, fetchColleges]);

  // Department Resolver (safely checks nested department_detail or loaded departments list)
  const getDepartmentDisplay = React.useCallback(
    (prog: Program): { name: string; code?: string; collegeId?: string | null } => {
      if (prog.department_detail?.name) {
        return {
          name: prog.department_detail.name,
          code: prog.department_detail.code,
          collegeId: prog.department_detail.college,
        };
      }
      if (prog.department) {
        const dept = departments.find((d) => d.id === prog.department);
        if (dept?.name) {
          return {
            name: dept.name,
            code: dept.code,
            collegeId: dept.college,
          };
        }
      }
      return { name: '—' };
    },
    [departments]
  );

  // College Resolver (safely checks Department -> College)
  const getCollegeDisplay = React.useCallback(
    (prog: Program): { name: string; code?: string } => {
      // 1. Direct from prog.department_detail.college_detail
      if (prog.department_detail?.college_detail?.name) {
        return {
          name: prog.department_detail.college_detail.name,
          code: prog.department_detail.college_detail.code,
        };
      }
      // 2. From dept.college via loaded colleges
      const dept =
        prog.department_detail || departments.find((d) => d.id === prog.department);
      if (dept?.college) {
        const clg = colleges.find((c) => c.id === dept.college);
        if (clg?.name) {
          return {
            name: clg.name,
            code: clg.code,
          };
        }
      }
      return { name: '—' };
    },
    [departments, colleges]
  );

  // Form Available Departments (filtered by optional College filter in dialog)
  const availableFormDepartments = React.useMemo(() => {
    if (!formData.collegeFilterId) return departments;
    return departments.filter((d) => d.college === formData.collegeFilterId);
  }, [departments, formData.collegeFilterId]);

  // View Details Modal Handler
  const handleOpenViewDetails = async (programId: string) => {
    setViewingProgramId(programId);
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const prog = await fetchProgramById(programId);
      setDetailedProgram(prog);
    } catch (err: unknown) {
      setDetailError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Open Create Modal
  const handleOpenAddModal = () => {
    setFieldErrors({});
    setFormError(null);
    setFormData({
      collegeFilterId: '',
      departmentId: departments[0]?.id || '',
      name: '',
      code: '',
      degreeLevel: 'BACHELOR',
      totalCreditHoursRequired: 120,
    });
    setEditingProgram(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (prog: Program) => {
    setFieldErrors({});
    setFormError(null);
    setEditingProgram(prog);
    const dept =
      prog.department_detail || departments.find((d) => d.id === prog.department);
    setFormData({
      collegeFilterId: dept?.college || '',
      departmentId: prog.department || prog.department_detail?.id || '',
      name: prog.name,
      code: prog.code,
      degreeLevel: prog.degreeLevel || 'BACHELOR',
      totalCreditHoursRequired: prog.totalCreditHoursRequired || 120,
    });
    setIsAddModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.departmentId) {
      errors.department = 'Department selection is required.';
    }

    if (!formData.code.trim()) {
      errors.code = 'Program code is required.';
    } else if (formData.code.length > 20) {
      errors.code = 'Program code must not exceed 20 characters.';
    }

    if (!formData.name.trim()) {
      errors.name = 'Program name is required.';
    } else if (formData.name.length > 255) {
      errors.name = 'Program name must not exceed 255 characters.';
    }

    if (
      isNaN(Number(formData.totalCreditHoursRequired)) ||
      Number(formData.totalCreditHoursRequired) < 0
    ) {
      errors.total_credit_hours_required = 'Credit hours must be a positive number.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Program (Create / Edit)
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    const payload = {
      department: formData.departmentId,
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      degree_level: formData.degreeLevel,
      total_credit_hours_required: Number(formData.totalCreditHoursRequired),
    };

    try {
      if (editingProgram) {
        await updateProgram(editingProgram.id, payload);
        toast.success('Academic program updated successfully.');
        setEditingProgram(null);
      } else {
        await addProgram(payload);
        toast.success('Academic program created successfully.');
      }
      setIsAddModalOpen(false);
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

  // Delete Program
  const handleDeleteProgram = async () => {
    if (!deletingProgram) return;
    setIsDeleting(true);
    try {
      await deleteProgram(deletingProgram.id);
      toast.success('Academic program deleted successfully.');
      setDeletingProgram(null);
    } catch {
      toast.error(
        'This program could not be deleted because it is currently associated with active courses or other academic records.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Programs
  const filteredPrograms = React.useMemo(() => {
    return programs.filter((p) => {
      // Search query (code or name)
      if (programSearchQuery.trim()) {
        const q = programSearchQuery.toLowerCase().trim();
        const codeMatch = p.code.toLowerCase().includes(q);
        const nameMatch = p.name.toLowerCase().includes(q);
        if (!codeMatch && !nameMatch) return false;
      }

      // Department filter
      if (programDeptFilter !== 'ALL') {
        const deptId = p.department || p.department_detail?.id;
        if (deptId !== programDeptFilter) return false;
      }

      // Degree Level filter
      if (programDegreeFilter !== 'ALL') {
        if (p.degreeLevel !== programDegreeFilter) return false;
      }

      // College filter
      if (programCollegeFilter !== 'ALL') {
        const dept =
          p.department_detail || departments.find((d) => d.id === p.department);
        if (dept?.college !== programCollegeFilter) return false;
      }

      return true;
    });
  }, [
    programs,
    programSearchQuery,
    programDeptFilter,
    programDegreeFilter,
    programCollegeFilter,
    departments,
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage) || 1;
  const paginatedPrograms = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPrograms.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPrograms, currentPage, itemsPerPage]);

  // Statistics
  const totalProgramsCount = programs.length;
  const uniqueDepartmentsCount = React.useMemo(() => {
    const deptIds = new Set<string>();
    programs.forEach((p) => {
      const id = p.department || p.department_detail?.id;
      if (id) deptIds.add(id);
    });
    return deptIds.size;
  }, [programs]);
  const bachelorCount = React.useMemo(
    () => programs.filter((p) => p.degreeLevel === 'BACHELOR').length,
    [programs]
  );
  const postgraduateCount = React.useMemo(
    () =>
      programs.filter((p) => p.degreeLevel === 'MASTER' || p.degreeLevel === 'DOCTORATE')
        .length,
    [programs]
  );

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <Layers className="h-7 w-7 text-primary" /> Academic Programs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage university degree programs, curriculum specifications, and departmental affiliations.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void fetchPrograms();
              void fetchDepartments();
              void fetchColleges();
            }}
            disabled={isLoadingPrograms || isLoadingDepartments || isLoadingColleges}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingPrograms ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 font-semibold"
          >
            <Plus className="h-4 w-4" /> Add Program
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
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Programs</p>
            <p className="text-2xl font-bold text-foreground">{totalProgramsCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Departments</p>
            <p className="text-2xl font-bold text-foreground">{uniqueDepartmentsCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Undergraduate</p>
            <p className="text-2xl font-bold text-foreground">{bachelorCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 shrink-0">
            <School className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Postgraduate</p>
            <p className="text-2xl font-bold text-foreground">{postgraduateCount}</p>
          </div>
        </Card>
      </div>

      {/* Error Alert */}
      {programsError && (
        <Card className="p-4 border-destructive/40 bg-destructive/10 text-destructive flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{programsError}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchPrograms()}
            className="border-destructive/30 hover:bg-destructive/20 text-destructive shrink-0"
          >
            Try Again
          </Button>
        </Card>
      )}

      {/* Filter / Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <SearchInput
              placeholder="Search program code or name..."
              value={programSearchQuery}
              onChange={(e) => {
                setProgramSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => {
                setProgramSearchQuery('');
                setCurrentPage(1);
              }}
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={programDeptFilter}
              onChange={(e) => {
                setProgramDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className={selectClass}
              value={programDegreeFilter}
              onChange={(e) => {
                setProgramDegreeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Degree Levels</option>
              <option value="BACHELOR">Bachelor</option>
              <option value="MASTER">Master</option>
              <option value="DOCTORATE">Doctorate</option>
              <option value="DIPLOMA">Diploma</option>
              <option value="CERTIFICATE">Certificate</option>
            </select>
          </div>

          <div>
            <select
              className={selectClass}
              value={programCollegeFilter}
              onChange={(e) => {
                setProgramCollegeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Colleges</option>
              {colleges.map((clg) => (
                <option key={clg.id} value={clg.id}>
                  {clg.name} ({clg.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Program List Table */}
      <Card className="overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Program Code</th>
                <th className="px-4 py-3.5">Program Name</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">College</th>
                <th className="px-4 py-3.5">Degree Level</th>
                <th className="px-4 py-3.5">Required Credits</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingPrograms ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>Loading academic programs from backend...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-base font-semibold text-foreground">
                        {programs.length === 0
                          ? 'No academic programs registered yet'
                          : 'No matching programs found'}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {programs.length === 0
                          ? 'Get started by clicking Add Program above to configure curriculum degree programs.'
                          : 'Try adjusting your search criteria or resetting the active filters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPrograms.map((prog) => {
                  const deptDisplay = getDepartmentDisplay(prog);
                  const collegeDisplay = getCollegeDisplay(prog);
                  const badgeStyle =
                    prog.degreeLevel && DEGREE_LEVEL_BADGES[prog.degreeLevel]
                      ? DEGREE_LEVEL_BADGES[prog.degreeLevel]
                      : 'bg-muted text-muted-foreground border-border';
                  const degreeLabel =
                    prog.degreeLevel && DEGREE_LEVEL_LABELS[prog.degreeLevel]
                      ? DEGREE_LEVEL_LABELS[prog.degreeLevel]
                      : prog.degreeLevel;

                  return (
                    <tr key={prog.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary">
                        {prog.code}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-foreground">
                        {prog.name}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {deptDisplay.name === '—' ? (
                          <span className="text-muted-foreground/60">—</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground">{deptDisplay.name}</span>
                            {deptDisplay.code && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {deptDisplay.code}
                              </Badge>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {collegeDisplay.name === '—' ? (
                          <span className="text-muted-foreground/60">—</span>
                        ) : (
                          <span className="font-medium text-foreground">{collegeDisplay.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <Badge variant="outline" className={`text-[11px] font-medium ${badgeStyle}`}>
                          {degreeLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-foreground font-semibold">
                        {prog.totalCreditHoursRequired} Cr.
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => void handleOpenViewDetails(prog.id)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenEditModal(prog)}
                            title="Edit Program"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingProgram(prog)}
                            title="Delete Program"
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

        {/* Pagination Footer */}
        {filteredPrograms.length > itemsPerPage && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * itemsPerPage, filteredPrograms.length)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{filteredPrograms.length}</span> programs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <span className="px-2 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Details Dialog (GET /api/v1/programs/{id}) */}
      <Dialog
        open={!!viewingProgramId}
        onOpenChange={(open) => {
          if (!open) {
            setViewingProgramId(null);
            setDetailedProgram(null);
            setDetailError(null);
          }
        }}
      >
        <DialogContent size="lg" className="p-0 overflow-hidden sm:max-w-xl">
          <DialogHeader className="px-6 pt-6 pb-2 border-b border-border bg-muted/10">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <span>Program Details</span>
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Complete academic program details retrieved directly from the backend API.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {isLoadingDetail ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm">Fetching program details from server...</span>
              </div>
            ) : detailError ? (
              <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{detailError}</span>
                </div>
                {viewingProgramId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleOpenViewDetails(viewingProgramId)}
                  >
                    Retry
                  </Button>
                )}
              </div>
            ) : detailedProgram ? (
              <div className="space-y-4">
                {/* Header Card */}
                <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
                      {detailedProgram.code}
                    </span>
                    <h3 className="text-lg font-bold text-foreground">{detailedProgram.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 font-semibold">
                      {detailedProgram.totalCreditHoursRequired} Required Credits
                    </Badge>
                  </div>
                </div>

                {/* Grid Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
                    <p className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-primary" /> Degree Level
                    </p>
                    <p className="font-semibold text-foreground text-sm">
                      {DEGREE_LEVEL_LABELS[detailedProgram.degreeLevel] || detailedProgram.degreeLevel}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
                    <p className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-indigo-500" /> Department
                    </p>
                    <p className="font-semibold text-foreground text-sm">
                      {getDepartmentDisplay(detailedProgram).name}
                    </p>
                    {getDepartmentDisplay(detailedProgram).code && (
                      <p className="text-muted-foreground">
                        Code: {getDepartmentDisplay(detailedProgram).code}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
                    <p className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <School className="h-3.5 w-3.5 text-blue-500" /> College
                    </p>
                    <p className="font-semibold text-foreground text-sm">
                      {getCollegeDisplay(detailedProgram).name}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
                    <p className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-amber-500" /> Program ID
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground truncate" title={detailedProgram.id}>
                      {detailedProgram.id}
                    </p>
                  </div>
                </div>

                {/* Metadata Timestamps */}
                {(detailedProgram.createdAt || detailedProgram.updatedAt) && (
                  <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground gap-1">
                    {detailedProgram.createdAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Created: {new Date(detailedProgram.createdAt).toLocaleDateString()}
                      </span>
                    )}
                    {detailedProgram.updatedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Updated: {new Date(detailedProgram.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </DialogBody>

          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-between gap-2">
            <div>
              {detailedProgram && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const p = detailedProgram;
                    setViewingProgramId(null);
                    handleOpenEditModal(p);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Program
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setViewingProgramId(null);
                setDetailedProgram(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Program Dialog */}
      <Dialog
        open={isAddModalOpen || !!editingProgram}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingProgram(null);
          }
        }}
      >
        <DialogContent size="md" className="p-0 overflow-hidden sm:max-w-lg">
          <form onSubmit={handleSaveProgram}>
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  {editingProgram ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>
                <span>{editingProgram ? 'Edit Academic Program' : 'Add Academic Program'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {editingProgram
                  ? 'Update academic program specifications, department, degree level, or credit requirements.'
                  : 'Add a new academic degree program into the university curriculum catalog.'}
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4 px-6 py-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Department Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="progDepartment" required>
                  Department
                </Label>
                <select
                  id="progDepartment"
                  className={selectClass}
                  value={formData.departmentId}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, departmentId: e.target.value }));
                    if (fieldErrors.department) {
                      setFieldErrors((prev) => ({ ...prev, department: '' }));
                    }
                  }}
                >
                  <option value="">-- Select Department --</option>
                  {availableFormDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {fieldErrors.department && (
                  <p className="text-xs text-destructive font-medium">{fieldErrors.department}</p>
                )}
              </div>

              {/* Code and Credits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="progCode" required>
                    Program Code
                  </Label>
                  <Input
                    id="progCode"
                    value={formData.code}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
                      if (fieldErrors.code) {
                        setFieldErrors((prev) => ({ ...prev, code: '' }));
                      }
                    }}
                    placeholder="e.g. BSCS"
                    className="font-mono uppercase"
                    maxLength={20}
                  />
                  {fieldErrors.code && (
                    <p className="text-xs text-destructive font-medium">{fieldErrors.code}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="progCredits" required>
                    Total Required Credits
                  </Label>
                  <Input
                    id="progCredits"
                    type="number"
                    min={0}
                    value={formData.totalCreditHoursRequired}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        totalCreditHoursRequired: parseInt(e.target.value) || 0,
                      }));
                      if (fieldErrors.total_credit_hours_required) {
                        setFieldErrors((prev) => ({ ...prev, total_credit_hours_required: '' }));
                      }
                    }}
                  />
                  {fieldErrors.total_credit_hours_required && (
                    <p className="text-xs text-destructive font-medium">
                      {fieldErrors.total_credit_hours_required}
                    </p>
                  )}
                </div>
              </div>

              {/* Program Name */}
              <div className="space-y-1.5">
                <Label htmlFor="progName" required>
                  Program Name
                </Label>
                <Input
                  id="progName"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (fieldErrors.name) {
                      setFieldErrors((prev) => ({ ...prev, name: '' }));
                    }
                  }}
                  placeholder="e.g. Bachelor of Science in Computer Science"
                  maxLength={255}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-destructive font-medium">{fieldErrors.name}</p>
                )}
              </div>

              {/* Degree Level */}
              <div className="space-y-1.5">
                <Label htmlFor="progDegreeLevel" required>
                  Degree Level
                </Label>
                <select
                  id="progDegreeLevel"
                  className={selectClass}
                  value={formData.degreeLevel}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      degreeLevel: e.target.value as DegreeLevel,
                    }));
                    if (fieldErrors.degree_level) {
                      setFieldErrors((prev) => ({ ...prev, degree_level: '' }));
                    }
                  }}
                >
                  <option value="BACHELOR">Bachelor</option>
                  <option value="MASTER">Master</option>
                  <option value="DOCTORATE">Doctorate</option>
                  <option value="DIPLOMA">Diploma</option>
                  <option value="CERTIFICATE">Certificate</option>
                </select>
                {fieldErrors.degree_level && (
                  <p className="text-xs text-destructive font-medium">{fieldErrors.degree_level}</p>
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
                  setEditingProgram(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : editingProgram
                    ? 'Save Changes'
                    : 'Add Program'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Program Confirmation Dialog */}
      <Dialog
        open={!!deletingProgram}
        onOpenChange={(open) => {
          if (!open) setDeletingProgram(null);
        }}
      >
        <DialogContent size="sm" className="p-0 overflow-hidden sm:max-w-md">
          <DialogHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-2.5 text-destructive">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-bold">Delete Academic Program</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete program{' '}
              <span className="font-semibold text-foreground">
                {deletingProgram?.code} - {deletingProgram?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingProgram(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteProgram}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Program'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
