'use client';

import * as React from 'react';
import {
  BarChart3,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Percent,
  Clock,
  ShieldCheck,
  Search,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { getExamAnalytics, getExamResults } from '../services/analytics-api';
import type { ExamAnalyticsResponse, ExamResults, ScoreBand } from '@/types/api';
import { getUserFriendlyErrorMessage } from '@/lib/errors';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Progress } from '@/components/ui';
import { LoadingSpinner, toast } from '@/components/feedback';

interface ExamAnalyticsViewProps {
  examId: string;
  examTitle?: string;
}

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

export function ExamAnalyticsView({ examId, examTitle }: ExamAnalyticsViewProps) {
  const [activeTab, setActiveTab] = React.useState<'analytics' | 'results'>('analytics');
  
  // Analytics state
  const [data, setData] = React.useState<ExamAnalyticsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Results state (GET /api/v1/results/exam/{id})
  const [resultsData, setResultsData] = React.useState<ExamResults | null>(null);
  const [loadingResults, setLoadingResults] = React.useState(false);
  const [resultsError, setResultsError] = React.useState<string | null>(null);
  const [studentSearch, setStudentSearch] = React.useState('');

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getExamAnalytics(examId);
      setData(res);
    } catch (err) {
      const msg = getUserFriendlyErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  const fetchResults = React.useCallback(async () => {
    setLoadingResults(true);
    setResultsError(null);
    try {
      const res = await getExamResults(examId);
      setResultsData(res);
    } catch (err) {
      const msg = getUserFriendlyErrorMessage(err);
      setResultsError(msg);
    } finally {
      setLoadingResults(false);
    }
  }, [examId]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  React.useEffect(() => {
    if (activeTab === 'results' && !resultsData) {
      fetchResults();
    }
  }, [activeTab, resultsData, fetchResults]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading examination analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div>
            <h3 className="font-semibold text-foreground text-lg">Unable to load analytics</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={fetchAnalytics}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const scoreSummary = data.score;
  const hasScoreData = scoreSummary && scoreSummary.mean !== null;
  const passRatePct = data.pass_rate !== null ? Math.round(data.pass_rate * 100) : null;

  // Filter student results
  const filteredStudents = resultsData?.students.filter((s) => {
    const q = studentSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      s.student_identifier?.toLowerCase().includes(q) ||
      s.student_name?.toLowerCase().includes(q) ||
      s.grade_letter?.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header Summary & Tab Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {data.title || examTitle || 'Examination Analytics & Results'}
            </h2>
            <Badge variant={data.status === 'PUBLISHED' ? 'success' : 'secondary'}>
              {data.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Exam ID: <span className="font-mono">{data.exam_id}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/40 p-1 rounded-lg border border-border/60">
            <Button
              variant={activeTab === 'analytics' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-8"
              onClick={() => setActiveTab('analytics')}
              leftIcon={<BarChart3 className="h-3.5 w-3.5" />}
            >
              Analytics
            </Button>
            <Button
              variant={activeTab === 'results' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-8"
              onClick={() => setActiveTab('results')}
              leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />}
            >
              Student Results ({data.graded_count})
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => {
              fetchAnalytics();
              if (activeTab === 'results') fetchResults();
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        /* Analytics View */
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" /> Total Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{data.attempt_count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.graded_count} of {data.attempt_count} graded
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-emerald-500" /> Pass Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {passRatePct !== null ? `${passRatePct}%` : '—'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Threshold: <span className="font-semibold text-foreground">{data.pass_threshold}%</span>
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-amber-500" /> Mean / Median
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {hasScoreData && scoreSummary?.mean !== null ? scoreSummary.mean.toFixed(1) : '—'}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}
                    / {hasScoreData && scoreSummary?.median !== null ? scoreSummary.median.toFixed(1) : '—'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mode: <span className="font-semibold text-foreground">{hasScoreData && scoreSummary?.mode !== null ? scoreSummary.mode : '—'}</span>
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-indigo-500" /> Highest / Lowest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {hasScoreData && scoreSummary?.max !== null ? scoreSummary.max : '—'}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}
                    / {hasScoreData && scoreSummary?.min !== null ? scoreSummary.min : '—'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Std Dev: <span className="font-semibold text-foreground">{hasScoreData && scoreSummary?.stddev !== null ? scoreSummary.stddev.toFixed(2) : '—'}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Empty Score State Notice */}
          {!hasScoreData && (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-6 text-center space-y-2">
                <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                <h4 className="font-semibold text-foreground">No Graded Results Available Yet</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Evaluation metrics, pass rate, and score distributions will populate automatically once student attempts are graded.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Score Distribution Chart / Breakdown (SIMS API 4) */}
          {data.score_distribution && data.score_distribution.length > 0 && (
            <Card className="shadow-sm border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" /> Score Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.score_distribution.map((band: ScoreBand, idx: number) => {
                    const totalBandedCount = data.score_distribution.reduce((acc, b) => acc + b.count, 0);
                    const pct = totalBandedCount > 0 ? Math.round((band.count / totalBandedCount) * 100) : 0;

                    return (
                      <div key={band.label || idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-foreground">{band.label}</span>
                          <span className="font-mono text-muted-foreground">
                            {band.count} student{band.count === 1 ? '' : 's'} ({pct}%)
                          </span>
                        </div>
                        <div className="h-3 w-full bg-muted/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Per-Question Performance & Difficulty Analysis */}
          {data.per_question && data.per_question.length > 0 && (
            <Card className="shadow-sm border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" /> Per-Question Performance & Difficulty Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Question Prompt</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4 text-center">Points</th>
                        <th className="py-3 px-4 text-center">Attempts</th>
                        <th className="py-3 px-4 text-center">Correct</th>
                        <th className="py-3 px-4 text-center">Unanswered</th>
                        <th className="py-3 px-4 text-center">Avg Points</th>
                        <th className="py-3 px-4 text-right">Correct Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.per_question.map((q, idx) => {
                        const rate = q.correct_rate !== null ? Math.round(q.correct_rate * 100) : null;
                        return (
                          <tr key={q.question_id || idx} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{idx + 1}</td>
                            <td className="py-3 px-4 max-w-xs truncate font-medium text-foreground">
                              {q.question_text}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="text-[10px]">
                                {q.question_type}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-xs">{q.total_points}</td>
                            <td className="py-3 px-4 text-center">{q.attempts}</td>
                            <td className="py-3 px-4 text-center">{q.correct_count}</td>
                            <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                              {q.unanswered_count ?? 0}
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-xs font-semibold">
                              {q.average_points !== null ? q.average_points.toFixed(2) : '—'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {rate !== null ? (
                                <div className="flex items-center justify-end gap-2">
                                  <Progress value={rate} className="w-16 h-2" />
                                  <span className="font-semibold text-xs w-9 text-right">{rate}%</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">N/A</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Student Exam Results Table (GET /api/v1/results/exam/{id}) */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student ID or name..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Showing {filteredStudents.length} of {resultsData?.students.length || 0} student attempts
            </p>
          </div>

          {loadingResults ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <LoadingSpinner size="md" />
              <p className="text-sm text-muted-foreground">Loading student results...</p>
            </div>
          ) : resultsError ? (
            <Card className="border-destructive/30 bg-destructive/5 p-4 text-center">
              <p className="text-sm text-destructive">{resultsError}</p>
              <Button variant="outline" size="sm" onClick={fetchResults} className="mt-2">
                Retry
              </Button>
            </Card>
          ) : filteredStudents.length === 0 ? (
            <Card className="p-8 text-center bg-muted/20 border-dashed">
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <h4 className="font-semibold text-foreground">No Student Exam Results Found</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {studentSearch
                  ? 'No students matched your search criteria.'
                  : 'No student attempts have been submitted or recorded for this exam yet.'}
              </p>
            </Card>
          ) : (
            <Card className="shadow-sm border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                      <th className="py-3 px-4">Student ID</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 text-center">Final Score</th>
                      <th className="py-3 px-4 text-center">Grade</th>
                      <th className="py-3 px-4 text-center">Grading Status</th>
                      <th className="py-3 px-4 text-center">Disruption</th>
                      <th className="py-3 px-4 text-right">Submission Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStudents.map((row) => (
                      <tr key={row.attempt_id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs font-bold text-primary">
                          {row.student_identifier || 'Not available'}
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">
                          {row.student_name || 'Enrolled Student'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold">
                          {row.final_score !== null ? `${parseFloat(row.final_score).toFixed(2)} pts` : '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-extrabold text-foreground">
                          {row.grade_letter || '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={row.grading_status === 'CERTIFIED' ? 'success' : 'secondary'}
                            className="text-[10px] uppercase font-semibold"
                          >
                            {row.grading_status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {row.is_disrupted ? (
                            <Badge variant="destructive" className="text-[10px] flex items-center gap-1 mx-auto w-fit">
                              <AlertTriangle className="h-3 w-3" /> Disrupted
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Normal</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-muted-foreground font-mono">
                          {formatDate(row.submission_time)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

