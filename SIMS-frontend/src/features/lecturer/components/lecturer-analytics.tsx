'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { lecturerService } from '../services';
import type { LecturerAnalytics } from '../types';

// Simple bar chart using CSS/SVG (no external chart lib needed)
function BarChart({
  data,
  labelKey,
  valueKey,
  color = 'var(--primary)',
}: {
  data: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey] ?? 0)), 1);
  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const pct = (Number(item[valueKey] ?? 0) / max) * 100;
        return (
          <div key={i} className="flex items-center gap-3 text-xs">
            <span className="w-20 shrink-0 text-right text-muted-foreground">{String(item[labelKey])}</span>
            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <span className="w-10 font-medium text-foreground">{String(item[valueKey])}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="mt-2 text-3xl font-bold" style={{ color }}>{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function LecturerAnalyticsView() {
  const [analytics, setAnalytics] = React.useState<LecturerAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    lecturerService.getAnalytics().then((data) => {
      setAnalytics(data);
      setLoading(false);
    });
  }, []);

  if (loading || !analytics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const difficultyColor: Record<string, string> = {
    Easy: 'var(--success)',
    Medium: 'var(--warning)',
    Hard: 'var(--destructive)',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Class Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Aggregated performance metrics across all active examinations this semester.
        </p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Class Average"
          value={`${analytics.classAverage}%`}
          sub="Across all submitted exams"
          color="var(--primary)"
        />
        <StatCard
          label="Pass Rate"
          value={`${analytics.passRate}%`}
          sub="Students above passing threshold"
          color="var(--success)"
        />
        <StatCard
          label="Submission Rate"
          value={`${analytics.submissionRate}%`}
          sub="Students who submitted on time"
          color="hsl(var(--ai-primary))"
        />
        <StatCard
          label="Completion Rate"
          value={`${analytics.completionRate}%`}
          sub="Exams answered to completion"
          color="var(--warning)"
        />
      </div>

      {/* Score Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <BarChart
              data={analytics.scoreDistribution.map((d) => ({ range: d.range, count: d.count }))}
              labelKey="range"
              valueKey="count"
              color="hsl(var(--primary))"
            />
          </CardContent>
        </Card>

        {/* Question Difficulty */}
        <Card>
          <CardHeader>
            <CardTitle>Question Difficulty Analysis</CardTitle>
          </CardHeader>
          <CardContent className="pb-6 space-y-3">
            {analytics.questionDifficulty.map((q) => (
              <div key={q.questionId} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-foreground line-clamp-1 flex-1">{q.prompt}</span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${difficultyColor[q.difficulty] ?? 'gray'} 15%, transparent)`,
                      color: difficultyColor[q.difficulty],
                    }}
                  >
                    {q.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${q.averageScorePct}%`,
                        backgroundColor: difficultyColor[q.difficulty],
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-muted-foreground">{q.averageScorePct}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
