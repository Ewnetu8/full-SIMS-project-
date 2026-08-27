'use client';

import * as React from 'react';
import { BookOpen, Calendar, Award, Hash, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback';
import { ROUTES } from '@/constants';
import { useStudentStore } from '../store/student-store';

export function CoursesPage() {
  const { enrollments, isLoadingEnrollments, enrollmentsError, fetchEnrollments } =
    useStudentStore();

  React.useEffect(() => {
    void fetchEnrollments();
  }, [fetchEnrollments]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Student portal', href: ROUTES.STUDENT.DASHBOARD },
              { label: 'My courses' },
            ]}
          />
        }
        title="My Enrolled Courses"
        description="View your enrolled courses, credit hours, offering sections, and academic status."
      />

      {isLoadingEnrollments ? (
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 space-y-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : enrollmentsError ? (
        <ErrorState
          title="Couldn't load courses"
          description={enrollmentsError}
          onRetry={() => { void fetchEnrollments(); }}
          retryLabel="Try again"
        />
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-10 w-10 text-muted-foreground" />}
          title="No courses found"
          description="You are not currently enrolled in any courses for the active term."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {enrollments.map((enrollment) => {
            const offering = enrollment.course_offering_detail;
            const course = offering?.course_detail;
            const semester = offering?.semester_detail;
            const status = enrollment.status || 'ENROLLED';

            const statusVariant =
              status === 'PASSED'
                ? 'success'
                : status === 'FAILED'
                ? 'destructive'
                : status === 'DROPPED'
                ? 'secondary'
                : 'default';

            return (
              <Card key={enrollment.id} hoverable className="border-border/80 shadow-sm flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded">
                        {course?.course_code || 'COURSE'}
                      </span>
                      <CardTitle className="mt-2">{course?.title || 'Enrolled Course'}</CardTitle>
                    </div>
                    <Badge variant={statusVariant}>{status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        Credit Hours
                      </dt>
                      <dd className="mt-1 font-mono text-xs font-semibold text-foreground">
                        {course?.credit_hours ?? 'N/A'} hrs
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Hash className="h-3.5 w-3.5 text-primary" />
                        Section
                      </dt>
                      <dd className="mt-1 font-mono text-xs font-semibold text-foreground">
                        Section {offering?.section || 'A'}
                      </dd>
                    </div>
                    {semester && (
                      <div className="col-span-2">
                        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          Semester / Academic Term
                        </dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {semester.semester_index} Semester ({semester.academic_year_detail?.display_label || 'Current Year'})
                        </dd>
                      </div>
                    )}
                    {enrollment.grade && (
                      <div className="col-span-2 pt-2 border-t border-border/60 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Final Grade</span>
                        <span className="text-sm font-mono font-bold text-success">{enrollment.grade}</span>
                      </div>
                    )}
                  </dl>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-end">
                    <Button asChild variant="outline" size="sm">
                      <Link href={ROUTES.STUDENT.COURSE(enrollment.id)}>
                        View details <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
