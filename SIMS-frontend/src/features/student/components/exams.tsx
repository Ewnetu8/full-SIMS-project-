'use client';

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

import { EmptyState } from '@/components/feedback';
import { PageHeader } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ROUTES } from '@/constants';
import { examinationService } from '@/features/examination/services';
import { studentService } from '../services';
import type { StudentExam } from '../types';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

export function ExamsPage({ completed = false }: { completed?: boolean }) {
  const exams = studentService
    .getExams()
    .filter((exam) => (completed ? exam.status === 'completed' : exam.status !== 'completed'));
  const title = completed ? 'Completed exams' : 'Available exams';
  const description = completed
    ? 'Review examinations you have already submitted.'
    : 'Review exam requirements before starting an assessment.';

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
      {exams.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="No examinations here"
          description="Your completed and available exams will appear here when they are ready."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} completed={completed} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExamCard({ exam, completed }: { exam: StudentExam; completed: boolean }) {
  const isAvailable = exam.status === 'available';

  return (
    <Card hoverable className="border-border/80 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{exam.courseCode}</p>
            <CardTitle className="mt-1">{exam.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {exam.course} · {exam.lecturer}
            </p>
          </div>
          <Badge variant={isAvailable ? 'success' : completed ? 'secondary' : 'warning'}>
            {isAvailable ? 'Available' : completed ? 'Completed' : 'Upcoming'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Detail icon={<Clock3 />} label="Duration" value={exam.duration} />
          <Detail icon={<FileText />} label="Total marks" value={`${exam.totalMarks} marks`} />
          <Detail
            icon={<CalendarDays />}
            label={completed ? 'Completed' : 'Opens'}
            value={formatDate(exam.startAt)}
            className="col-span-2"
          />
        </dl>
        <div className="mt-5 flex justify-end">
          {completed ? (
            <Button asChild variant="outline" size="sm">
              <Link href={ROUTES.STUDENT.RESULTS}>View result</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href={ROUTES.STUDENT.EXAM(exam.id)}>
                {isAvailable ? 'Start exam' : 'View details'} <Play className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          )}
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
  const exam = studentService.getExam(examId);
  const session = examinationService.getSession(examId);

  if (!exam) {
    return (
      <EmptyState
        icon={<AlertCircle />}
        title="Exam not found"
        description="This exam may no longer be available."
        action={{ label: 'Back to exams', onClick: () => router.push(ROUTES.STUDENT.EXAMS) }}
      />
    );
  }

  const canBegin = exam.status === 'available';
  const academicNotice =
    session?.academicIntegrityNotice ??
    'By starting this examination, you affirm on your honor that all submitted work is purely your own, executed without unauthorized collaboration, external assistance, or prohibited references.';

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
        description={`${exam.courseCode} · ${exam.course} (Lecturer: ${exam.lecturer})`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              <Link href={ROUTES.STUDENT.EXAMS}>Back to Available Exams</Link>
            </Button>
            <Button asChild disabled={!canBegin} leftIcon={<Play className="h-4 w-4" />}>
              <Link href={ROUTES.STUDENT.EXAM_TAKE(exam.id)}>Start Exam</Link>
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
                {exam.instructions.map((instruction) => (
                  <li key={instruction} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>

              <h2 className="pt-3 text-base font-semibold text-foreground border-t border-border/60">
                Examination Rules & Regulations
              </h2>
              <ul className="space-y-3">
                {exam.rules.map((rule) => (
                  <li key={rule} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{rule}</span>
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
                <p className="text-xs leading-relaxed text-muted-foreground">{academicNotice}</p>
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
              <Detail icon={<HelpCircle />} label="Questions" value={`${exam.questions} items`} />
              <Detail icon={<Clock3 />} label="Duration" value={exam.duration} />
              <Detail icon={<FileText />} label="Total Marks" value={`${exam.totalMarks} marks`} />
              <Detail icon={<CheckCircle2 />} label="Passing Score" value={`${exam.passingScore}%`} />
              <Detail icon={<RotateCcw />} label="Allowed Attempts" value="1 attempt allowed" />
              <Detail icon={<CalendarDays />} label="Window Opens" value={formatDate(exam.startAt)} />
            </dl>

            <div className="mt-6 pt-4 border-t border-border/60">
              <Button asChild disabled={!canBegin} className="w-full" size="lg" rightIcon={<Play className="h-4 w-4" />}>
                <Link href={ROUTES.STUDENT.EXAM_TAKE(exam.id)}>Start Exam Now</Link>
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