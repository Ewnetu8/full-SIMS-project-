'use client';

import { 
  Calendar, 
  AlertTriangle, 
  TrendingDown, 
  Clock 
} from 'lucide-react';
import * as React from 'react';

import { Card, CardContent } from '@/components/ui';

import type { AdvisingReportResponse } from '../types';

export interface ReportSummaryProps {
  report: AdvisingReportResponse;
}

export function ReportSummary({ report }: ReportSummaryProps) {
  const students = React.useMemo(() => report.students || [], [report.students]);
  const totalCount = students.length;

  const { totalDeficit, maxDeficit, avgDeficit } = React.useMemo(() => {
    if (students.length === 0) {
      return { totalDeficit: 0, maxDeficit: 0, avgDeficit: 0 };
    }

    let sum = 0;
    let max = 0;
    for (const s of students) {
      const deficit = Math.max(0, s.min_credit_hours - s.enrolled_credit_hours);
      sum += deficit;
      if (deficit > max) max = deficit;
    }

    const avg = sum > 0 ? (sum / students.length).toFixed(1) : 0;
    return { totalDeficit: sum, maxDeficit: max, avgDeficit: avg };
  }, [students]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Students Requiring Advising */}
      <Card className="border-border bg-card shadow-sm hover:shadow transition-shadow">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Students Flagged
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {totalCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalCount === 1 ? 'Student requires advising' : 'Students below credit minimum'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Selected Semester */}
      <Card className="border-border bg-card shadow-sm hover:shadow transition-shadow">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Semester
            </span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate" title={report.semester_label}>
              {report.semester_label || 'Current Semester'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Institutional policy target
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Credit Deficit Hours */}
      <Card className="border-border bg-card shadow-sm hover:shadow transition-shadow">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Deficit Hours
            </span>
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-destructive">
              {totalDeficit} <span className="text-sm font-normal text-muted-foreground">hrs</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cumulative credit-hour shortfall
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Average & Max Deficit */}
      <Card className="border-border bg-card shadow-sm hover:shadow transition-shadow">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Average Deficit
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {avgDeficit} <span className="text-sm font-normal text-muted-foreground">hrs/student</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Peak single shortage: {maxDeficit} hrs
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
