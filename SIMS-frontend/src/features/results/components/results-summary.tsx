'use client';

import * as React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Award,
  BarChart3
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import type { ExamResults } from '@/types/api';
import type { ExamResultSummaryMetrics } from '../types';

export interface ResultsSummaryProps {
  results: ExamResults;
}

export function calculateResultMetrics(results: ExamResults): ExamResultSummaryMetrics {
  const students = results.students || [];
  const totalAttempts = results.attempt_count ?? students.length;
  const gradedCount = results.graded_count ?? students.filter((s) => s.grading_status === 'graded' || s.final_score !== null).length;
  const pendingCount = Math.max(0, totalAttempts - gradedCount);

  let totalNumericScore = 0;
  let gradedScoresCount = 0;
  let highestScore: number | null = null;
  let lowestScore: number | null = null;
  let passCount = 0;

  const gradeDistribution: Record<string, number> = {};

  students.forEach((student) => {
    // Numeric score stats
    if (student.final_score !== null && student.final_score !== undefined) {
      const score = parseFloat(student.final_score);
      if (!isNaN(score)) {
        totalNumericScore += score;
        gradedScoresCount++;
        if (highestScore === null || score > highestScore) highestScore = score;
        if (lowestScore === null || score < lowestScore) lowestScore = score;
        if (score >= 50) passCount++;
      }
    }

    // Grade distribution stats
    if (student.grade_letter) {
      const grade = student.grade_letter.toUpperCase();
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    }
  });

  const averageScore = gradedScoresCount > 0 ? parseFloat((totalNumericScore / gradedScoresCount).toFixed(1)) : null;
  const passRate = gradedScoresCount > 0 ? parseFloat(((passCount / gradedScoresCount) * 100).toFixed(1)) : null;

  return {
    totalAttempts,
    gradedCount,
    pendingCount,
    averageScore,
    highestScore,
    lowestScore,
    passCount,
    passRate,
    gradeDistribution,
  };
}

export function ResultsSummary({ results }: ResultsSummaryProps) {
  const metrics = React.useMemo(() => calculateResultMetrics(results), [results]);
  const disruptedCount = React.useMemo(
    () => (results.students || []).filter((s) => s.is_disrupted).length,
    [results.students]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Attempts */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Attempts</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {metrics.totalAttempts}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Students who initiated exam
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Graded Attempts */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Graded Submissions</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {metrics.gradedCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {metrics.totalAttempts > 0
                  ? `${Math.round((metrics.gradedCount / metrics.totalAttempts) * 100)}% completion rate`
                  : '0% completion'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Grading */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Pending / In Progress</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {metrics.pendingCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {metrics.pendingCount > 0 ? 'Awaiting grading completion' : 'All submissions evaluated'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {metrics.averageScore !== null ? `${metrics.averageScore}%` : 'N/A'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {metrics.highestScore !== null && metrics.lowestScore !== null
                  ? `High: ${metrics.highestScore}% | Low: ${metrics.lowestScore}%`
                  : 'Across graded submissions'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disruption Alert if any student was disrupted */}
      {disruptedCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>Note:</strong> {disruptedCount} student attempt{disruptedCount > 1 ? 's' : ''} experienced connectivity disruptions during this examination session.
          </span>
        </div>
      )}

      {/* Quick Grade Distribution Pill Strip */}
      {Object.keys(metrics.gradeDistribution).length > 0 && (
        <div className="rounded-lg border border-border bg-card/60 p-3.5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mr-2">
            <BarChart3 className="h-3.5 w-3.5" />
            Grade Distribution:
          </span>
          {Object.entries(metrics.gradeDistribution)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([grade, count]) => (
              <span
                key={grade}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted border border-border text-foreground"
              >
                <span>{grade}:</span>
                <span className="text-primary font-bold">{count}</span>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
