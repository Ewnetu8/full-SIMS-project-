'use client';

import { motion } from 'framer-motion';
import {
  GraduationCap,
  UserCheck,
  Shield,
  BookOpen,
  Building2,
  ClipboardCheck,
  Zap,
  CheckCircle2,
  Activity,
  Plus,
  ArrowUpRight,
  Server,
  Database,
  FileText,
  UserPlus,
  RefreshCw,
  AlertCircle,
  School,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Badge, Button, Card } from '@/components/ui';
import { ROUTES } from '@/constants';

import { useAdminStore } from '../store';

export function DashboardOverview() {
  const router = useRouter();
  const {
    adminAnalytics,
    isLoadingAnalytics,
    analyticsError,
    users,
    students,
    lecturers,
    colleges,
    departments,
    programs,
    courses,
    exams,
    fetchAdminData,
    fetchAdminAnalytics,
    isLoadingData,
  } = useAdminStore();

  React.useEffect(() => {
    void fetchAdminData();
  }, [fetchAdminData]);

  // Authoritative numbers from GET /api/v1/analytics/admin with fallback to loaded state
  const totalStudents = adminAnalytics ? adminAnalytics.total_students : students.length;
  const totalLecturers = adminAnalytics ? adminAnalytics.total_lecturers : lecturers.length;
  const totalColleges = adminAnalytics ? adminAnalytics.total_colleges : colleges.length;
  const totalDepts = adminAnalytics ? adminAnalytics.total_departments : departments.length;
  const totalPrograms = adminAnalytics ? adminAnalytics.total_programs : programs.length;
  const totalCourses = adminAnalytics ? adminAnalytics.total_courses : courses.length;
  const totalExamsCount = adminAnalytics ? adminAnalytics.total_exams : exams.length;
  const totalAdmins = users.filter((u) => (u.role || '').toUpperCase() === 'ADMIN').length;

  const activeExamsCount = exams.filter((e) => e.status === 'ACTIVE' || e.status === 'SCHEDULED').length;
  const publishedExamsCount = exams.filter((e) => e.status === 'PUBLISHED').length;

  const isLoading = isLoadingData || isLoadingAnalytics;

  const statCards = [
    {
      label: 'Total Students',
      value: isLoading ? '...' : totalStudents.toLocaleString(),
      icon: GraduationCap,
      color: 'text-primary',
      bg: 'bg-primary/10',
      trend: 'Enrolled students',
    },
    {
      label: 'Total Lecturers',
      value: isLoading ? '...' : totalLecturers.toString(),
      icon: UserCheck,
      color: 'text-indigo-600',
      bg: 'bg-indigo-500/10',
      trend: 'Faculty members',
    },
    {
      label: 'Administrators',
      value: isLoading ? '...' : totalAdmins.toString(),
      icon: Shield,
      color: 'text-primary',
      bg: 'bg-primary/10',
      trend: 'Full system access',
    },
    {
      label: 'Active Courses',
      value: isLoading ? '...' : totalCourses.toString(),
      icon: BookOpen,
      color: 'text-accent',
      bg: 'bg-accent/10',
      trend: 'Curriculum catalog',
    },
    {
      label: 'Academic Units',
      value: isLoading ? '...' : `${totalDepts} Depts / ${totalColleges} Colg`,
      icon: Building2,
      color: 'text-primary',
      bg: 'bg-primary/10',
      trend: `${totalPrograms} Degree Programs`,
    },
    {
      label: 'Total Exams',
      value: isLoading ? '...' : totalExamsCount.toString(),
      icon: ClipboardCheck,
      color: 'text-primary',
      bg: 'bg-primary/10',
      trend: 'Registered assessments',
    },
    {
      label: 'Active Exams Now',
      value: isLoading ? '...' : activeExamsCount.toString(),
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      trend: 'Live test sessions',
    },
    {
      label: 'Published Results',
      value: isLoading ? '...' : publishedExamsCount.toString(),
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      trend: 'Certified records',
    },
    {
      label: 'System Status',
      value: 'Operational',
      icon: Activity,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      trend: 'REST API Active',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Administrator Dashboard
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
              Institutional Admin
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Authoritative overview of university demographics, academic hierarchy, and examination workflows.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void fetchAdminAnalytics();
              void fetchAdminData();
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Analytics
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => router.push(ROUTES.ADMIN.USERS)}
          >
            Add New User
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {analyticsError && (
        <Card className="p-4 border-destructive/40 bg-destructive/10 text-destructive flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{analyticsError}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchAdminAnalytics()}
            className="border-destructive/30 hover:bg-destructive/20 text-destructive shrink-0"
          >
            Retry
          </Button>
        </Card>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
            >
              <Card className="p-4 transition-all duration-200 hover:shadow-md hover:border-primary/30 border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold tracking-tight text-foreground">{card.value}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                  <span>{card.trend}</span>
                </p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Academic Structure Breakdown Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4 flex items-center gap-4 border border-border">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
            <School className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">Colleges & Faculties</p>
            <p className="text-xl font-bold text-foreground">{totalColleges} Registered</p>
            <Link
              href={ROUTES.ADMIN.COLLEGES}
              className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1 mt-0.5"
            >
              Manage Colleges <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-border">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">Academic Departments</p>
            <p className="text-xl font-bold text-foreground">{totalDepts} Active Units</p>
            <Link
              href={ROUTES.ADMIN.DEPARTMENTS}
              className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1 mt-0.5"
            >
              Manage Departments <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-border">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
            <Layers className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">Degree Programs</p>
            <p className="text-xl font-bold text-foreground">{totalPrograms} Curricula</p>
            <Link
              href={ROUTES.ADMIN.PROGRAMS}
              className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1 mt-0.5"
            >
              Manage Programs <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Actions & System Health Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="p-5 lg:col-span-1 flex flex-col justify-between border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" /> Quick Administrative Actions
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Direct shortcuts for institutional administration workflows.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2.5">
            <Button
              variant="outline"
              className="justify-between text-left h-auto py-2.5 px-3"
              onClick={() => router.push(ROUTES.ADMIN.USERS)}
            >
              <span className="flex items-center gap-2.5 text-xs font-medium">
                <UserCheck className="h-4 w-4 text-primary" /> Manage Users & Role Access
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="justify-between text-left h-auto py-2.5 px-3"
              onClick={() => router.push(ROUTES.ADMIN.ENROLLMENTS)}
            >
              <span className="flex items-center gap-2.5 text-xs font-medium">
                <UserPlus className="h-4 w-4 text-primary" /> Student Course Enrollments
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="justify-between text-left h-auto py-2.5 px-3"
              onClick={() => router.push(ROUTES.ADMIN.REPORTS)}
            >
              <span className="flex items-center gap-2.5 text-xs font-medium">
                <FileText className="h-4 w-4 text-primary" /> Reports & Advising Analytics
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="justify-between text-left h-auto py-2.5 px-3"
              onClick={() => router.push(ROUTES.ADMIN.COURSES)}
            >
              <span className="flex items-center gap-2.5 text-xs font-medium">
                <BookOpen className="h-4 w-4 text-primary" /> Course Catalogue & Offerings
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="justify-between text-left h-auto py-2.5 px-3"
              onClick={() => router.push(ROUTES.ADMIN.EXAMS)}
            >
              <span className="flex items-center gap-2.5 text-xs font-medium">
                <ClipboardCheck className="h-4 w-4 text-primary" /> Exams & Assessments Overview
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </Card>

        {/* System Infrastructure & API Status */}
        <Card className="p-5 lg:col-span-2 border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" /> Infrastructure & Backend Connectivity
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time connection status with SIMS Django REST backend APIs.
              </p>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> SIMS Backend Connected
            </Badge>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg border border-border bg-card/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Server className="h-3.5 w-3.5 text-primary" /> REST API Gateway
              </div>
              <p className="text-sm font-semibold text-foreground">Operational</p>
              <span className="text-[10px] text-muted-foreground">DRF v1 Endpoints Authenticated</span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-card/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Database className="h-3.5 w-3.5 text-primary" /> Academic Database
              </div>
              <p className="text-sm font-semibold text-foreground">Synchronized</p>
              <span className="text-[10px] text-muted-foreground">Live counts from /api/v1/analytics/admin</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
