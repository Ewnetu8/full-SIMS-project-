'use client';

import {
  BookOpen,
  GraduationCap,
  ArrowLeft,
  Building2,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';

import { Badge, Button, Card } from '@/components/ui';
import { ROUTES } from '@/constants';
import { getUserFriendlyErrorMessage } from '@/lib/errors';

import { adminService } from '../services/admin-service';
import { useAdminStore } from '../store';

import type { Department } from '../types';

interface DepartmentDetailProps {
  departmentId?: string;
}

export function DepartmentDetail({ departmentId }: DepartmentDetailProps = {}) {
  const params = useParams();
  const router = useRouter();
  const rawId = departmentId || params?.id;
  const deptId = Array.isArray(rawId) ? rawId[0] : (rawId as string | undefined);

  const { colleges, programs, courses, fetchColleges, fetchPrograms, fetchCourses } = useAdminStore();

  const [department, setDepartment] = React.useState<Department | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusCode, setStatusCode] = React.useState<number | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    let isSubscribed = true;

    async function fetchDepartmentData() {
      if (!deptId) {
        await Promise.resolve();
        if (isSubscribed) {
          setError('Department ID is missing in route.');
          setStatusCode(400);
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await adminService.getDepartmentById(deptId);
        if (isSubscribed) {
          setDepartment(data);
          setError(null);
          setStatusCode(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          const errObj = err as { statusCode?: number; response?: { status?: number }; status?: number };
          const status = errObj?.statusCode || errObj?.response?.status || errObj?.status || 500;
          setStatusCode(status);
          setError(getUserFriendlyErrorMessage(err));
          setIsLoading(false);
        }
      }
    }

    void fetchDepartmentData();
    void fetchColleges();
    void fetchPrograms();
    void fetchCourses();

    return () => {
      isSubscribed = false;
    };
  }, [deptId, retryCount, fetchColleges, fetchPrograms, fetchCourses]);

  const parentCollege = department
    ? department.college_detail || colleges.find((c) => c.id === department.college || c.code === department.college)
    : null;

  const deptPrograms = programs
    ? programs.filter((p) => p.department === department?.id || p.department === department?.name)
    : [];

  const deptCourses = courses
    ? courses.filter((c) => c.department === department?.name || c.department === department?.code)
    : [];

  // ─── Loading State ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card className="p-12 text-center flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground">Loading department details from backend...</p>
      </Card>
    );
  }

  // ─── Error / Not Found / Forbidden States ────────────────────────────────────
  if (error || !department) {
    const isNotFound = statusCode === 404;
    const isForbidden = statusCode === 403 || statusCode === 401;

    return (
      <Card className="p-8 border-destructive/30 bg-destructive/5 text-center flex flex-col items-center justify-center gap-4 max-w-lg mx-auto my-8">
        <div className="p-3 rounded-full bg-destructive/10 text-destructive">
          {isForbidden ? (
            <ShieldAlert className="h-8 w-8" />
          ) : isNotFound ? (
            <Building2 className="h-8 w-8" />
          ) : (
            <AlertCircle className="h-8 w-8" />
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground">
            {isNotFound
              ? 'Department Not Found'
              : isForbidden
              ? 'Access Denied'
              : 'Failed to Load Department Details'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1.5">
            {isNotFound
              ? `The requested department record (ID: ${deptId || 'unknown'}) does not exist or may have been deleted.`
              : error || 'An unexpected error occurred while retrieving the department.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mt-2">
          {!isNotFound && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => {
                setIsLoading(true);
                setRetryCount((c) => c + 1);
              }}
            >
              Try Again
            </Button>
          )}
          <Button
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => router.push(ROUTES.ADMIN.DEPARTMENTS)}
          >
            Back to Departments
          </Button>
        </div>
      </Card>
    );
  }

  // ─── Success View ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Back Button */}
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
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold font-mono text-xl">
              {department.code}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{department.name}</h1>
              {parentCollege && (
                <p className="text-sm text-primary font-medium mt-0.5">
                  {parentCollege.name} ({parentCollege.code})
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                Created {department.createdAt ? new Date(department.createdAt).toLocaleDateString() : 'Recently'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="self-start sm:self-auto border-primary/30 text-primary bg-primary/10">
            Academic Department
          </Badge>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Academic Programs</p>
              <p className="text-xs font-bold text-foreground">{deptPrograms.length} Programs Registered</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-success" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Curriculum Courses</p>
              <p className="text-xs font-bold text-foreground">{deptCourses.length} Courses Offered</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Programs & Courses Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Associated Programs */}
        <Card className="p-5">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <GraduationCap className="h-4 w-4 text-primary" /> Academic Programs ({deptPrograms.length})
          </h2>
          <div className="mt-4 space-y-3">
            {deptPrograms.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No programs registered under this department.</p>
            ) : (
              deptPrograms.map((prog) => (
                <div key={prog.id} className="p-3 rounded-lg border border-border flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{prog.code}</span>
                      <span className="text-xs font-semibold text-foreground">{prog.name}</span>
                    </div>
                    {prog.degreeLevel && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                        Level: {prog.degreeLevel}
                      </p>
                    )}
                  </div>
                  {prog.totalCreditHoursRequired ? (
                    <Badge variant="outline" className="text-[10px]">
                      {prog.totalCreditHoursRequired} Cr.
                    </Badge>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Associated Courses */}
        <Card className="p-5">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <BookOpen className="h-4 w-4 text-success" /> Department Courses ({deptCourses.length})
          </h2>
          <div className="mt-4 space-y-3">
            {deptCourses.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No courses registered under this department.</p>
            ) : (
              deptCourses.map((crs) => (
                <div key={crs.id} className="p-3 rounded-lg border border-border flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-success">{crs.code}</span>
                      <span className="text-xs font-semibold text-foreground">{crs.name}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {crs.creditHours} Credit Hours
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
      </div>
    </div>
  );
}
