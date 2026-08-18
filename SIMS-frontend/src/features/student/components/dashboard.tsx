'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

import { StatsCard } from '@/components/data-display';
import { PageHeader } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback';
import { ROUTES } from '@/constants';
import { useAuthStore } from '@/features/auth/store';
import { useStudentStore } from '../store/student-store';

const formatDate = (value: string) => {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const formatTime = (value: string) => {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('en-KE', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

export function StudentDashboard() {
  const user = useAuthStore((state) => state.user);
  const {
    enrollments,
    activeExams,
    notifications,
    isLoadingEnrollments,
    isLoadingExams,
    isLoadingNotifications,
    enrollmentsError,
    examsError,
    notificationsError,
    fetchEnrollments,
    fetchActiveExams,
    fetchNotifications,
  } = useStudentStore();

  React.useEffect(() => {
    void fetchEnrollments();
    void fetchActiveExams();
  }, [fetchEnrollments, fetchActiveExams]);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.firstName || user?.email?.split('@')[0] || 'Student';

  const enrolledCount = enrollments.length;
  const activeExamsCount = activeExams.length;
  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;
  const gradedEnrollments = enrollments.filter(
    (e) => e.status === 'PASSED' || e.status === 'FAILED' || Boolean(e.grade)
  );

  const isLoading = isLoadingEnrollments || isLoadingExams;
  const hasError = enrollmentsError || examsError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-7"
    >
      <PageHeader
        breadcrumb={
          <Breadcrumb items={[{ label: 'Student portal' }, { label: 'Overview' }]} />
        }
        title={`${greeting}, ${firstName}`}
        description="Your academic workspace is synchronized with SIMS records."
      />

      {/* Academic statistics section */}
      <section aria-label="Academic statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Enrolled courses"
          value={isLoading ? '...' : enrolledCount}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatsCard
          title="Active exams"
          value={isLoading ? '...' : activeExamsCount}
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <StatsCard
          title="Unread Notifications"
          value={unreadNotificationsCount}
          icon={<Bell className="h-5 w-5" />}
        />
        <StatsCard
          title="Completed / Graded"
          value={isLoading ? '...' : gradedEnrollments.length}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </section>

      {hasError && (
        <ErrorState
          title="Data Synchronization Notice"
          description={enrollmentsError || examsError || 'Unable to sync dashboard with backend.'}
          onRetry={() => {
            void fetchEnrollments();
            void fetchActiveExams();
          }}
          retryLabel="Reload Data"
        />
      )}

      <section className="grid gap-6 xl:grid-cols-5">
        {/* Active Examinations Card */}
        <Card className="xl:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Active & Scheduled Examinations</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Assessments currently available for your enrolled courses.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={ROUTES.STUDENT.EXAMS}>
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingExams ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-xl space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))
            ) : activeExams.length === 0 ? (
              <EmptyState
                icon={<ClipboardCheck className="h-8 w-8 text-muted-foreground" />}
                title="No active exams"
                description="You don't have any exams available right now."
              />
            ) : (
              activeExams.map((exam) => {
                const offering = exam.course_offering_detail;
                const courseTitle = offering?.course_title || offering?.course_detail?.title || 'Course Exam';
                const courseCode = offering?.course_code || offering?.course_detail?.course_code || 'COURSE';

                return (
                  <div
                    key={exam.id}
                    className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{exam.title}</p>
                      <p className="mt-1.5 text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{courseCode}</span>
                        <span>· {courseTitle}</span>
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(exam.start_window)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatTime(exam.start_window)} · {exam.duration_minutes} mins
                        </span>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={ROUTES.STUDENT.EXAM(exam.id)}>View details</Link>
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <p className="text-sm text-muted-foreground">Shortcuts for your essential student tools.</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            <QuickAction
              href={ROUTES.STUDENT.COURSES}
              icon={<BookOpen className="h-5 w-5" />}
              title="My Courses"
              description="Review enrolled subjects and credit hours"
            />
            <QuickAction
              href={ROUTES.STUDENT.EXAMS}
              icon={<ClipboardCheck className="h-5 w-5" />}
              title="Active Exams"
              description="Take or preview scheduled examinations"
            />
            <QuickAction
              href={ROUTES.STUDENT.RESULTS}
              icon={<GraduationCap className="h-5 w-5" />}
              title="Results & Status"
              description="Check course grades and academic outcomes"
            />
            <QuickAction
              href={ROUTES.STUDENT.NOTIFICATIONS}
              icon={<Bell className="h-5 w-5" />}
              title="Notifications"
              description="Review academic alerts and updates"
            />
            <QuickAction
              href={ROUTES.STUDENT.PROFILE}
              icon={<Sparkles className="h-5 w-5" />}
              title="My Profile"
              description="View your user identity and system details"
            />
          </CardContent>
        </Card>
      </section>

      {/* Recent Enrolled Courses Section */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Enrolments</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Courses associated with your current registration in SIMS.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.STUDENT.COURSES}>
              All courses <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingEnrollments ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-xl space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-5 w-2/3" />
                </div>
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-8 w-8 text-muted-foreground" />}
              title="No course enrollments"
              description="You are not currently enrolled in any courses."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {enrollments.slice(0, 4).map((enrollment) => {
                const offering = enrollment.course_offering_detail;
                const course = offering?.course_detail;
                return (
                  <div
                    key={enrollment.id}
                    className="rounded-xl border border-border p-4 transition hover:border-primary/50 hover:bg-accent/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {course?.title || 'Enrolled Course'}
                        </p>
                        <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{course?.course_code || 'CODE'}</span>
                          <span>· {course?.credit_hours || 0} credit hrs · Section {offering?.section || 'A'}</span>
                        </p>
                      </div>
                      <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-mono font-bold text-primary">
                        {enrollment.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
    </Link>
  );
}