'use client';

import * as React from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  CircleAlert,
  Clock,
  Filter,
  GraduationCap,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { EmptyState, ErrorState, Skeleton } from '@/components/feedback';
import { PageHeader } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { ROUTES } from '@/constants';
import { useStudentStore } from '../store/student-store';
import type { Result } from '../types/student.types';

const formatDate = (value?: string | null) => {
  if (!value) return 'Not recorded';
  try {
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export function ResultsPage() {
  const {
    results,
    isLoadingResults,
    resultsError,
    fetchResults,
    enrollments,
    isLoadingEnrollments,
    fetchEnrollments,
    myMarks,
    isLoadingMarks,
    fetchMyMarks,
  } = useStudentStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'CERTIFIED' | 'PENDING'>('ALL');
  const [activeTab, setActiveTab] = React.useState<'exams' | 'courses'>('exams');

  React.useEffect(() => {
    void fetchResults();
    void fetchEnrollments();
    void fetchMyMarks();
  }, [fetchResults, fetchEnrollments, fetchMyMarks]);

  // Graded course enrollments
  const gradedEnrollments = enrollments.filter(
    (e) => e.status === 'PASSED' || e.status === 'FAILED' || Boolean(e.grade)
  );

  // Filtered examination results from /api/v1/results/me
  const filteredResults = React.useMemo(() => {
    return results.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.course_code?.toLowerCase().includes(q) ||
        r.course_title?.toLowerCase().includes(q) ||
        r.exam_title?.toLowerCase().includes(q) ||
        r.grade_letter?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'CERTIFIED' && r.grading_status === 'CERTIFIED') ||
        (statusFilter === 'PENDING' && r.grading_status !== 'CERTIFIED');

      return matchesSearch && matchesStatus;
    });
  }, [results, searchQuery, statusFilter]);

  // Calculate summary metrics
  const totalResults = results.length;
  const certifiedCount = results.filter((r) => r.grading_status === 'CERTIFIED').length;
  const scores = results
    .map((r) => parseFloat(r.final_score))
    .filter((s) => !isNaN(s));
  const averageScore = scores.length > 0
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Student portal', href: ROUTES.STUDENT.DASHBOARD },
              { label: 'Official Examination & Course Results' },
            ]}
          />
        }
        title="Official Examination Results & Grades"
        description="View your verified exam attempts, official scores, grade letters, and certification records directly from SIMS."
      />

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Award className="h-4 w-4 text-primary" /> Total Graded Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {isLoadingResults ? '—' : totalResults}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Official graded attempts</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-success" /> Certified Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-success">
              {isLoadingResults ? '—' : certifiedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Verified by department</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-amber-500" /> Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {isLoadingResults ? '—' : averageScore !== null ? `${averageScore}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Mean performance across exams</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-indigo-500" /> Course Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {isLoadingEnrollments ? '—' : enrollments.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {gradedEnrollments.length} completed with grade
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'exams' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('exams')}
            leftIcon={<Award className="h-4 w-4" />}
          >
            Exam Results ({results.length})
          </Button>
          <Button
            variant={activeTab === 'courses' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('courses')}
            leftIcon={<BookOpen className="h-4 w-4" />}
          >
            Course Grades ({gradedEnrollments.length})
          </Button>
        </div>

        {activeTab === 'exams' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search course or exam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60">
              <Button
                variant={statusFilter === 'ALL' ? 'secondary' : 'ghost'}
                size="sm"
                className="text-xs h-7 px-2.5"
                onClick={() => setStatusFilter('ALL')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'CERTIFIED' ? 'secondary' : 'ghost'}
                size="sm"
                className="text-xs h-7 px-2.5"
                onClick={() => setStatusFilter('CERTIFIED')}
              >
                Certified
              </Button>
              <Button
                variant={statusFilter === 'PENDING' ? 'secondary' : 'ghost'}
                size="sm"
                className="text-xs h-7 px-2.5"
                onClick={() => setStatusFilter('PENDING')}
              >
                Pending
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Results View */}
      {activeTab === 'exams' ? (
        isLoadingResults ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6 space-y-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        ) : resultsError ? (
          <ErrorState
            title="Couldn't load exam results"
            description={resultsError}
            onRetry={() => { void fetchResults(); }}
            retryLabel="Try again"
          />
        ) : filteredResults.length === 0 ? (
          <EmptyState
            icon={<Award className="h-10 w-10 text-muted-foreground" />}
            title="No examination results found"
            description={
              searchQuery || statusFilter !== 'ALL'
                ? 'No examination results matched your search or status filter criteria.'
                : 'No official examination results have been published for your account yet. Results will appear automatically once exams are submitted and certified.'
            }
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filteredResults.map((result) => (
              <Card key={result.id} hoverable className="border-border/80 shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {result.course_code}
                        </span>
                        <Badge
                          variant={result.grading_status === 'CERTIFIED' ? 'success' : 'secondary'}
                          className="text-[10px] font-semibold uppercase"
                        >
                          {result.grading_status || 'PENDING'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {result.exam_status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold text-foreground pt-1">
                        {result.exam_title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {result.course_title}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-2xl font-mono font-extrabold text-foreground">
                        {result.grade_letter || '—'}
                      </div>
                      <div className="text-xs font-mono font-semibold text-muted-foreground">
                        {result.final_score ? `${parseFloat(result.final_score).toFixed(1)} pts` : '—'}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs bg-muted/20 p-2.5 rounded-md border border-border/60">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Submitted:</span>
                      <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatDate(result.submission_time)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Verification:</span>
                      <span className="font-medium text-foreground flex items-center gap-1 mt-0.5 truncate">
                        <ShieldCheck className="h-3 w-3 text-success" />
                        {result.grading_status === 'CERTIFIED' ? 'Certified by Faculty' : 'Grading in progress'}
                      </span>
                    </div>
                  </div>

                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={ROUTES.STUDENT.RESULT(result.id)}>
                      View Exam Record <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        /* Course Final Grades Tab */
        isLoadingEnrollments ? (
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="p-6 space-y-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-6 w-2/3" />
              </Card>
            ))}
          </div>
        ) : gradedEnrollments.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="h-10 w-10 text-muted-foreground" />}
            title="No course final grades published"
            description="Official final letter grades will appear here once your enrolled semester courses are completed and evaluated."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {enrollments.map((enrollment) => {
              const offering = enrollment.course_offering_detail;
              const course = offering?.course_detail;
              const status = enrollment.status;
              const grade = enrollment.grade;
              const markGroup = myMarks.find(
                (m) => m.enrollment_id === enrollment.id || m.course_offering?.id === offering?.id
              );

              return (
                <Card key={enrollment.id} hoverable className="border-border/80 shadow-sm flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded">
                          {course?.course_code || offering?.course_detail?.course_code || 'CODE'}
                        </span>
                        <CardTitle className="mt-2 text-base">{course?.title || offering?.course_detail?.title || 'Enrolled Course'}</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Section {offering?.section || 'A'} · {course?.credit_hours || 0} Credit Hours
                        </p>
                      </div>
                      <div className="text-right">
                        {grade || markGroup?.letter_grade ? (
                          <p className="text-2xl font-mono font-bold text-success">{grade || markGroup?.letter_grade}</p>
                        ) : (
                          <Badge
                            variant={
                              status === 'PASSED'
                                ? 'success'
                                : status === 'FAILED'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {status}
                          </Badge>
                        )}
                        <p className="text-xs font-medium text-muted-foreground mt-1">
                          Status: {status}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {markGroup && markGroup.assessments && markGroup.assessments.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <p className="text-xs font-semibold text-foreground">Published Continuous Assessments</p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {markGroup.assessments.map((a) => (
                            <div
                              key={a.assessment_id}
                              className="flex items-center justify-between text-xs bg-muted/30 px-2.5 py-1.5 rounded"
                            >
                              <span className="truncate max-w-[60%] font-medium text-foreground">
                                {a.title} ({a.assessment_type})
                              </span>
                              <span className="font-mono font-semibold text-primary">
                                {a.score !== null && a.score !== undefined ? `${a.score} / ${a.max_marks}` : 'Not graded'}
                              </span>
                            </div>
                          ))}
                        </div>
                        {markGroup.total_percent !== null && markGroup.total_percent !== undefined && (
                          <div className="flex justify-between items-center text-xs font-semibold pt-1 text-foreground">
                            <span>Running Total:</span>
                            <span className="font-mono text-primary font-bold">{markGroup.total_percent}%</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="pt-2 flex items-center justify-between">
                      <Badge variant="outline" className="text-xs font-normal">
                        {enrollment.is_retake ? 'Retake Enrollment' : 'Standard Enrollment'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

export function ResultDetails({ resultId }: { resultId: string }) {
  const router = useRouter();
  const { results, fetchResults, enrollments, fetchEnrollments } = useStudentStore();

  React.useEffect(() => {
    if (results.length === 0) {
      void fetchResults();
    }
    if (enrollments.length === 0) {
      void fetchEnrollments();
    }
  }, [results.length, enrollments.length, fetchResults, fetchEnrollments]);

  // Find either in official results (from /api/v1/results/me) or in enrollments
  const result = results.find((r) => r.id === resultId || r.exam_id === resultId);
  const enrollment = enrollments.find((e) => e.id === resultId);

  if (!result && !enrollment) {
    return (
      <EmptyState
        icon={<CircleAlert className="h-10 w-10 text-muted-foreground" />}
        title="Result record not found"
        description="This examination result or grade record could not be found in your active records."
        action={{ label: 'Back to results', onClick: () => router.push(ROUTES.STUDENT.RESULTS) }}
      />
    );
  }

  if (result) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={[
                { label: 'Student portal', href: ROUTES.STUDENT.DASHBOARD },
                { label: 'Results & status', href: ROUTES.STUDENT.RESULTS },
                { label: result.exam_title || 'Result Details' },
              ]}
            />
          }
          title={result.exam_title}
          description={`${result.course_code} · ${result.course_title}`}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Grade Card */}
          <Card className="shadow-sm lg:col-span-1 border-border">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
                Official Grade Letter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="text-6xl font-mono font-extrabold text-success">
                {result.grade_letter || '—'}
              </div>
              <div className="text-lg font-mono font-bold text-foreground">
                Score: {result.final_score ? `${parseFloat(result.final_score).toFixed(2)} pts` : 'Not graded'}
              </div>
              <Badge
                variant={result.grading_status === 'CERTIFIED' ? 'success' : 'secondary'}
                className="px-3 py-1 font-semibold"
              >
                {result.grading_status === 'CERTIFIED' ? 'Certified by Department' : result.grading_status || 'Pending'}
              </Badge>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card className="shadow-sm lg:col-span-2 border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" /> Examination Record Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border/80 py-2.5">
                <span className="text-muted-foreground">Course Title:</span>
                <span className="font-medium text-foreground">{result.course_title}</span>
              </div>
              <div className="flex justify-between border-b border-border/80 py-2.5">
                <span className="text-muted-foreground">Course Code:</span>
                <span className="font-mono text-xs font-bold text-primary">{result.course_code}</span>
              </div>
              <div className="flex justify-between border-b border-border/80 py-2.5">
                <span className="text-muted-foreground">Examination Title:</span>
                <span className="font-medium text-foreground">{result.exam_title}</span>
              </div>
              <div className="flex justify-between border-b border-border/80 py-2.5">
                <span className="text-muted-foreground">Examination Status:</span>
                <Badge variant="outline" className="text-xs">{result.exam_status}</Badge>
              </div>
              <div className="flex justify-between border-b border-border/80 py-2.5">
                <span className="text-muted-foreground">Submission Time:</span>
                <span className="font-medium text-foreground">{formatDate(result.submission_time)}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted-foreground">Attempt Record ID:</span>
                <span className="font-mono text-xs text-muted-foreground">{result.exam_attempt}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fallback for enrollment record
  const offering = enrollment?.course_offering_detail;
  const course = offering?.course_detail;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Student portal', href: ROUTES.STUDENT.DASHBOARD },
              { label: 'Results & status', href: ROUTES.STUDENT.RESULTS },
              { label: course?.title || 'Course Details' },
            ]}
          />
        }
        title={course?.title || 'Course Grade Record'}
        description={`${course?.course_code || 'CODE'} · ${course?.credit_hours || 0} Credit Hours`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Course Grade & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-5xl font-mono font-bold text-success">{enrollment?.grade || 'N/A'}</p>
            <p className="text-base font-semibold text-foreground">
              Official Status: {enrollment?.status}
            </p>
            {enrollment?.is_retake && (
              <Badge variant="warning">Retake Course</Badge>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">Course Title:</span>
              <span className="font-medium">{course?.title || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">Course Code:</span>
              <span className="font-mono text-xs font-bold text-primary">{course?.course_code || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">Credit Hours:</span>
              <span className="font-mono text-xs font-semibold">{course?.credit_hours || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Section:</span>
              <span className="font-mono text-xs font-semibold">Section {offering?.section || 'A'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}