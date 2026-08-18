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
} from 'lucide-react';
import { getExamAnalytics } from '../services/analytics-api';
import type { ExamAnalyticsResponse } from '@/types/api';
import { getUserFriendlyErrorMessage } from '@/lib/errors';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Progress } from '@/components/ui';
import { LoadingSpinner, toast } from '@/components/feedback';

interface ExamAnalyticsViewProps {
  examId: string;
  examTitle?: string;
}

export function ExamAnalyticsView({ examId, examTitle }: ExamAnalyticsViewProps) {
  const [data, setData] = React.useState<ExamAnalyticsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {data.title || examTitle || 'Examination Analytics'}
            </h2>
            <Badge variant={data.status === 'PUBLISHED' ? 'success' : 'secondary'}>
              {data.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Exam ID: <span className="font-mono">{data.exam_id}</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={fetchAnalytics}>
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" /> Total Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.attempt_count}</div>
            <p className="text-xs text-muted-foreground mt-1">Student attempt sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Graded Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.graded_count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.attempt_count > 0
                ? `${Math.round((data.graded_count / data.attempt_count) * 100)}% complete`
                : 'No submissions'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-amber-500" /> Mean Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasScoreData && scoreSummary?.mean !== null ? scoreSummary.mean.toFixed(1) : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Median: {hasScoreData && scoreSummary?.median !== null ? scoreSummary.median.toFixed(1) : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Award className="h-4 w-4 text-indigo-500" /> Highest / Lowest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasScoreData && scoreSummary?.max !== null ? scoreSummary.max : '—'}
              <span className="text-sm font-normal text-muted-foreground">
                {' '}
                / {hasScoreData && scoreSummary?.min !== null ? scoreSummary.min : '—'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Std Dev: {hasScoreData && scoreSummary?.stddev !== null ? scoreSummary.stddev.toFixed(2) : '—'}
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
              Evaluation metrics and difficulty analysis will populate automatically once student attempts are submitted and graded.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Per-Question Difficulty Analysis */}
      {data.per_question && data.per_question.length > 0 && (
        <Card>
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
                    <th className="py-3 px-4 text-center">Correct Count</th>
                    <th className="py-3 px-4 text-right">Success Rate</th>
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
  );
}
