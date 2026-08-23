'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Plus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ROUTES } from '@/constants';

import { lecturerService } from '../services';

import type { Course, LecturerExam } from '../types';

interface CourseDetailProps {
  courseId: string;
}

export function CourseDetail({ courseId }: CourseDetailProps) {
  const [course, setCourse] = React.useState<Course | null>(null);
  const [exams, setExams] = React.useState<LecturerExam[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const [courseData, allExams] = await Promise.all([
        lecturerService.getCourseById(courseId),
        lecturerService.getExams(),
      ]);
      setCourse(courseData ?? null);
      setExams(allExams.filter((e) => e.courseId === courseId));
      setLoading(false);
    }
    load();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Course not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={ROUTES.LECTURER.COURSES}>Back to Courses</Link>
        </Button>
      </div>
    );
  }

  const published = exams.filter((e) => e.status === 'PUBLISHED' || e.status === 'ACTIVE' || e.status === 'SCHEDULED').length;
  const draft = exams.filter((e) => e.status === 'DRAFT').length;
  const closed = exams.filter((e) => e.status === 'CLOSED').length;

  return (
    <div className="space-y-8">
      {/* Back nav */}
      <Button asChild variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
        <Link href={ROUTES.LECTURER.COURSES}>All Courses</Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <span className="inline-block font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
            {course.code}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{course.name}</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">{course.description}</p>
        </div>
        <Button asChild leftIcon={<Plus className="h-4 w-4" />}>
          <Link href={ROUTES.LECTURER.EXAM_CREATE}>New Exam</Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Enrolled Students', value: course.studentCount, icon: Users },
          { label: 'Total Exams', value: exams.length, icon: ClipboardCheck },
          { label: 'Academic Year', value: course.academicYear, icon: Calendar },
          { label: 'Semester', value: course.semester, icon: BookOpen },
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

      {/* Exam list for this course */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Examinations in this Course</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="text-success font-medium">{published} Published</span>
            <span className="text-warning font-medium">{draft} Draft</span>
            <span>{closed} Closed</span>
          </div>
        </div>

        {exams.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="font-medium text-muted-foreground">No examinations yet for this course.</p>
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
                              exam.status === 'PUBLISHED'
                                ? 'success'
                                : exam.status === 'DRAFT'
                                ? 'warning'
                                : 'secondary'
                            }
                          >
                            {exam.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {exam.durationMinutes} mins · {exam.totalMarks} marks
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground">{exam.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {exam.questions.length} questions · {exam.questions.reduce((sum, q) => sum + q.marks, 0)} total marks
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button asChild variant="outline" size="sm">
                          <Link href={ROUTES.LECTURER.EXAM_EDIT(exam.id)}>Edit</Link>
                        </Button>
                        <Button asChild size="sm">
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
      </div>
    </div>
  );
}
