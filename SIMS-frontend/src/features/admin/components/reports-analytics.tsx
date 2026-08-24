'use client';

import {
  BarChart3,
  AlertTriangle,
  Users,
  BookOpen,
  Building2,
  FileCheck,
  RefreshCw,
  Search,
  School,
  Layers,
  GraduationCap,
  Percent,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import * as React from 'react';

import { toast, LoadingSpinner } from '@/components/feedback';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
} from '@/components/ui';
import {
  getAdvisingReport,
  getAdminAnalytics,
  getExamAnalytics,
} from '@/features/analytics/services/analytics-api';
import { getUserFriendlyErrorMessage } from '@/lib/errors';

import { academicService } from '../services/academic-service';
import { examApiService } from '../services/exam-api-service';

import type { Semester, AdminExamOverview } from '../types';
import type {
  AdvisingReportResponse,
  AdminAnalyticsResponse,
  ExamAnalyticsResponse,
} from '@/types/api';

export function ReportsAnalytics() {
  // Semester & Advising State
  const [semesters, setSemesters] = React.useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = React.useState<string>('');
  const [advisingReport, setAdvisingReport] = React.useState<AdvisingReportResponse | null>(null);
  const [loadingAdvising, setLoadingAdvising] = React.useState<boolean>(false);
  const [advisingError, setAdvisingError] = React.useState<string | null>(null);

  // Class standing filter for advising
  const [classStandingFilter, setClassStandingFilter] = React.useState<string>('ALL');
  const [searchTerm, setSearchTerm] = React.useState('');

  // Institutional System Stats State (GET /api/v1/analytics/admin)
  const [adminAnalytics, setAdminAnalytics] = React.useState<AdminAnalyticsResponse | null>(null);
  const [loadingStats, setLoadingStats] = React.useState(true);

  // Exam Analytics Selection State (GET /api/v1/analytics/exam/{id})
  const [exams, setExams] = React.useState<AdminExamOverview[]>([]);
  const [selectedExamId, setSelectedExamId] = React.useState<string>('');
  const [examAnalytics, setExamAnalytics] = React.useState<ExamAnalyticsResponse | null>(null);
  const [loadingExamAnalytics, setLoadingExamAnalytics] = React.useState<boolean>(false);
  const [examAnalyticsError, setExamAnalyticsError] = React.useState<string | null>(null);

  // Initial load of semesters, exams, and overall system analytics
  const loadInitialData = React.useCallback(async () => {
    setLoadingStats(true);
    try {
      const [analyticsData, sems, examsList] = await Promise.all([
        getAdminAnalytics().catch(() => null),
        academicService.getSemesters().catch(() => []),
        examApiService.getExams().catch(() => []),
      ]);

      setAdminAnalytics(analyticsData);
      setSemesters(sems);
      setExams(examsList);

      if (sems.length > 0 && !selectedSemesterId && sems[0]?.id) {
        setSelectedSemesterId(sems[0].id);
      }

      if (examsList.length > 0 && !selectedExamId && examsList[0]?.id) {
        setSelectedExamId(examsList[0].id);
      }
    } catch (err) {
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setLoadingStats(false);
    }
  }, [selectedSemesterId, selectedExamId]);

  React.useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  // Fetch advising report when selected semester changes
  const fetchAdvising = React.useCallback(async (semesterId: string) => {
    if (!semesterId) return;
    setLoadingAdvising(true);
    setAdvisingError(null);
    try {
      const report = await getAdvisingReport(semesterId);
      setAdvisingReport(report);
    } catch (err) {
      const msg = getUserFriendlyErrorMessage(err);
      setAdvisingError(msg);
      setAdvisingReport(null);
    } finally {
      setLoadingAdvising(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedSemesterId) {
      void fetchAdvising(selectedSemesterId);
    }
  }, [selectedSemesterId, fetchAdvising]);

  // Fetch exam analytics when selected exam changes
  const fetchSelectedExamAnalytics = React.useCallback(async (examId: string) => {
    if (!examId) return;
    setLoadingExamAnalytics(true);
    setExamAnalyticsError(null);
    try {
      const data = await getExamAnalytics(examId);
      setExamAnalytics(data);
    } catch (err) {
      setExamAnalyticsError(getUserFriendlyErrorMessage(err));
      setExamAnalytics(null);
    } finally {
      setLoadingExamAnalytics(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedExamId) {
      void fetchSelectedExamAnalytics(selectedExamId);
    }
  }, [selectedExamId, fetchSelectedExamAnalytics]);

  // Filtered Advising Students
  const filteredStudents = React.useMemo(() => {
    if (!advisingReport?.students) return [];
    return advisingReport.students.filter((s) => {
      if (classStandingFilter !== 'ALL' && s.class_standing !== classStandingFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const idMatch = s.student_identifier.toLowerCase().includes(term);
        const standingMatch = s.class_standing.toLowerCase().includes(term);
        if (!idMatch && !standingMatch) return false;
      }
      return true;
    });
  }, [advisingReport, classStandingFilter, searchTerm]);

  const selectClass =
    'flex h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-primary" /> Reports & Institutional Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Academic structure metrics, student credit-hour advising flags, and examination performance analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {semesters.length > 0 && (
            <select
              className={selectClass}
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.academicYearDetail?.displayLabel
                    ? `${s.academicYearDetail.displayLabel} - ${s.semesterIndex}`
                    : `Semester (${s.semesterIndex})`}
                </option>
              ))}
            </select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void loadInitialData();
              if (selectedSemesterId) void fetchAdvising(selectedSemesterId);
            }}
            disabled={loadingStats || loadingAdvising}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loadingStats || loadingAdvising ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards (from GET /api/v1/analytics/admin) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <School className="h-4 w-4 text-blue-500" /> Total Colleges & Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loadingStats ? '—' : adminAnalytics ? `${adminAnalytics.total_colleges} Colg / ${adminAnalytics.total_departments} Depts` : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {adminAnalytics ? `${adminAnalytics.total_programs} Degree Programs` : 'Academic faculties'}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-primary" /> Enrolled Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loadingStats ? '—' : adminAnalytics ? adminAnalytics.total_students.toLocaleString() : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {adminAnalytics ? `${adminAnalytics.total_lecturers} Faculty Members` : 'Active students'}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-emerald-500" /> Active Course Catalogue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loadingStats ? '—' : adminAnalytics ? adminAnalytics.total_courses : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Institutional courses</p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Credit Advising Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loadingAdvising ? '—' : advisingReport?.students?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Under minimum credit requirement</p>
          </CardContent>
        </Card>
      </div>

      {/* Advising Analytics Section (GET /api/v1/analytics/advising?semester=<id>) */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" /> Academic Advising Report
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Students enrolled below their class standing&apos;s minimum credit hour policy ({advisingReport?.semester_label || 'Selected Semester'})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className={selectClass}
              value={classStandingFilter}
              onChange={(e) => setClassStandingFilter(e.target.value)}
            >
              <option value="ALL">All Class Standings</option>
              <option value="FRESHMAN">Freshman</option>
              <option value="SOPHOMORE">Sophomore</option>
              <option value="JUNIOR">Junior</option>
              <option value="SENIOR">Senior</option>
              <option value="GRADUATE">Graduate</option>
            </select>

            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void fetchAdvising(selectedSemesterId)}
              disabled={loadingAdvising}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loadingAdvising ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-muted-foreground">Loading credit-hour advising report...</p>
            </div>
          ) : advisingError ? (
            <div className="p-8 text-center space-y-3">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm font-medium text-foreground">{advisingError}</p>
              <Button size="sm" variant="outline" onClick={() => void fetchAdvising(selectedSemesterId)}>
                Retry
              </Button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h4 className="font-semibold text-foreground">No Credit Advisory Flags</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                All enrolled students meet or exceed the minimum credit hour requirement for the selected semester.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Student ID / Identifier</th>
                    <th className="py-3 px-4">Class Standing</th>
                    <th className="py-3 px-4 text-center">Enrolled Credits</th>
                    <th className="py-3 px-4 text-center">Required Min Credits</th>
                    <th className="py-3 px-4 text-center">Credit Deficit</th>
                    <th className="py-3 px-4 text-right">Advisory Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.map((student) => {
                    const deficit = student.min_credit_hours - student.enrolled_credit_hours;
                    return (
                      <tr key={student.student_id} className="hover:bg-accent/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-foreground text-xs">
                          {student.student_identifier}
                        </td>
                        <td className="py-3 px-4 font-medium text-xs">
                          <Badge variant="outline" className="text-[10px]">
                            {student.class_standing}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-xs text-amber-600 dark:text-amber-400">
                          {student.enrolled_credit_hours} hrs
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                          {student.min_credit_hours} hrs
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-xs text-destructive">
                          -{deficit > 0 ? deficit : 0} hrs
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge variant="warning" className="text-[10px]">
                            Below Minimum
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Examination Performance Analytics (GET /api/v1/analytics/exam/{id}) */}
      {exams.length > 0 && (
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" /> Examination Performance Breakdown
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Score statistics, distribution bands, and difficulty ratings for selected assessments.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                className={selectClass}
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.courseCode || ex.status})
                  </option>
                ))}
              </select>

              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={() => void fetchSelectedExamAnalytics(selectedExamId)}
                disabled={loadingExamAnalytics}
              >
                Refresh
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {loadingExamAnalytics ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-2">
                <LoadingSpinner size="md" />
                <p className="text-sm text-muted-foreground">Loading examination analytics...</p>
              </div>
            ) : examAnalyticsError ? (
              <div className="p-6 text-center space-y-2">
                <AlertTriangle className="h-6 w-6 text-destructive mx-auto" />
                <p className="text-sm text-muted-foreground">{examAnalyticsError}</p>
              </div>
            ) : examAnalytics ? (
              <div className="space-y-6">
                {/* Metric Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-lg border border-border bg-card/60">
                    <p className="text-xs text-muted-foreground">Total Attempts</p>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {examAnalytics.attempt_count} ({examAnalytics.graded_count} Graded)
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-border bg-card/60">
                    <p className="text-xs text-muted-foreground">Pass Rate</p>
                    <p className="text-xl font-bold text-emerald-600 mt-1">
                      {examAnalytics.pass_rate !== null ? `${examAnalytics.pass_rate}%` : 'N/A'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-border bg-card/60">
                    <p className="text-xs text-muted-foreground">Mean Score</p>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {examAnalytics.score?.mean !== null && examAnalytics.score?.mean !== undefined
                        ? examAnalytics.score.mean
                        : 'N/A'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-border bg-card/60">
                    <p className="text-xs text-muted-foreground">Score Range</p>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {examAnalytics.score?.min ?? '—'} - {examAnalytics.score?.max ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Score Distribution Bands */}
                {examAnalytics.score_distribution && examAnalytics.score_distribution.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Score Distribution Bands
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {examAnalytics.score_distribution.map((band) => (
                        <div
                          key={band.label}
                          className="p-2.5 rounded-lg border border-border bg-muted/20 text-center"
                        >
                          <span className="text-xs font-medium text-muted-foreground">{band.label}</span>
                          <p className="text-lg font-bold text-foreground">{band.count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Select an examination above to view performance analytics.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
