'use client';

import { 
  BarChart3, 
  Calendar, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle2, 
  SearchX 
} from 'lucide-react';
import * as React from 'react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button, Card, CardContent } from '@/components/ui';
import { getUserFriendlyErrorMessage } from '@/lib/errors';

import { useAdminSemesters, useAdvisingReport } from '../hooks/use-advising-report';
import { exportAdvisingReportToCsv } from '../utils/export-csv';

import { AdvisingTable } from './advising-table';
import { ExamAnalyticsCard } from './exam-analytics-card';
import { ReportFilters } from './report-filters';
import { ReportSummary } from './report-summary';

import type { ClassStandingFilter } from '../types';

interface ApiErrorShape {
  status?: number;
  response?: { status?: number };
}

export function ReportsPage() {
  const [selectedSemesterId, setSelectedSemesterId] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [classStandingFilter, setClassStandingFilter] = React.useState<ClassStandingFilter>('ALL');

  // 1. Fetch available semesters
  const {
    data: semesters = [],
    isLoading: isLoadingSemesters,
    refetch: refetchSemesters,
  } = useAdminSemesters();

  // Effective semester ID: user selected or first available
  const effectiveSemesterId: string | null =
    selectedSemesterId ?? (semesters.length > 0 && semesters[0]?.id ? semesters[0].id : null);

  // 2. Fetch Advising Report for effective semester
  const {
    data: report,
    isLoading: isLoadingReport,
    isFetching: isFetchingReport,
    error: reportError,
    refetch: refetchReport,
  } = useAdvisingReport(effectiveSemesterId);

  // Memoized raw students from report
  const rawStudents = React.useMemo(() => report?.students || [], [report]);

  // Filtered students (client-side search & class-standing filter)
  const filteredStudents = React.useMemo(() => {
    if (!rawStudents.length) return [];
    return rawStudents.filter((student) => {
      // Class standing match
      if (classStandingFilter !== 'ALL' && student.class_standing.toUpperCase() !== classStandingFilter.toUpperCase()) {
        return false;
      }
      // Search term match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const idMatches = student.student_identifier.toLowerCase().includes(query);
        const standingMatches = student.class_standing.toLowerCase().includes(query);
        if (!idMatches && !standingMatches) return false;
      }
      return true;
    });
  }, [rawStudents, classStandingFilter, searchTerm]);

  // Error categorization
  const is403Forbidden = React.useMemo(() => {
    const err = reportError as ApiErrorShape | null;
    return err?.status === 403 || err?.response?.status === 403;
  }, [reportError]);

  const is404NotFound = React.useMemo(() => {
    const err = reportError as ApiErrorShape | null;
    return err?.status === 404 || err?.response?.status === 404;
  }, [reportError]);

  const is400BadRequest = React.useMemo(() => {
    const err = reportError as ApiErrorShape | null;
    return err?.status === 400 || err?.response?.status === 400;
  }, [reportError]);

  // CSV Export handler
  const handleExportCsv = () => {
    if (!report || filteredStudents.length === 0) return;
    exportAdvisingReportToCsv(filteredStudents, report.semester_label);
  };

  const handleRefresh = () => {
    if (effectiveSemesterId) {
      void refetchReport();
    } else {
      void refetchSemesters();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-primary" />
            Reports &amp; Institutional Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Official academic advising rosters, student credit-hour compliance, and institutional policy metrics.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <ReportFilters
        semesters={semesters}
        selectedSemesterId={effectiveSemesterId}
        onSelectSemester={(id) => {
          setSelectedSemesterId(id);
          setSearchTerm('');
        }}
        isLoadingSemesters={isLoadingSemesters}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        classStandingFilter={classStandingFilter}
        onClassStandingChange={setClassStandingFilter}
        onRefresh={handleRefresh}
        isRefreshing={isFetchingReport}
        onExportCsv={handleExportCsv}
        canExport={Boolean(report && filteredStudents.length > 0)}
      />

      {/* Main Content Area */}
      {!effectiveSemesterId ? (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-0">
            <EmptyState
              icon={<Calendar className="h-10 w-10 text-primary opacity-60" />}
              title="Select an Academic Semester"
              description="Select a semester from the filter toolbar above to generate the real-time credit-hour advising report."
              className="py-16"
            />
          </CardContent>
        </Card>
      ) : isLoadingReport ? (
        <div className="space-y-6 animate-pulse">
          {/* Summary Skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-border bg-card p-5">
                <Skeleton className="h-3.5 w-28 mb-3" />
                <Skeleton className="h-8 w-20 mb-1.5" />
                <Skeleton className="h-3 w-36" />
              </Card>
            ))}
          </div>
          {/* Table Skeleton */}
          <Card className="border-border bg-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="space-y-3 pt-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        </div>
      ) : reportError ? (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-0">
            {is403Forbidden ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Access Restricted</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  You do not have administrative permission to view institutional advising reports.
                </p>
              </div>
            ) : is404NotFound ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Semester Not Found</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  The selected academic semester could not be found or has been removed.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSemesterId(semesters[0]?.id || null)}
                  className="mt-2 text-xs"
                >
                  Choose Another Semester
                </Button>
              </div>
            ) : is400BadRequest ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Invalid Semester</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  Please select a valid semester and try again.
                </p>
              </div>
            ) : (
              <ErrorState
                title="Failed to Load Advising Report"
                description={getUserFriendlyErrorMessage(reportError)}
                onRetry={() => refetchReport()}
                retryLabel="Retry Request"
              />
            )}
          </CardContent>
        </Card>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <ReportSummary report={report} />

          {/* Advising Results Table or Empty States */}
          {rawStudents.length === 0 ? (
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-12 text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  No Students Require Advising
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  All enrolled students in <span className="font-medium text-foreground">{report.semester_label}</span> meet or exceed the minimum credit-hour requirement for their class standing.
                </p>
              </CardContent>
            </Card>
          ) : filteredStudents.length === 0 ? (
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-12 text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mx-auto">
                  <SearchX className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  No Matching Records Found
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  No flagged students match the filter criteria ({classStandingFilter !== 'ALL' ? `Class Standing: ${classStandingFilter}, ` : ''}{searchTerm ? `Search: "${searchTerm}"` : ''}).
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setClassStandingFilter('ALL');
                  }}
                  className="mt-2 text-xs"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AdvisingTable
              students={filteredStudents}
              totalRawCount={rawStudents.length}
              semesterLabel={report.semester_label}
            />
          )}
        </div>
      ) : null}

      {/* Domain Boundary: Exam Performance Analytics Card */}
      <ExamAnalyticsCard />
    </div>
  );
}
