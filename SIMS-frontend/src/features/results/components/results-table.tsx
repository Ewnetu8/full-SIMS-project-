'use client';

import * as React from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  GraduationCap, 
  User, 
  X,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { 
  Badge, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter
} from '@/components/ui';
import { EmptyState } from '@/components/feedback/empty-state';
import { cn } from '@/lib';
import type { ExamResults, ExamResultRow } from '@/types/api';
import type { ResultsFilterState } from '../types';

export interface ResultsTableProps {
  results: ExamResults;
  isLoading?: boolean;
}

function getGradeBadgeVariant(grade: string | null): 'success' | 'secondary' | 'warning' | 'destructive' | 'outline' {
  if (!grade) return 'outline';
  const g = grade.toUpperCase();
  if (g.startsWith('A')) return 'success';
  if (g.startsWith('B')) return 'secondary';
  if (g.startsWith('C')) return 'warning';
  if (g.startsWith('D') || g.startsWith('F')) return 'destructive';
  return 'outline';
}

function getStatusBadge(status: string, isDisrupted: boolean) {
  const norm = (status || '').toLowerCase();
  if (norm === 'graded') {
    return (
      <Badge variant="success" className="text-xs font-medium inline-flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Graded
      </Badge>
    );
  }
  if (norm === 'in_progress' || norm === 'started') {
    return (
      <Badge variant="secondary" className="text-xs font-medium inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        In Progress
      </Badge>
    );
  }
  if (norm === 'submitted' || norm === 'pending') {
    return (
      <Badge variant="warning" className="text-xs font-medium inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Pending Review
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs font-medium">
      {status || 'Unknown'}
    </Badge>
  );
}

function formatSubmissionDate(dateStr: string | null): string {
  if (!dateStr) return 'Not submitted';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function ResultsTable({ results }: ResultsTableProps) {
  const [filters, setFilters] = React.useState<ResultsFilterState>({
    searchQuery: '',
    gradingStatus: 'ALL',
    gradeLetter: 'ALL',
  });

  const [selectedStudentDetail, setSelectedStudentDetail] = React.useState<ExamResultRow | null>(null);

  const students = results.students || [];

  // Available unique grade letters for filter dropdown
  const availableGradeLetters = React.useMemo(() => {
    const letters = new Set<string>();
    students.forEach((s) => {
      if (s.grade_letter) letters.add(s.grade_letter.toUpperCase());
    });
    return Array.from(letters).sort();
  }, [students]);

  // Available unique grading statuses for filter dropdown
  const availableGradingStatuses = React.useMemo(() => {
    const statuses = new Set<string>();
    students.forEach((s) => {
      if (s.grading_status) statuses.add(s.grading_status);
    });
    return Array.from(statuses).sort();
  }, [students]);

  // Filtered students list
  const filteredStudents = React.useMemo(() => {
    return students.filter((s) => {
      // Search query filter
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = s.student_name ? s.student_name.toLowerCase().includes(q) : false;
        const matchesId = s.student_identifier ? s.student_identifier.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesId) return false;
      }

      // Grading status filter
      if (filters.gradingStatus !== 'ALL') {
        if (filters.gradingStatus === 'disrupted') {
          if (!s.is_disrupted) return false;
        } else if (s.grading_status !== filters.gradingStatus) {
          return false;
        }
      }

      // Grade letter filter
      if (filters.gradeLetter !== 'ALL') {
        if (!s.grade_letter || s.grade_letter.toUpperCase() !== filters.gradeLetter.toUpperCase()) {
          return false;
        }
      }

      return true;
    });
  }, [students, filters]);

  const hasActiveFilters = Boolean(
    filters.searchQuery.trim() || filters.gradingStatus !== 'ALL' || filters.gradeLetter !== 'ALL'
  );

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      gradingStatus: 'ALL',
      gradeLetter: 'ALL',
    });
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="p-4 sm:p-6 pb-4 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Student Examination Results
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Showing {filteredStudents.length} of {students.length} recorded candidate attempts for &ldquo;{results.title}&rdquo;
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search student or ID..."
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-8 h-9 text-xs"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Grading Status Dropdown */}
          <select
            aria-label="Filter by Grading Status"
            value={filters.gradingStatus}
            onChange={(e) => setFilters((prev) => ({ ...prev, gradingStatus: e.target.value }))}
            className="h-9 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="ALL">All Statuses</option>
            {availableGradingStatuses.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
            <option value="disrupted">Disrupted Only</option>
          </select>

          {/* Grade Letter Dropdown */}
          {availableGradeLetters.length > 0 && (
            <select
              aria-label="Filter by Grade Letter"
              value={filters.gradeLetter}
              onChange={(e) => setFilters((prev) => ({ ...prev, gradeLetter: e.target.value }))}
              className="h-9 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="ALL">All Grades</option>
              {availableGradeLetters.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          )}

          {/* Reset Filters CTA */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {students.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="h-8 w-8 opacity-60" />}
            title="No Results Recorded"
            description="No results or student attempts are available for this examination yet."
            className="py-12"
          />
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-foreground">No students match the current filters</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting or resetting your search and filter criteria.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mt-3 text-xs"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4 sm:px-6">Student</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submission Time</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((row) => {
                  const scoreDisplay = row.final_score !== null && row.final_score !== undefined
                    ? `${parseFloat(row.final_score).toFixed(1)}%`
                    : '—';

                  return (
                    <tr
                      key={row.attempt_id || row.student_id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Student Identity */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {row.student_name ? row.student_name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {row.student_name || 'Anonymous / Unregistered'}
                            </p>
                            <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">
                              {row.student_identifier}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Final Score */}
                      <td className="py-3.5 px-4">
                        <span className={cn(
                          'font-bold text-sm',
                          row.final_score !== null ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {scoreDisplay}
                        </span>
                      </td>

                      {/* Grade Letter */}
                      <td className="py-3.5 px-4">
                        {row.grade_letter ? (
                          <Badge variant={getGradeBadgeVariant(row.grade_letter)} className="font-bold text-xs px-2 py-0.5">
                            {row.grade_letter}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground font-mono">—</span>
                        )}
                      </td>

                      {/* Grading Status & Disruption Flag */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(row.grading_status, row.is_disrupted)}
                          {row.is_disrupted && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3" />
                              Disrupted Session
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Submission Time */}
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        {formatSubmissionDate(row.submission_time)}
                      </td>

                      {/* Actions (Read-Only) */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStudentDetail(row)}
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                          title="View Result Details"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Read-Only Details Dialog */}
      <Dialog
        open={Boolean(selectedStudentDetail)}
        onOpenChange={(open) => {
          if (!open) setSelectedStudentDetail(null);
        }}
      >
        {selectedStudentDetail && (
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-5 w-5 text-primary" />
                Student Result Overview
              </DialogTitle>
              <DialogDescription>
                Detailed read-only submission breakdown for the selected candidate.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4 py-2">
              {/* Student Header Summary */}
              <div className="flex items-center gap-3 p-3.5 rounded-lg bg-muted/50 border border-border">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {selectedStudentDetail.student_name ? selectedStudentDetail.student_name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">
                    {selectedStudentDetail.student_name || 'Unnamed Student'}
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {selectedStudentDetail.student_identifier}
                  </p>
                </div>
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block text-[11px]">Final Score</span>
                  <span className="text-lg font-bold text-foreground mt-0.5 block">
                    {selectedStudentDetail.final_score !== null ? `${selectedStudentDetail.final_score}%` : 'Pending Evaluation'}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block text-[11px]">Assigned Grade</span>
                  <div className="mt-1">
                    {selectedStudentDetail.grade_letter ? (
                      <Badge variant={getGradeBadgeVariant(selectedStudentDetail.grade_letter)} className="text-sm font-bold px-2.5 py-0.5">
                        {selectedStudentDetail.grade_letter}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block text-[11px]">Grading Status</span>
                  <div className="mt-1">
                    {getStatusBadge(selectedStudentDetail.grading_status, selectedStudentDetail.is_disrupted)}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block text-[11px]">Session Disruption</span>
                  <span className={cn(
                    'font-medium mt-1 block',
                    selectedStudentDetail.is_disrupted ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                  )}>
                    {selectedStudentDetail.is_disrupted ? 'Yes (Connectivity flagged)' : 'No disruptions reported'}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Submission Timestamp</span>
                  <span className="font-medium text-foreground mt-0.5 block font-mono">
                    {formatSubmissionDate(selectedStudentDetail.submission_time)}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Attempt UUID</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block font-mono break-all select-all">
                    {selectedStudentDetail.attempt_id}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Student UUID</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block font-mono break-all select-all">
                    {selectedStudentDetail.student_id}
                  </span>
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStudentDetail(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}
