'use client';

import * as React from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  HelpCircle,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { EmptyState, ErrorState, Skeleton, toast } from '@/components/feedback';
import { PageHeader } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ROUTES } from '@/constants';

import { studentService } from '../services';
import { useStudentStore } from '../store/student-store';
import type { Examination } from '../types';

const formatDate = (value: string) => {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

export function ExamsPage({ completed = false }: { completed?: boolean }) {
  const { activeExams, isLoadingExams, examsError, fetchActiveExams } = useStudentStore();

  React.useEffect(() => {
    void fetchActiveExams();
  }, [fetchActiveExams]);

  const title = completed ? 'Completed exams' : 'Available exams';
  const description = completed
    ? 'Review examinations you have already submitted.'
    : 'Review active examinations available for your enrolled courses.';

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[{ label: 'Student portal', href: ROUTES.STUDENT.DASHBOARD }, { label: title }]}
          />
        }
        title={title}
        description={description}
      />

      {isLoadingExams ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 space-y-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : examsError ? (
        <ErrorState
          title="Couldn't load examinations"
          description={examsError}
          onRetry={() => { void fetchActiveExams(); }}
          retryLabel="Try again"
        />
      ) : activeExams.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-10 w-10 text-muted-foreground" />}
          title="No active exams"
          description="You don't have any exams available right now. Please check back later."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {activeExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} completed={completed} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExamCard({ exam, completed }: { exam: Examination; completed: boolean }) {
  const offering = exam.course_offering_detail;
  const courseTitle = offering?.course_title || offering?.course_detail?.title || 'Course Assessment';
  const courseCode = offering?.course_code || offering?.course_detail?.course_code || 'COURSE';

  const isAvailable = exam.status === 'ACTIVE';

  return (
    <Card hoverable className="border-border/80 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{courseCode}</p>
            <CardTitle className="mt-1">{exam.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {courseTitle} {exam.lecturer ? `· ${exam.lecturer}` : ''}
            </p>
          </div>
          <Badge variant={isAvailable ? 'success' : completed ? 'secondary' : 'warning'}>
            {exam.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Detail icon={<Clock3 className="h-3.5 w-3.5" />} label="Duration" value={`${exam.duration_minutes} minutes`} />
          <Detail
            icon={<FileText className="h-3.5 w-3.5" />}
            label="Questions"
            value={`${exam.questions?.length || 0} items`}
          />
          <Detail
            icon={<CalendarDays className="h-3.5 w-3.5" />}
            label="Opens"
            value={formatDate(exam.start_window)}
            className="col-span-2"
          />
        </dl>
        <div className="mt-5 flex justify-end">
          <Button asChild size="sm">
            <Link href={ROUTES.STUDENT.EXAM(exam.id)}>
              {isAvailable ? 'View details & start' : 'View details'}{' '}
              <Play className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({
  icon,
  label,
  value,
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function ExamDetails({ examId }: { examId: string }) {
  const router = useRouter();
  const [exam, setExam] = React.useState<Examination | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isStarting, setIsStarting] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    async function loadDetails() {
      try {
        setLoading(true);
        setError(null);
        const data = await studentService.getExamDetails(examId);
        if (isMounted) {
          setExam(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || err?.detail || 'Unable to load examination details.');
          setLoading(false);
        }
      }
    }
    void loadDetails();
    return () => {
      isMounted = false;
    };
  }, [examId]);

  const handleStartExam = async () => {
    if (!exam) return;
    setIsStarting(true);
    try {
      await studentService.startExam(exam.id);
      router.push(ROUTES.STUDENT.EXAM_TAKE(exam.id));
    } catch (err: any) {
      setIsStarting(false);
      const msg =
        err?.message ||
        err?.detail ||
        'This exam is not currently available or you are not enrolled in this course.';
      toast.error(msg, { id: 'exam-start-error' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-10 w-10 text-muted-foreground" />}
        title="Exam not found"
        description={error || 'This exam may no longer be available.'}
        action={{ label: 'Back to exams', onClick: () => router.push(ROUTES.STUDENT.EXAMS) }}
      />
    );
  }

  const offering = exam.course_offering_detail;
  const courseTitle = offering?.course_title || offering?.course_detail?.title || 'Course Assessment';
  const courseCode = offering?.course_code || offering?.course_detail?.course_code || 'COURSE';
  const canBegin = exam.status === 'ACTIVE';

  const defaultInstructions = [
    'Read every question carefully before answering.',
    'Your answers are saved automatically while the exam is in progress.',
    'Ensure you submit your examination before the duration expires.',
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Student portal', href: ROUTES.STUDENT.DASHBOARD },
              { label: 'Available exams', href: ROUTES.STUDENT.EXAMS },
              { label: exam.title },
            ]}
          />
        }
        title={exam.title}
        description={`${courseCode} · ${courseTitle} ${exam.lecturer ? `(Instructor: ${exam.lecturer})` : ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              <Link href={ROUTES.STUDENT.EXAMS}>Back to Available Exams</Link>
            </Button>
            <Button
              onClick={handleStartExam}
              disabled={!canBegin || isStarting}
              loading={isStarting}
              leftIcon={<Play className="h-4 w-4" />}
            >
              Start Exam
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left main area: Instructions & Integrity Rules */}
        <div className="space-y-6 lg:col-span-2">
          {/* Instructions Card */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Examination Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-3">
                {defaultInstructions.map((instruction) => (
                  <li key={instruction} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Academic Integrity Notice Card */}
          <Card className="border-warning/40 bg-warning/5 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Academic Integrity Honor Code</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  By starting this examination, you affirm on your honor that all submitted work is purely your own, executed without unauthorized collaboration, external assistance, or prohibited references.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar: Exam Details Summary */}
        <Card className="border-border/80 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg">At a Glance</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <Detail
                icon={<HelpCircle className="h-4 w-4" />}
                label="Questions"
                value={`${exam.questions?.length || 0} items`}
              />
              <Detail
                icon={<Clock3 className="h-4 w-4" />}
                label="Duration"
                value={`${exam.duration_minutes} minutes`}
              />
              <Detail
                icon={<RotateCcw className="h-4 w-4" />}
                label="Status"
                value={exam.status}
              />
              <Detail
                icon={<CalendarDays className="h-4 w-4" />}
                label="Window Opens"
                value={formatDate(exam.start_window)}
              />
              <Detail
                icon={<CalendarDays className="h-4 w-4" />}
                label="Window Closes"
                value={formatDate(exam.end_window)}
              />
            </dl>

            <div className="mt-6 pt-4 border-t border-border/60">
              <Button
                onClick={handleStartExam}
                disabled={!canBegin || isStarting}
                loading={isStarting}
                className="w-full"
                size="lg"
                rightIcon={<Play className="h-4 w-4" />}
              >
                Start Exam Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {!canBegin && (
        <div
          role="status"
          className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm font-medium text-warning-foreground"
        >
          This examination is not currently open for submission. Please check your schedule and return during its active window.
        </div>
      )}
    </div>
  );
}