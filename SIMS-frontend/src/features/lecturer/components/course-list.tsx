'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Search,
  Users,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { EmptyState, ErrorState, SkeletonCard } from '@/components/feedback';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui';
import { ROUTES } from '@/constants';

import { lecturerService } from '../services';

import type { Course } from '../types';

export function LecturerCourseList() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchCourses = React.useCallback(() => {
    setLoading(true);
    setError(null);
    lecturerService.getCourses()
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.error('Failed to load courses:', err);
        const apiErr = err as { response?: { status?: number }; message?: string };
        const status = apiErr?.response?.status;
        if (status === 401) {
          setError('Unauthorized. Please sign in to view your assigned courses.');
        } else if (status === 403) {
          setError('You do not have permission to view your assigned courses.');
        } else if (status === 404) {
          setError('Assigned courses not found.');
        } else {
          setError(apiErr?.message || 'Failed to load assigned courses. Please check your network connection.');
        }
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    lecturerService.getCourses()
      .then((data) => {
        if (isMounted) {
          setCourses(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          console.error('Failed to load courses:', err);
          const apiErr = err as { response?: { status?: number }; message?: string };
          const status = apiErr?.response?.status;
          if (status === 401) {
            setError('Unauthorized. Please sign in to view your assigned courses.');
          } else if (status === 403) {
            setError('You do not have permission to view your assigned courses.');
          } else if (status === 404) {
            setError('Assigned courses not found.');
          } else {
            setError(apiErr?.message || 'Failed to load assigned courses. Please check your network connection.');
          }
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCourses = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.section && c.section.toLowerCase().includes(q)) ||
        (c.semester && c.semester.toLowerCase().includes(q)) ||
        (c.academicYear && c.academicYear.toLowerCase().includes(q)) ||
        (c.programName && c.programName.toLowerCase().includes(q)),
    );
  }, [courses, search]);

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Course Management</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your assigned academic courses, enrolled cohorts, and associated examinations.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by code, title, section..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
            leadingIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="min-h-[220px]" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6">
            <ErrorState
              title="Unable to load courses"
              description={error}
              onRetry={fetchCourses}
              retryLabel="Retry loading courses"
            />
          </CardContent>
        </Card>
      ) : courses.length === 0 ? (
        <Card className="border-dashed border-border/80">
          <CardContent className="p-12">
            <EmptyState
              icon={<BookOpen className="h-8 w-8 text-muted-foreground/60" />}
              title="No assigned courses"
              description="No courses are currently assigned to you."
            />
          </CardContent>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card className="border-dashed border-border/80">
          <CardContent className="p-12">
            <EmptyState
              icon={<Search className="h-8 w-8 text-muted-foreground/60" />}
              title="No courses found"
              description={`No assigned courses match "${search}". Try adjusting your search query.`}
              action={{
                label: 'Clear Search',
                onClick: () => setSearch(''),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredCourses.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card hoverable className="flex flex-col justify-between h-full">
                <CardHeader className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
                          {course.code}
                        </span>
                        {course.section && (
                          <Badge variant="secondary" className="font-mono text-xs">
                            Section {course.section}
                          </Badge>
                        )}
                        {typeof course.creditHours === 'number' && (
                          <Badge variant="outline" className="text-xs">
                            {course.creditHours} Cr. Hrs
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl pt-1 leading-snug">{course.name}</CardTitle>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                      <BookOpen className="h-5 w-5" />
                    </span>
                  </div>
                  {course.programName && (
                    <p className="text-xs text-muted-foreground/90 font-medium pt-1">
                      {course.programName}
                    </p>
                  )}
                  <CardDescription className="pt-2 line-clamp-2">
                    {course.description || 'Assigned academic course offering.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/70 bg-muted/30 p-4 text-xs">
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 text-primary" /> Term & Academic Year
                      </span>
                      <p className="font-semibold text-foreground">
                        {course.semester} Semester · {course.academicYear}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5 text-primary" /> Enrolled Students
                      </span>
                      <p className="font-semibold text-foreground">
                        {course.studentCount}
                        {typeof course.capacity === 'number' ? ` / ${course.capacity}` : ''} Students
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="text-xs font-medium text-muted-foreground">
                      {course.examCount} {course.examCount === 1 ? 'Examination' : 'Examinations'} Created
                    </span>
                    <Button asChild variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                      <Link href={ROUTES.LECTURER.COURSE(course.id)}>View Course Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
