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
  Brain,
  CheckCircle2,
  Activity,
  Plus,
  ArrowUpRight,
  Clock,
  Server,
  Database,
  FileText,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Badge, Button, Card, Progress } from '@/components/ui';
import { ROUTES } from '@/constants';

import { useAdminStore } from '../store';

export function DashboardOverview() {
  const router = useRouter();
  const {
    users,
    students,
    lecturers,
    departments,
    courses,
    exams,
    aiJobs,
    auditLogs,
    fetchAdminData,
    isLoadingData,
  } = useAdminStore();

  React.useEffect(() => {
    void fetchAdminData();
  }, [fetchAdminData]);

  const totalStudents = students.length;
  const totalLecturers = lecturers.length;
  const totalAdmins = users.filter((u) => (u.role || '').toUpperCase() === 'ADMIN').length;
  const totalCourses = courses.length;
  const totalDepts = departments.length;
  const totalExamsCount = exams.length;
  const activeExamsCount = exams.filter((e) => e.status === 'active' || e.status === 'scheduled').length;
  const pendingAIGradingCount = aiJobs.filter((j) => j.status === 'processing' || j.status === 'pending').length;
  const publishedExamsCount = exams.filter((e) => e.status === 'published').length;

  const statCards = [
    { label: 'Total Students', value: isLoadingData ? '...' : totalStudents.toLocaleString(), icon: GraduationCap, color: 'text-primary', bg: 'bg-primary/10', trend: 'Enrolled students' },
    { label: 'Total Lecturers', value: isLoadingData ? '...' : totalLecturers.toString(), icon: UserCheck, color: 'text-primary', bg: 'bg-primary/10', trend: 'Faculty members' },
    { label: 'Administrators', value: isLoadingData ? '...' : totalAdmins.toString(), icon: Shield, color: 'text-primary', bg: 'bg-primary/10', trend: 'Full access' },
    { label: 'Active Courses', value: isLoadingData ? '...' : totalCourses.toString(), icon: BookOpen, color: 'text-accent', bg: 'bg-accent/10', trend: 'Academic offerings' },
    { label: 'Departments', value: isLoadingData ? '...' : totalDepts.toString(), icon: Building2, color: 'text-primary', bg: 'bg-primary/10', trend: 'Academic units' },
    { label: 'Total Exams', value: isLoadingData ? '...' : totalExamsCount.toString(), icon: ClipboardCheck, color: 'text-primary', bg: 'bg-primary/10', trend: 'Scheduled assessments' },
    { label: 'Active Exams Now', value: isLoadingData ? '...' : activeExamsCount.toString(), icon: Zap, color: 'text-accent', bg: 'bg-accent/10', trend: 'Live sessions' },
    { label: 'Pending AI Grading', value: isLoadingData ? '...' : pendingAIGradingCount.toString(), icon: Brain, color: 'text-primary', bg: 'bg-primary/10', trend: 'Queue processing' },
    { label: 'Published Results', value: isLoadingData ? '...' : publishedExamsCount.toString(), icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', trend: 'Verified scores' },
    { label: 'System Status', value: 'Active', icon: Activity, color: 'text-success', bg: 'bg-success/10', trend: 'All services online' },
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
            Overview of users, academic departments, examination sessions, and real-time AI grading infrastructure.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => router.push(ROUTES.ADMIN.USERS)}
          >
            Add New User
          </Button>
          <Button
            variant="outline"
            leftIcon={<Brain className="h-4 w-4" />}
            onClick={() => router.push(ROUTES.ADMIN.AI_MONITOR)}
          >
            AI Grading Queue
          </Button>
        </div>
      </div>

      {/* Summary Cards Grid (10 Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.2 }}
            >
              <Card className="p-4 transition-all duration-200 hover:shadow-md hover:border-primary/30">
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

      {/* Quick Actions & System Health Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="p-5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" /> Quick Administrative Actions
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Shortcuts for routine institution administration tasks.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2.5">
            <Button
              variant="outline"
              className="justify-between text-left h-auto py-2.5 px-3"
              onClick={() => router.push(ROUTES.ADMIN.USERS)}
            >
              <span className="flex items-center gap-2.5 text-xs font-medium">
                <UserCheck className="h-4 w-4 text-primary" /> Manage Users & Roles
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="justify-between text-left h-auto py-2.5 px-3"
              onClick={() => router.push(ROUTES.ADMIN.ENROLLMENTS)}
            >
              <span className="flex items-center gap-2.5 text-xs font-medium">
                <UserPlus className="h-4 w-4 text-primary" /> Manage Course Enrollments
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="justify-between text-left h-auto py-2.5 px-3"
              onClick={() => router.push(ROUTES.ADMIN.DEPARTMENTS)}
            >
              <span className="flex items-center gap-2.5 text-xs font-medium">
                <Building2 className="h-4 w-4 text-primary" /> Add / Manage Departments
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="justify-between text-left h-auto py-2.5 px-3"
              onClick={() => router.push(ROUTES.ADMIN.COURSES)}
            >
              <span className="flex items-center gap-2.5 text-xs font-medium">
                <BookOpen className="h-4 w-4 text-primary" /> Assign Courses & Lecturers
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="justify-between text-left h-auto py-2.5 px-3"
              onClick={() => router.push(ROUTES.ADMIN.SETTINGS)}
            >
              <span className="flex items-center gap-2.5 text-xs font-medium">
                <Server className="h-4 w-4 text-primary" /> Configure System Settings
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </Card>

        {/* System Infrastructure & API Status */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-success" /> Infrastructure & Backend Connectivity
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time connection status with SIMS Django REST backend APIs.
              </p>
            </div>
            <Badge variant="outline" className="border-success/30 text-success bg-success/10 gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> SIMS Backend Connected
            </Badge>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg border border-border bg-card/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Server className="h-3.5 w-3.5 text-primary" /> API Gateway
              </div>
              <p className="text-sm font-semibold text-foreground">Operational</p>
              <span className="text-[10px] text-muted-foreground">Connected to DRF REST v1 API</span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-card/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Database className="h-3.5 w-3.5 text-primary" /> Database Services
              </div>
              <p className="text-sm font-semibold text-foreground">Synchronized</p>
              <span className="text-[10px] text-muted-foreground">PostgreSQL academic database active</span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-card/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ClipboardCheck className="h-3.5 w-3.5 text-primary" /> Examination Engine
              </div>
              <p className="text-sm font-semibold text-foreground">{totalExamsCount} Registered Assessments</p>
              <span className="text-[10px] text-muted-foreground">{activeExamsCount} active session(s)</span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-card/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Brain className="h-3.5 w-3.5 text-primary" /> AI Evaluation Infrastructure
              </div>
              <p className="text-sm font-semibold text-foreground">Ready</p>
              <span className="text-[10px] text-muted-foreground">Automated grading pipeline initialized</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Streams Grid: Recent Audit Activity & AI Queue Snapshot */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Audit Activity */}
        <Card className="p-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Recent System Activity & Audit Trail
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Latest security events and administrative actions.
              </p>
            </div>
            <Link
              href={ROUTES.ADMIN.AUDIT_LOGS}
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              View Full Logs <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center bg-muted/20 border-dashed border rounded-lg">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No recent system audit logs recorded.</p>
              </div>
            ) : (
              auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/40 transition-colors">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground truncate">{log.actionEvent}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="font-medium text-foreground">{log.actorName}</span>
                      <span>•</span>
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* AI Grading Monitor Snapshot */}
        <Card className="p-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Brain className="h-4 w-4 text-ai-primary" /> Active AI Evaluation Jobs
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated grading pipeline status and queue monitoring.
              </p>
            </div>
            <Link
              href={ROUTES.ADMIN.AI_MONITOR}
              className="text-xs text-ai-primary hover:underline font-medium flex items-center gap-1"
            >
              AI Monitor <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {aiJobs.length === 0 ? (
              <div className="p-8 text-center bg-muted/20 border-dashed border rounded-lg">
                <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No active AI evaluation jobs in queue.</p>
              </div>
            ) : (
              aiJobs.map((job) => {
                const progressPct = Math.round((job.processedSubmissions / job.totalSubmissions) * 100);
                return (
                  <div key={job.id} className="p-3 rounded-lg border border-border bg-card/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground truncate">{job.examTitle}</span>
                      <Badge
                        variant={
                          job.status === 'completed'
                            ? 'success'
                            : job.status === 'processing'
                            ? 'warning'
                            : job.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-[10px] capitalize"
                      >
                        {job.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{job.courseName}</span>
                      <span>
                        {job.processedSubmissions} / {job.totalSubmissions} ({progressPct}%)
                      </span>
                    </div>
                    <Progress value={progressPct} className="h-1.5" />
                    {job.errorReason && (
                      <p className="text-[10px] text-destructive font-medium">⚠️ {job.errorReason}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
