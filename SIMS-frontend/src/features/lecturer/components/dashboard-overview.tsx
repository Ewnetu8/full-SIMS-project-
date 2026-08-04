'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  FileCheck,
  FileEdit,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { ROUTES } from '@/constants';
import { useAuthStore } from '@/features/auth/store';
import { getUserDisplayName } from '@/utils/string';

import { lecturerService } from '../services';

import type { Course, LecturerExam, StudentSubmission } from '../types';

export function LecturerDashboardOverview() {
  const { user } = useAuthStore();
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [exams, setExams] = React.useState<LecturerExam[]>([]);
  const [submissions, setSubmissions] = React.useState<StudentSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [cList, eList, sList] = await Promise.all([
          lecturerService.getCourses(),
          lecturerService.getExams(),
          lecturerService.getSubmissions(),
        ]);
        setCourses(cList);
        setExams(eList);
        setSubmissions(sList);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeExams = exams.filter((e) => e.status === 'PUBLISHED');
  const draftExams = exams.filter((e) => e.status === 'DRAFT');
  const pendingAiGrading = submissions.filter((s) => s.aiGradingStatus === 'PENDING' || s.aiGradingStatus === 'PROCESSING');
  const totalStudents = courses.reduce((acc, c) => acc + c.studentCount, 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <Card className="relative overflow-hidden border-primary/20 bg-primary/5 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Lecturer Control Center
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {user ? getUserDisplayName(user).split(' ')[0] : 'Lecturer'}
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Manage your course examinations, evaluate AI-graded submissions, and track student performance metrics.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 sm:pt-0">
            <Button asChild size="lg" leftIcon={<Plus className="h-4 w-4" />}>
              <Link href={ROUTES.LECTURER.EXAM_CREATE}>Create New Exam</Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Reusable Statistic Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Courses</span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">{courses.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">{totalStudents} Total enrolled students</p>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Exams</span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-success/10 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">{activeExams.length}</p>
            <p className="mt-1 text-xs text-success font-medium">Published & receiving submissions</p>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Draft Exams</span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-warning/10 text-warning">
                <FileEdit className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">{draftExams.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Ready for question editing & review</p>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending AI Grading</span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-ai-primary/15 text-ai-primary">
                <Brain className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">{pendingAiGrading.length}</p>
            <p className="mt-1 text-xs text-ai-primary font-medium">AI evaluation in queue</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Active Exams & Submissions Activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Active & Recent Examinations */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Examination Overview</h2>
            <Button asChild variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              <Link href={ROUTES.LECTURER.EXAMS}>Manage All Exams</Link>
            </Button>
          </div>

          <div className="space-y-3">
            {exams.slice(0, 3).map((exam) => (
              <Card key={exam.id} hoverable className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {exam.courseCode}
                        </span>
                        <Badge
                          variant={
                            exam.status === 'PUBLISHED'
                              ? 'success'
                              : exam.status === 'DRAFT'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {exam.status}
                        </Badge>
                      </div>
                      <h3 className="text-base font-semibold text-foreground">{exam.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{exam.description}</p>
                    </div>

                    <div className="flex items-center gap-3 pt-2 sm:pt-0 shrink-0">
                      <div className="text-right text-xs text-muted-foreground hidden sm:block">
                        <p className="font-medium text-foreground">{exam.questions.length} Questions</p>
                        <p>{exam.durationMinutes} mins · {exam.totalMarks} Marks</p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={ROUTES.LECTURER.EXAM_SUBMISSIONS(exam.id)}>Submissions</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Submissions & Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent Submissions</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href={ROUTES.LECTURER.ANALYTICS}>Analytics</Link>
            </Button>
          </div>

          <Card>
            <CardContent className="p-5 divide-y divide-border/60">
              {submissions.map((sub) => (
                <div key={sub.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{sub.studentName}</span>
                    <Badge
                      variant={
                        sub.aiGradingStatus === 'COMPLETED'
                          ? 'success'
                          : sub.aiGradingStatus === 'PROCESSING'
                          ? 'info'
                          : 'secondary'
                      }
                    >
                      {sub.aiGradingStatus === 'COMPLETED'
                        ? 'AI Graded'
                        : sub.aiGradingStatus === 'PROCESSING'
                        ? 'AI Processing'
                        : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{sub.examTitle}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {sub.score !== undefined && (
                      <span className="font-semibold text-foreground">
                        {sub.score} / {sub.totalMarks} pts
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
