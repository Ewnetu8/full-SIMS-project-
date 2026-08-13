'use client';

import * as React from 'react';
import { ArrowRight, CheckCircle2, CircleAlert, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { EmptyState, ErrorState, Skeleton } from '@/components/feedback';
import { PageHeader } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ROUTES } from '@/constants';
import { useStudentStore } from '../store/student-store';

export function ResultsPage() {
  const { enrollments, isLoadingEnrollments, enrollmentsError, fetchEnrollments } =
    useStudentStore();

  React.useEffect(() => {
    void fetchEnrollments();
  }, [fetchEnrollments]);

  // Filter enrollments that have status or grade information
  const gradedEnrollments = enrollments.filter(
    (e) => e.status === 'PASSED' || e.status === 'FAILED' || Boolean(e.grade)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Student portal', href: ROUTES.STUDENT.DASHBOARD },
              { label: 'Results & status' },
            ]}
          />
        }
        title="Course Results & Academic Status"
        description="Official course results and completion statuses returned directly from SIMS enrollment records."
      />

      {isLoadingEnrollments ? (
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="p-6 space-y-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-6 w-2/3" />
            </Card>
          ))}
        </div>
      ) : enrollmentsError ? (
        <ErrorState
          title="Couldn't load results"
          description={enrollmentsError}
          onRetry={() => { void fetchEnrollments(); }}
          retryLabel="Try again"
        />
      ) : gradedEnrollments.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-10 w-10 text-muted-foreground" />}
          title="No course results published"
          description="Official grades and statuses will appear here once your enrolled courses are completed and graded."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {gradedEnrollments.map((enrollment) => {
            const offering = enrollment.course_offering_detail;
            const course = offering?.course_detail;
            const status = enrollment.status;
            const grade = enrollment.grade;

            return (
              <Card key={enrollment.id} hoverable className="border-border/80 shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-primary">
                        {course?.course_code || 'CODE'}
                      </p>
                      <CardTitle className="mt-1">{course?.title || 'Enrolled Course'}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Section {offering?.section || 'A'} · {course?.credit_hours || 0} Credit Hrs
                      </p>
                    </div>
                    <div className="text-right">
                      {grade ? (
                        <p className="text-2xl font-bold text-success">{grade}</p>
                      ) : (
                        <Badge
                          variant={
                            status === 'PASSED'
                              ? 'success'
                              : status === 'FAILED'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {status}
                        </Badge>
                      )}
                      <p className="text-xs font-medium text-muted-foreground mt-1">
                        Status: {status}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={ROUTES.STUDENT.RESULT(enrollment.id)}>
                      View result record <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ResultDetails({ resultId }: { resultId: string }) {
  const router = useRouter();
  const { enrollments, fetchEnrollments } = useStudentStore();

  React.useEffect(() => {
    if (enrollments.length === 0) {
      void fetchEnrollments();
    }
  }, [enrollments.length, fetchEnrollments]);

  const enrollment = enrollments.find((e) => e.id === resultId);

  if (!enrollment) {
    return (
      <EmptyState
        icon={<CircleAlert className="h-10 w-10 text-muted-foreground" />}
        title="Result record not found"
        description="This course result record may not exist or is not available."
        action={{ label: 'Back to results', onClick: () => router.push(ROUTES.STUDENT.RESULTS) }}
      />
    );
  }

  const offering = enrollment.course_offering_detail;
  const course = offering?.course_detail;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Student portal', href: ROUTES.STUDENT.DASHBOARD },
              { label: 'Results & status', href: ROUTES.STUDENT.RESULTS },
              { label: course?.title || 'Result Details' },
            ]}
          />
        }
        title={course?.title || 'Result Details'}
        description={`${course?.course_code || 'CODE'} · ${course?.credit_hours || 0} Credit Hours`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Course Grade & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-5xl font-bold text-success">{enrollment.grade || 'N/A'}</p>
            <p className="text-base font-semibold text-foreground">
              Official Status: {enrollment.status}
            </p>
            {enrollment.is_retake && (
              <Badge variant="warning">Retake Course</Badge>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">Course Title:</span>
              <span className="font-medium">{course?.title || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">Course Code:</span>
              <span className="font-medium">{course?.course_code || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">Credit Hours:</span>
              <span className="font-medium">{course?.credit_hours || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Section:</span>
              <span className="font-medium">Section {offering?.section || 'A'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}