'use client';

import {
  BarChart3,
  Download,
} from 'lucide-react';
import * as React from 'react';

import {
  AppAreaChart,
  AppBarChart,
  AppLineChart,
  AppPieChart,
} from '@/components/charts';
import { toast } from '@/components/feedback';
import { Button } from '@/components/ui';
import { INITIAL_REPORT_DATA } from '../mock';

export function ReportsAnalytics() {
  const [timeRange, setTimeRange] = React.useState('semester');

  const handleExport = () => {
    toast.success('Report Exported', {
      description: 'Institutional analytics summary exported as PDF/CSV artifact.',
    });
  };

  const performanceData = INITIAL_REPORT_DATA.performanceTrends.map((p) => ({
    name: p.month,
    avg: p.avgScore,
    passRate: p.passRate,
  }));

  const deptData = INITIAL_REPORT_DATA.departmentPassRates.map((d) => ({
    name: d.department.split(' ')[0] || d.department,
    passRate: d.passRate,
    totalExams: d.totalExams,
  }));

  const aiData = INITIAL_REPORT_DATA.aiGradingStats.map((a) => ({
    name: a.month,
    automated: a.automated,
    manual: a.manualReview,
  }));

  const usageData = INITIAL_REPORT_DATA.systemUsage.map((u) => ({
    name: u.day,
    students: u.activeStudents,
    lecturers: u.activeLecturers,
  }));

  const gradeData = INITIAL_REPORT_DATA.gradeDistribution.map((g) => ({
    name: g.grade.split(' ')[0] || g.grade,
    value: g.percentage,
  }));

  const selectClass =
    'flex h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Reports & Institutional Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Academic performance metrics, pass rates, AI evaluation efficiency, and system usage trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className={selectClass}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="semester">This Semester</option>
            <option value="year">Last Academic Year</option>
            <option value="all">All Time</option>
          </select>
          <Button leftIcon={<Download className="h-4 w-4" />} onClick={handleExport}>
            Export Report
          </Button>
        </div>
      </div>

      {/* Grid of Visual Analytics Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Student Performance Trends */}
        <AppLineChart
          title="Student Performance & Pass Rate Trends"
          subtitle="Average examination score (%) vs Overall pass rate over recent months"
          data={performanceData}
          xKey="name"
          lines={[
            { key: 'avg', name: 'Average Score (%)', color: '#3b82f6' },
            { key: 'passRate', name: 'Pass Rate (%)', color: '#10b981' },
          ]}
        />

        {/* Pass Rates by Department */}
        <AppBarChart
          title="Department Pass Rate Comparison"
          subtitle="Comparative academic success rate (%) across faculties"
          data={deptData}
          xKey="name"
          bars={[
            { key: 'passRate', name: 'Pass Rate (%)', color: '#8b5cf6' },
          ]}
        />

        {/* AI Automated Grading Volume */}
        <AppAreaChart
          title="AI Automated Grading vs Manual Review"
          subtitle="Monthly volume of AI automated graded submissions vs lecturer manual overrides"
          data={aiData}
          xKey="name"
          areas={[
            { key: 'automated', name: 'Automated AI Graded', color: '#ec4899' },
            { key: 'manual', name: 'Manual Override / Review', color: '#f59e0b' },
          ]}
        />

        {/* Grade Distribution Pie Chart */}
        <AppPieChart
          title="Institutional Grade Distribution"
          subtitle="Proportion of A, B, C, D, and F letter grades awarded system-wide"
          data={gradeData}
          nameKey="name"
          valueKey="value"
        />
      </div>

      {/* System Usage Stats */}
      <div className="grid grid-cols-1 gap-6">
        <AppBarChart
          title="Active System Usage & Daily Traffic"
          subtitle="Daily active student and lecturer portal sessions during examination periods"
          data={usageData}
          xKey="name"
          bars={[
            { key: 'students', name: 'Active Students', color: '#06b6d4' },
            { key: 'lecturers', name: 'Active Lecturers', color: '#6366f1' },
          ]}
          height={320}
        />
      </div>
    </div>
  );
}
