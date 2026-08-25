'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Plus,
  Users,
  Award,
  GraduationCap,
  Layers,
  Clock,
  FileCheck,
  AlertCircle,
  Hash,
  Eye,
  Edit,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { EmptyState, ErrorState, Skeleton, SkeletonCard, SkeletonTable } from '@/components/feedback';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { ROUTES } from '@/constants';

import { lecturerService } from '../services';

import type { CourseOffering, Enrollment } from '@/types/lecturer';
import type { Course, LecturerExam } from '../types';

interface CourseDetailProps {
  courseId: string;
}

export function CourseDetail({ courseId }: CourseDetailProps) {
  const [course, setCourse] = React.useState<Course | null>(null);
  const [offering, setOffering] = React.useState<CourseOffering | null>(null);
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([]);
  const [exams, setExams] = React.useState<LecturerExam[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusCode, setStatusCode] = React.useState<number | null>(null);

  const fetchCourseData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setStatusCode(null);
    try {
      const details = await lecturerService.getCourseOfferingWithDetails(courseId);
      setOffering(details.offering);
      setCourse(details.course);
      setEnrollments(details.enrollments);
      setExams(details.exams);
    } catch (err: any) {
      console.error(`Failed to load course detail for ${courseId}:`, err);
      const status = err?.response?.status;
      setStatusCode(status ?? null);
      if (status === 401) {
        setError('Unauthorized. Please sign in to view this course offering.');
      } else if (status === 403) {
        setError('You do not have permission to view this course.');
      } else if (status === 404) {
        setError('Course offering not found.');
      } else {
        setError(err?.message || 'Failed to load course details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  React.useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="min-h-[90px]" />
          ))}
        </div>
        <SkeletonTable rows={4} cols={4} />
      </div>
    );
  }

  if (error || !course || !offering) {
    const is404 = statusCode === 404 || (!course && !error);
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          <Link href={ROUTES.LECTURER.COURSES}>All Courses</Link>
        </Button>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-8">
            <ErrorState
              title={is404 ? 'Course offering not found' : 'Unable to view course'}
              description={error || (is404 ? 'Course offering not found.' : 'You do not have permission to view this course.')}
              onRetry={fetchCourseData}
              retryLabel="Retry loading course"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeOrPublished = exams.filter(
    (e) => e.status === 'PUBLISHED' || e.status === 'ACTIVE' || e.status === 'SCHEDULED'
  ).length;
  const draft = exams.filter((e) => e.status === 'DRAFT').length;
  const closed = exams.filter((e) => e.status === 'CLOSED').length;
  const activeEnrolledCount = enrollments.filter((e) => e.status === 'ENROLLED').length;

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <Button asChild variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
        <Link href={ROUTES.LECTURER.COURSES}>All Courses</Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
              {offering.course_detail?.course_code || course.code}
            </span>
            <Badge variant="secondary" className="font-mono text-xs">
              Section {offering.section || 'A'}
            </Badge>
            {typeof offering.course_detail?.credit_hours === 'number' && (
              <Badge variant="outline" className="text-xs">
                {offering.course_detail.credit_hours} Credit Hours
              </Badge>
            )}
            {offering.course_detail?.intended_class_standing && (
              <Badge variant="outline" className="text-xs">
                {offering.course_detail.intended_class_standing}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {offering.course_detail?.title || course.name}
          </h1>
          {offering.course_detail?.program_detail?.name && (
            <p className="text-xs font-medium text-muted-foreground">
              Program: {offering.course_detail.program_detail.name}
            </p>
          )}
          <p className="text-sm text-muted-foreground max-w-3xl">
            {course.description || 'Assigned academic course offering and student examination cohort.'}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button asChild leftIcon={<Plus className="h-4 w-4" />}>
            <Link href={ROUTES.LECTURER.EXAM_CREATE}>New Exam</Link>
          </Button>
        </div>
      </div>

      {/* Stats summary row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Enrolled Cohort',
            value: `${activeEnrolledCount}${typeof offering.capacity === 'number' ? ` / ${offering.capacity}` : ''}`,
            icon: Users,
          },
          {
            label: 'Total Exams',
            value: exams.length,
            icon: ClipboardCheck,
          },
          {
            label: 'Academic Year',
            value: offering.semester_detail?.academic_year_detail?.display_label || course.academicYear,
            icon: Calendar,
          },
          {
            label: 'Semester Term',
            value: `${offering.semester_detail?.semester_index || course.semester} Term`,
            icon: BookOpen,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold text-foreground text-sm">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for Examinations, Enrolled Students, and Course Metadata */}
      <Tabs defaultValue="examinations" className="space-y-6">
        <TabsList variant="line">
          <TabsTrigger value="examinations" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Examinations ({exams.length})
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" />
            Enrolled Students ({enrollments.length})
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Course Specifications
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: EXAMINATIONS ────────────────────────────────────────── */}
        <TabsContent value="examinations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Examinations in this Course Offering
            </h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="text-success font-medium">{activeOrPublished} Published/Active</span>
              <span className="text-warning font-medium">{draft} Draft</span>
              <span>{closed} Closed</span>
            </div>
          </div>

          {exams.length === 0 ? (
            <Card className="border-dashed border-border/80">
              <CardContent className="p-12 text-center">
                <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="font-medium text-muted-foreground">No examinations yet for this course offering.</p>
                <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm mx-auto">
                  Create assessment items, auto-gradable questions, and schedule examination windows for enrolled students.
                </p>
                <Button asChild className="mt-4" leftIcon={<Plus className="h-4 w-4" />}>
                  <Link href={ROUTES.LECTURER.EXAM_CREATE}>Create First Exam</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card hoverable className="overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                exam.status === 'PUBLISHED' || exam.status === 'ACTIVE'
                                  ? 'success'
                                  : exam.status === 'DRAFT'
                                  ? 'warning'
                                  : 'secondary'
                              }
                            >
                              {exam.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {exam.durationMinutes} mins · {exam.totalMarks} marks
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground text-base">{exam.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {exam.questions.length} questions · Passing score: {exam.passingScore} marks
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0 flex-wrap">
                          <Button asChild variant="outline" size="sm" leftIcon={<Eye className="h-3.5 w-3.5" />}>
                            <Link href={ROUTES.LECTURER.EXAM_PREVIEW(exam.id)}>Preview</Link>
                          </Button>
                          <Button asChild variant="outline" size="sm" leftIcon={<Edit className="h-3.5 w-3.5" />}>
                            <Link href={ROUTES.LECTURER.EXAM_EDIT(exam.id)}>Edit</Link>
                          </Button>
                          <Button asChild size="sm" leftIcon={<FileCheck className="h-3.5 w-3.5" />}>
                            <Link href={ROUTES.LECTURER.EXAM_SUBMISSIONS(exam.id)}>Submissions</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 2: ENROLLED STUDENTS ───────────────────────────────────── */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Enrolled Students Cohort</h2>
              <p className="text-xs text-muted-foreground">
                Official students enrolled in this course offering section ({offering.section || 'A'}).
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {enrollments.length} Total Enrolled
            </Badge>
          </div>

          {enrollments.length === 0 ? (
            <Card className="border-dashed border-border/80">
              <CardContent className="p-12 text-center">
                <Users className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="font-medium text-muted-foreground">No students enrolled yet</p>
                <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm mx-auto">
                  Student registrations for this semester section will automatically populate here from the academic registry.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Student UUID / Reference</th>
                      <th className="px-4 py-3">Enrollment Status</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Final Grade</th>
                      <th className="px-4 py-3">Enrolled At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {enrollments.map((enr) => (
                      <tr key={enr.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-foreground font-medium">
                          {enr.student}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              enr.status === 'ENROLLED' || enr.status === 'PASSED'
                                ? 'success'
                                : enr.status === 'FAILED'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs uppercase"
                          >
                            {enr.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {enr.is_retake ? (
                            <Badge variant="warning" className="text-2xs">
                              Retake
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Regular</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono font-semibold text-foreground">
                          {enr.grade ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {enr.created_at ? new Date(enr.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 3: COURSE SPECIFICATIONS ───────────────────────────────── */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader className="p-6 pb-4 border-b border-border/60">
              <CardTitle className="text-base font-semibold">Academic Course Specifications</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Course Code</span>
                <p className="font-semibold font-mono text-primary">
                  {offering.course_detail?.course_code || '—'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Course Title</span>
                <p className="font-semibold text-foreground">
                  {offering.course_detail?.title || '—'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Credit Hours</span>
                <p className="font-semibold text-foreground">
                  {offering.course_detail?.credit_hours ?? '—'} Hours
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Intended Class Standing</span>
                <p className="font-semibold text-foreground">
                  {offering.course_detail?.intended_class_standing || '—'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Section</span>
                <p className="font-semibold text-foreground">
                  Section {offering.section || 'A'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Class Capacity</span>
                <p className="font-semibold text-foreground">
                  {offering.capacity ?? 'Unlimited'} Students
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Academic Year</span>
                <p className="font-semibold text-foreground">
                  {offering.semester_detail?.academic_year_detail?.display_label || '—'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Semester Term</span>
                <p className="font-semibold text-foreground">
                  {offering.semester_detail?.semester_index || '—'} Semester
                </p>
              </div>

              {offering.course_detail?.program_detail && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Degree Program</span>
                  <p className="font-semibold text-foreground">
                    {offering.course_detail.program_detail.name} ({offering.course_detail.program_detail.degree_level})
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
