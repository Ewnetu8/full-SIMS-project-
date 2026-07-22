'use client';

import { BookOpen, Calendar, GraduationCap, Search, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui';
import { ROUTES } from '@/constants';
import { lecturerService } from '../services';
import type { Course } from '../types';

export function LecturerCourseList() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    lecturerService.getCourses().then((data) => {
      setCourses(data);
      setLoading(false);
    });
  }, []);

  const filteredCourses = courses.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Course Management</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your assigned academic courses, enrolled cohorts, and associated examinations.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leadingIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredCourses.map((course) => (
          <Card key={course.id} hoverable className="flex flex-col justify-between">
            <CardHeader className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="inline-block font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
                    {course.code}
                  </span>
                  <CardTitle className="text-xl pt-1">{course.name}</CardTitle>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <BookOpen className="h-5 w-5" />
                </span>
              </div>
              <CardDescription className="pt-2 line-clamp-2">{course.description}</CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/70 bg-muted/30 p-4 text-xs">
                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> Term & Academic Year
                  </span>
                  <p className="font-semibold text-foreground">{course.semester} · {course.academicYear}</p>
                </div>
                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5 text-primary" /> Enrolled Students
                  </span>
                  <p className="font-semibold text-foreground">{course.studentCount} Students</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-xs font-medium text-muted-foreground">
                  {course.examCount} Examinations Created
                </span>
                <Button asChild variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  <Link href={ROUTES.LECTURER.COURSE(course.id)}>View Course Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
