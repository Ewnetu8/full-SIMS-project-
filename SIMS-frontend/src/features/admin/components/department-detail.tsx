'use client';

import {
  Building2,
  UserCheck,
  BookOpen,
  GraduationCap,
  ArrowLeft,
  Mail,
  Calendar,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';

import { Badge, Button, Card } from '@/components/ui';
import { ROUTES } from '@/constants';
import { useAdminStore } from '../store';

export function DepartmentDetail() {
  const params = useParams();
  const router = useRouter();
  const { departments, courses, lecturers, students } = useAdminStore();

  const deptId = params?.id as string;
  const dept = departments.find((d) => d.id === deptId) || departments[0];

  const deptCourses = courses.filter((c) => c.department === dept?.name);
  const deptLecturers = lecturers.filter((l) => l.department === dept?.name);
  const deptStudents = students.filter((s) => s.department === dept?.name);

  if (!dept) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Department record not found.</p>
        <Button className="mt-4" onClick={() => router.push(ROUTES.ADMIN.DEPARTMENTS)}>
          Back to Departments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => router.push(ROUTES.ADMIN.DEPARTMENTS)}
        >
          Back to Departments
        </Button>
      </div>

      {/* Department Header Card */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 font-bold font-mono text-xl">
              {dept.code}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{dept.name}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Established {dept.createdAt}</p>
            </div>
          </div>
          <Badge variant="outline" className="self-start sm:self-auto border-purple-500/30 text-purple-400 bg-purple-500/10">
            Active Department
          </Badge>
        </div>

        <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">
          {dept.description}
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Head of Department</p>
              <p className="text-xs font-bold text-foreground">{dept.headOfDepartment.name}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Curriculum Courses</p>
              <p className="text-xs font-bold text-foreground">{deptCourses.length} Courses Offered</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Student Enrollment</p>
              <p className="text-xs font-bold text-foreground">{dept.studentCount} Enrolled</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Courses & Faculty Tabs Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Associated Courses */}
        <Card className="p-5">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <BookOpen className="h-4 w-4 text-emerald-500" /> Department Courses ({deptCourses.length})
          </h2>
          <div className="mt-4 space-y-3">
            {deptCourses.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No courses registered under this department.</p>
            ) : (
              deptCourses.map((crs) => (
                <div key={crs.id} className="p-3 rounded-lg border border-border flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-500">{crs.code}</span>
                      <span className="text-xs font-semibold text-foreground">{crs.name}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Lecturer: {crs.assignedLecturer.name} • {crs.creditHours} Credits
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {crs.studentCount} Students
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Assigned Lecturers */}
        <Card className="p-5">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <UserCheck className="h-4 w-4 text-indigo-500" /> Department Faculty Members ({deptLecturers.length})
          </h2>
          <div className="mt-4 space-y-3">
            {deptLecturers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No faculty members currently linked.</p>
            ) : (
              deptLecturers.map((lec) => (
                <div key={lec.id} className="p-3 rounded-lg border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-xs">
                      {lec.firstName[0]}
                      {lec.lastName[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Dr. {lec.firstName} {lec.lastName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{lec.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {lec.office}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
