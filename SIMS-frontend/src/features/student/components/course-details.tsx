'use client';

import * as React from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Hash,
  School,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { EmptyState, ErrorState, Skeleton } from '@/components/feedback';
import { PageHeader } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ROUTES } from '@/constants';

import { studentService } from '../services';
import { useStudentStore } from '../store/student-store';
import type { Course, CourseOffering, Enrollment, Examination } from '../types';

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

interface CourseDetailsProps {
  courseId: string;
}

export function CourseDetails({ courseId }: CourseDetailsProps) {
  const router = useRouter();
  const [enrollment, setEnrollment] = React.useState<Enrollment | null>(null);
  const [course, setCourse] = React.useState<Course | null>(null);
  const [offering, setOffering] = React.useState<CourseOffering | null>(null);
  const [courseExams, setCourseExams] = React.useState<Examination[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const { activeExams, fetchActiveExams } = useStudentStore();

  const loadCourseData = React.useCallback(async () => {
    if (!courseId) {
      setError('Invalid course identifier.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let resolvedEnrollment: Enrollment | null = null;
      let resolvedCourse: Course | null = null;
      let resolvedOffering: CourseOffering | null = null;

      // 1. First attempt: Try fetching as direct Enrollment ID
      try {
        const directEnrollment = await studentService.getEnrollmentById(courseId);
        if (directEnrollment && directEnrollment.id) {
          resolvedEnrollment = directEnrollment;
        }
      } catch {
        // Not a direct enrollment ID or not found by ID; will check student enrollments list
      }

      // 2. Second attempt: Check student's enrollments list
      if (!resolvedEnrollment) {
        try {
          const allEnrollments = await studentService.getEnrollments();
          const match = allEnrollments.find(
            (e) =>
              e.id === courseId ||
              e.course_offering === courseId ||
              e.course_offering_detail?.id === courseId ||
              e.course_offering_detail?.course === courseId ||
              e.course_offering_detail?.course_detail?.id === courseId
          );
          if (match) {
            resolvedEnrollment = match;
          }
        } catch {
          // Ignore list fetch error and proceed to standalone course check
        }
      }

      // Extract details from resolved enrollment
      if (resolvedEnrollment) {
        setEnrollment(resolvedEnrollment);
        if (resolvedEnrollment.course_offering_detail) {
          resolvedOffering = resolvedEnrollment.course_offering_detail;
          setOffering(resolvedOffering);
          if (resolvedEnrollment.course_offering_detail.course_detail) {
            resolvedCourse = resolvedEnrollment.course_offering_detail.course_detail;
            setCourse(resolvedCourse);
          }
        }
      }

      // 3. Fallback: If not enrolled but valid course ID, load standalone Course details
      if (!resolvedCourse) {
        try {
          const directCourse = await studentService.getCourseById(courseId);
          if (directCourse && directCourse.id) {
            resolvedCourse = directCourse;
            setCourse(resolvedCourse);
          }
        } catch {
          // Standalone course not found
        }
      }

      if (!resolvedEnrollment && !resolvedCourse && !resolvedOffering) {
        setError('We could not find the requested course enrollment.');
      }
    } catch (err: any) {
      console.error('Failed to load course details:', err);
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to load course details. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  React.useEffect(() => {
    void loadCourseData();
    void fetchActiveExams();
  }, [loadCourseData, fetchActiveExams]);

  // Filter exams associated with this course or course offering
  React.useEffect(() => {
    if (!activeExams || activeExams.length === 0) {
      setCourseExams([]);
      return;
    }

    const currentOfferingId = offering?.id || enrollment?.course_offering;
    const currentCourseId = course?.id || offering?.course;

    const filtered = activeExams.filter((exam) => {
      const examOfferingId = exam.course_offering || exam.course_offering_detail?.id;
      const examCourseId =
        exam.course_offering_detail?.course_detail?.id ||
        (exam.course_offering_detail as any)?.course;

      return (
        (currentOfferingId && examOfferingId === currentOfferingId) ||
        (currentCourseId && examCourseId === currentCourseId)
      );
    });

    setCourseExams(filtered);
  }, [activeExams, offering, enrollment, course]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
          <Card className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        </div>
      </div>
    );
  }

  if (error || (!enrollment && !course && !offering)) {
    return (
      <EmptyState
        icon={<BookOpen className="h-10 w-10 text-muted-foreground" />}
        title="Course Not Found"
        description={error || "We couldn't find the requested course in your records."}
        action={{
          label: 'Back to My Courses',
          onClick: () => router.push(ROUTES.STUDENT.COURSES),
        }}
      />
    );
  }

  const courseTitle = course?.title || 'Enrolled Course';
  const courseCode = course?.course_code || 'COURSE';
  const semesterDetail = offering?.semester_detail;
  const programDetail = course?.program_detail;
  const departmentDetail = programDetail?.department_detail;
  const status = enrollment?.status || 'ENROLLED';

  const statusVariant =
    status === 'PASSED'
      ? 'success'
      : status === 'FAILED'
      ? 'destructive'
      : status === 'DROPPED'
      ? 'secondary'
      : 'default';

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Student portal', href: ROUTES.STUDENT.DASHBOARD },
              { label: 'My courses', href: ROUTES.STUDENT.COURSES },
              { label: `${courseCode} · ${courseTitle}` },
            ]}
          />
        }
        title={courseTitle}
        description={`Course Code: ${courseCode} · ${course?.credit_hours ?? 3} Credit Hours`}
        actions={
          <Button asChild variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            <Link href={ROUTES.STUDENT.COURSES}>Back to My Courses</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Course Details & Academic Program */}
        <div className="space-y-6 lg:col-span-2">
          {/* Main Course Information Card */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-md">
                    {courseCode}
                  </span>
                  <CardTitle className="text-xl">{courseTitle}</CardTitle>
                </div>
                {enrollment && <Badge variant={statusVariant}>{status}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5 space-y-1">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Award className="h-3.5 w-3.5 text-primary" />
                    Credit Hours
                  </dt>
                  <dd className="font-mono text-sm font-bold text-foreground">
                    {course?.credit_hours ?? 'N/A'} hrs
                  </dd>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5 space-y-1">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    Intended Class Standing
                  </dt>
                  <dd className="text-sm font-semibold text-foreground">
                    {course?.intended_class_standing || 'Not Specified'}
                  </dd>
                </div>

                {programDetail && (
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5 space-y-1">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <School className="h-3.5 w-3.5 text-primary" />
                      Academic Program
                    </dt>
                    <dd className="text-sm font-semibold text-foreground">
                      {programDetail.name} {programDetail.code ? `(${programDetail.code})` : ''}
                    </dd>
                  </div>
                )}

                {departmentDetail && (
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5 space-y-1">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      Department
                    </dt>
                    <dd className="text-sm font-semibold text-foreground">
                      {departmentDetail.name} {departmentDetail.code ? `(${departmentDetail.code})` : ''}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Associated Active / Scheduled Examinations */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  Course Examinations
                </CardTitle>
                <Badge variant="outline">{courseExams.length} Available</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {courseExams.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No examinations currently scheduled or active for this course.
                </div>
              ) : (
                <div className="space-y-3">
                  {courseExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border p-4 transition hover:border-primary/50 hover:bg-accent/30"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="font-semibold text-foreground text-sm">{exam.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Duration: {exam.duration_minutes} minutes
                        </p>
                      </div>
                      <Button asChild size="sm" variant={exam.status === 'ACTIVE' ? 'default' : 'outline'}>
                        <Link href={ROUTES.STUDENT.EXAM(exam.id)}>
                          {exam.status === 'ACTIVE' ? 'Take Exam' : 'View Details'}
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar (1 Col): Class Information & Enrollment Details */}
        <div className="space-y-6">
          {/* Class Information Card */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <School className="h-5 w-5 text-primary" />
                Class Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {offering?.section && (
                <div className="flex items-center justify-between py-2 border-b border-border/60">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-primary" /> Section
                  </span>
                  <span className="font-mono text-xs font-bold text-foreground">
                    Section {offering.section}
                  </span>
                </div>
              )}

              {semesterDetail && (
                <div className="pt-2 space-y-2">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> Semester / Academic Period
                  </span>
                  <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1.5 border border-border/60">
                    <p className="font-medium text-foreground">
                      {semesterDetail.semester_index} Semester
                    </p>
                    <p className="text-muted-foreground">
                      {semesterDetail.academic_year_detail?.display_label || 'Current Academic Year'}
                    </p>
                    {semesterDetail.academic_year_detail?.start_boundary && (
                      <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                        {formatDate(semesterDetail.academic_year_detail.start_boundary)} –{' '}
                        {formatDate(semesterDetail.academic_year_detail.end_boundary)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrollment Status Card */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Enrollment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-xs text-muted-foreground">Registration Status</span>
                <Badge variant={statusVariant}>{status}</Badge>
              </div>

              {enrollment && (
                <div className="flex items-center justify-between py-2 border-b border-border/60">
                  <span className="text-xs text-muted-foreground">Attempt Type</span>
                  <span className="text-xs font-semibold text-foreground">
                    {enrollment.is_retake ? 'Retake Course' : 'First Attempt'}
                  </span>
                </div>
              )}

              {enrollment?.grade && (
                <div className="flex items-center justify-between py-2 bg-success/10 px-3 rounded-lg border border-success/30">
                  <span className="text-xs font-semibold text-success">Official Grade</span>
                  <span className="font-mono text-sm font-extrabold text-success">
                    {enrollment.grade}
                  </span>
                </div>
              )}

              {enrollment?.created_at && (
                <div className="pt-1 text-[11px] text-muted-foreground text-center">
                  Enrolled on {formatDate(enrollment.created_at)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
