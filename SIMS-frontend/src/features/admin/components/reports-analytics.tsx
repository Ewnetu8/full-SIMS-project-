'use client';

import * as React from 'react';
import {
  BarChart3,
  Download,
  AlertTriangle,
  Users,
  BookOpen,
  Building2,
  FileCheck,
  RefreshCw,
  Search,
} from 'lucide-react';

import { toast, LoadingSpinner } from '@/components/feedback';
import { getUserFriendlyErrorMessage } from '@/lib/errors';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input } from '@/components/ui';
import { getAdvisingReport } from '@/features/analytics/services/analytics-api';
import { academicService } from '../services/academic-service';
import { examApiService } from '../services/exam-api-service';
import type { Semester } from '../types';
import type { AdvisingReportResponse } from '@/types/api';

export function ReportsAnalytics() {
  const [semesters, setSemesters] = React.useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = React.useState<string>('');
  const [advisingReport, setAdvisingReport] = React.useState<AdvisingReportResponse | null>(null);
  const [loadingAdvising, setLoadingAdvising] = React.useState<boolean>(false);
  const [advisingError, setAdvisingError] = React.useState<string | null>(null);

  // System Stats State
  const [stats, setStats] = React.useState({
    totalExams: 0,
    publishedExams: 0,
    activeExams: 0,
    totalDepartments: 0,
    totalCourses: 0,
  });
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Initial load of semesters and overall system stats
  const loadInitialData = React.useCallback(async () => {
    setLoadingStats(true);
    try {
      const [sems, examsList, deptsList, coursesList] = await Promise.all([
        academicService.getSemesters().catch(() => []),
        examApiService.getExams().catch(() => []),
        academicService.getDepartments().catch(() => []),
        academicService.getCourses().catch(() => []),
      ]);

      setSemesters(sems);
      if (sems.length > 0 && !selectedSemesterId && sems[0]?.id) {
        setSelectedSemesterId(sems[0].id);
      }

      setStats({
        totalExams: examsList.length,
        publishedExams: examsList.filter((e) => e.status === 'published').length,
        activeExams: examsList.filter((e) => e.status === 'active').length,
        totalDepartments: deptsList.length,
        totalCourses: coursesList.length,
      });
    } catch (err) {
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setLoadingStats(false);
    }
  }, [selectedSemesterId]);

  React.useEffect(() => {
    loadInitialData();
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
      fetchAdvising(selectedSemesterId);
    }
  }, [selectedSemesterId, fetchAdvising]);

  const handleExport = () => {
    try {
      if (!advisingReport || advisingReport.students.length === 0) {
        toast.info('No advising report data available to export.');
        return;
      }
      const headers = ['Student ID', 'Identifier', 'Class Standing', 'Enrolled Credits', 'Min Required Credits'];
      const rows = advisingReport.students.map((s) => [
        s.student_id,
        s.student_identifier,
        s.class_standing,
        s.enrolled_credit_hours,
        s.min_credit_hours,
      ]);
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `advising_report_${advisingReport.semester_label || 'semester'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Advising analytics report exported successfully.');
    } catch (err) {
      toast.error(getUserFriendlyErrorMessage(err));
    }
  };

  const filteredStudents = React.useMemo(() => {
    if (!advisingReport?.students) return [];
    if (!searchTerm.trim()) return advisingReport.students;
    const term = searchTerm.toLowerCase();
    return advisingReport.students.filter(
      (s) =>
        s.student_identifier.toLowerCase().includes(term) ||
        s.class_standing.toLowerCase().includes(term)
    );
  }, [advisingReport, searchTerm]);

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
            Academic structure statistics, active examination counts, and student credit-hour advising reports.
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
          <Button leftIcon={<Download className="h-4 w-4" />} onClick={handleExport} variant="outline">
            Export CSV
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-primary" /> Total Examinations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '—' : stats.totalExams}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.publishedExams} published / {stats.activeExams} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-indigo-500" /> Academic Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '—' : stats.totalDepartments}</div>
            <p className="text-xs text-muted-foreground mt-1">Active academic units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-emerald-500" /> Registered Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '—' : stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground mt-1">System course offerings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Credit Advising Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingAdvising ? '—' : advisingReport?.students?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Students under credit minimum</p>
          </CardContent>
        </Card>
      </div>

      {/* Advising Analytics Section */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" /> Academic Advising Report
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Students enrolled below their class standing&apos;s minimum credit hour policy ({advisingReport?.semester_label || 'Selected Semester'})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student or class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => fetchAdvising(selectedSemesterId)}
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
              <Button size="sm" variant="outline" onClick={() => fetchAdvising(selectedSemesterId)}>
                Retry
              </Button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <FileCheck className="h-10 w-10 text-emerald-500 mx-auto" />
              <h4 className="font-semibold text-foreground">No Credit Advisory Flags</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                All enrolled students meet or exceed the minimum credit hour requirement for the selected semester.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                    <th className="py-3 px-4">Student ID / Identifier</th>
                    <th className="py-3 px-4">Class Standing</th>
                    <th className="py-3 px-4 text-center">Enrolled Credits</th>
                    <th className="py-3 px-4 text-center">Required Min Credits</th>
                    <th className="py-3 px-4 text-center">Deficit</th>
                    <th className="py-3 px-4 text-right">Advisory Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.map((student) => {
                    const deficit = student.min_credit_hours - student.enrolled_credit_hours;
                    return (
                      <tr key={student.student_id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-foreground text-xs">
                          {student.student_identifier}
                        </td>
                        <td className="py-3 px-4 font-medium text-xs">{student.class_standing}</td>
                        <td className="py-3 px-4 text-center font-semibold text-xs text-amber-600 dark:text-amber-400">
                          {student.enrolled_credit_hours} hrs
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs">{student.min_credit_hours} hrs</td>
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
    </div>
  );
}
