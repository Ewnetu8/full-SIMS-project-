'use client';

import * as React from 'react';
import { 
  Award, 
  RefreshCw, 
  AlertCircle, 
  ShieldAlert, 
  ClipboardCheck,
  FileText
} from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { Skeleton } from '@/components/feedback/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { getUserFriendlyErrorMessage } from '@/lib/errors';
import { useAdminExamsList, useExamResults } from '../hooks/use-exam-results';
import { ExamSelector } from './exam-selector';
import { ResultsSummary } from './results-summary';
import { ResultsTable } from './results-table';

export function AdminResultsPage() {
  const [selectedExamId, setSelectedExamId] = React.useState<string | null>(null);

  // Fetch available exams list for the selector
  const { 
    data: exams = [], 
    isLoading: isLoadingExams, 
    error: examsError,
    refetch: refetchExams
  } = useAdminExamsList();

  // Fetch exam results once an exam is selected
  const {
    data: examResults,
    isLoading: isLoadingResults,
    isFetching: isFetchingResults,
    error: resultsError,
    refetch: refetchResults,
  } = useExamResults(selectedExamId);

  // Error classification
  const is403Forbidden = React.useMemo(() => {
    const err = resultsError as any;
    return err?.status === 403 || err?.response?.status === 403;
  }, [resultsError]);

  const is404NotFound = React.useMemo(() => {
    const err = resultsError as any;
    return err?.status === 404 || err?.response?.status === 404;
  }, [resultsError]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Award className="h-6 w-6 text-primary" />
            Results &amp; Grades
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View examination results and grading status across the university.
          </p>
        </div>

        {selectedExamId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchResults()}
            disabled={isFetchingResults}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isFetchingResults ? 'animate-spin' : ''}`} />}
            className="self-start sm:self-auto text-xs"
          >
            {isFetchingResults ? 'Refreshing...' : 'Refresh Results'}
          </Button>
        )}
      </div>

      {/* Examination Selector */}
      <ExamSelector
        exams={exams}
        selectedExamId={selectedExamId}
        onSelectExam={setSelectedExamId}
        isLoading={isLoadingExams}
      />

      {/* Main Content Area */}
      {!selectedExamId ? (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-0">
            <EmptyState
              icon={<ClipboardCheck className="h-10 w-10 text-primary opacity-60" />}
              title="Select an Examination"
              description="Choose an examination from the selector above to view its student scores, letter grades, and submission evaluation status."
              className="py-20"
            />
          </CardContent>
        </Card>
      ) : isLoadingResults ? (
        <div className="space-y-6 animate-pulse">
          {/* Summary Skeletons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-border bg-card p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </Card>
            ))}
          </div>
          {/* Table Skeleton */}
          <Card className="border-border bg-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-9 w-64" />
            </div>
            <div className="space-y-3 pt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        </div>
      ) : resultsError ? (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-0">
            {is403Forbidden ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Access Restricted</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  You do not have administrative permission to view the results for this examination.
                </p>
              </div>
            ) : is404NotFound ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Examination Not Found</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  The selected examination could not be found or has no active result records configured.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedExamId(null)}
                  className="mt-2 text-xs"
                >
                  Choose Another Examination
                </Button>
              </div>
            ) : (
              <ErrorState
                title="Failed to Load Examination Results"
                description={getUserFriendlyErrorMessage(resultsError)}
                onRetry={() => refetchResults()}
                retryLabel="Retry Request"
              />
            )}
          </CardContent>
        </Card>
      ) : examResults ? (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <ResultsSummary results={examResults} />

          {/* Results Table */}
          <ResultsTable results={examResults} />
        </div>
      ) : null}
    </div>
  );
}
