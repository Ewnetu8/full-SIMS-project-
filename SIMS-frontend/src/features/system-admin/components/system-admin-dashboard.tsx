'use client';

import {
  School,
  Users,
  Shield,
  ShieldCheck,
  GraduationCap,
  Plus,
  ArrowRight,
  RefreshCw,
  Building2,
  KeyRound,
  ExternalLink,
  Bell,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Card, Badge, Button } from '@/components/ui';
import { Skeleton, SkeletonTable, EmptyState } from '@/components/feedback';
import { ROUTES } from '@/constants';
import { useAuthStore } from '@/features/auth/store';
import { useUniversities } from '@/features/universities';
import { useAdminStore } from '@/features/admin/store';
import { useNotifications } from '@/features/notifications';
import { cn } from '@/lib';

export function SystemAdminDashboard() {
  const authUser = useAuthStore((state) => state.user);
  const mfaEnabled = useAuthStore((state) => state.mfaEnabled);
  const isMfaLoading = useAuthStore((state) => state.isMfaLoading);
  const fetchMfaStatus = useAuthStore((state) => state.fetchMfaStatus);

  const { data: universities = [], isLoading: isLoadingUnis, refetch: refetchUnis } = useUniversities();
  const { users, isLoadingUsers, fetchUsers, courses, fetchCourses } = useAdminStore();
  const { data: notifications = [], isLoading: isLoadingNotifications, refetch: refetchNotifications } = useNotifications();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  React.useEffect(() => {
    void fetchUsers();
    void fetchCourses().catch(() => {});
    void fetchMfaStatus();
  }, [fetchUsers, fetchCourses, fetchMfaStatus]);

  const stats = React.useMemo(() => {
    const totalUnis = universities.length;
    const totalUsers = users.length;
    const systemAdmins = users.filter((u) => u.role === 'SYSTEM_ADMIN').length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    const lecturers = users.filter((u) => u.role === 'LECTURER').length;
    const students = users.filter((u) => u.role === 'STUDENT').length;
    const activeUsers = users.filter((u) => u.is_active).length;
    const totalCourses = courses.length;

    return {
      totalUnis,
      totalUsers,
      systemAdmins,
      admins,
      lecturers,
      students,
      activeUsers,
      totalCourses,
    };
  }, [universities, users, courses]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchUnis(),
        fetchUsers(),
        fetchCourses().catch(() => {}),
        fetchMfaStatus(),
        refetchNotifications(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter administrator accounts for the personnel table
  const adminUsers = React.useMemo(() => {
    return users
      .filter((u) => u.role === 'SYSTEM_ADMIN' || u.role === 'ADMIN')
      .slice(0, 6);
  }, [users]);

  return (
    <div className="space-y-8">
      {/* ─── Institutional Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            System Administration
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            System Administration
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Manage users, academic structure, security, and system configuration across the institution.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            leftIcon={<RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>

          <Link href={ROUTES.SECURITY_SETTINGS}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<KeyRound className="h-3.5 w-3.5" />}
            >
              Security Settings
            </Button>
          </Link>

          <Link href={ROUTES.SYSTEM_ADMIN.UNIVERSITIES}>
            <Button
              size="sm"
              className="bg-[#102A7A] hover:bg-[#0d2263] text-white"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add University
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── System Overview (Compact Metrics) ────────────────────────────── */}
      <section aria-labelledby="system-overview-heading" className="space-y-3">
        <h2 id="system-overview-heading" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          System Overview
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 rounded-lg border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
          {/* Total Accounts */}
          <div className="p-4 sm:p-5">
            <div className="text-xs font-medium text-muted-foreground">Users</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {isLoadingUsers ? '—' : stats.totalUsers.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {isLoadingUsers ? '—' : stats.activeUsers.toLocaleString()} active
              </span>{' '}
              registered accounts
            </div>
          </div>

          {/* Faculty / Lecturers */}
          <div className="p-4 sm:p-5">
            <div className="text-xs font-medium text-muted-foreground">Lecturers</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {isLoadingUsers ? '—' : stats.lecturers.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Academic instructional faculty
            </div>
          </div>

          {/* Students */}
          <div className="p-4 sm:p-5">
            <div className="text-xs font-medium text-muted-foreground">Students</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {isLoadingUsers ? '—' : stats.students.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Enrolled student accounts
            </div>
          </div>

          {/* Courses / Institutions */}
          <div className="p-4 sm:p-5">
            <div className="text-xs font-medium text-muted-foreground">Courses</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {stats.totalCourses > 0 ? stats.totalCourses.toLocaleString() : (isLoadingUnis ? '—' : stats.totalUnis.toLocaleString())}
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {stats.totalCourses > 0 ? 'Catalog curriculum courses' : 'Federated universities'}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Quick Administration ─────────────────────────────────────────── */}
      <section aria-labelledby="quick-admin-heading" className="space-y-3">
        <h2 id="quick-admin-heading" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Administration
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Users & Roles */}
          <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Users & Roles</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Manage system users, administrators, and role assignments across the institution.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <Link
                href={ROUTES.SYSTEM_ADMIN.USERS}
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                Manage Users & Roles <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Academic Structure */}
          <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <School className="h-4 w-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Academic Structure</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Manage colleges, departments, academic programs, and course catalogs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <Link
                href={ROUTES.ADMIN.COLLEGES}
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                Manage Academic Structure <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Security */}
          <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Security & MFA</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Manage authentication policies, active sessions, and multi-factor settings.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <Link
                href={ROUTES.SECURITY_SETTINGS}
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                Manage Security Settings <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* System Management */}
          <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">System Management</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provision partner universities, configure campus nodes, and manage platform scopes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <Link
                href={ROUTES.SYSTEM_ADMIN.UNIVERSITIES}
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                Manage Universities <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Security & MFA Status Section ─────────────────────────────────── */}
      <section aria-labelledby="security-section-heading">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" id="security-section-heading">
                Security
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Multi-Factor Authentication
              </h3>
              <p className="text-sm text-muted-foreground max-w-xl">
                Add an additional layer of protection to your account with two-step verification.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-sm">
                <span className="text-xs text-muted-foreground block mb-0.5">Status</span>
                {isMfaLoading ? (
                  <span className="text-xs text-muted-foreground">Checking...</span>
                ) : mfaEnabled ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    Not Configured
                  </span>
                )}
              </div>

              <Link href={ROUTES.SECURITY_SETTINGS}>
                <Button variant="outline" size="sm">
                  Manage MFA
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tabular Information Sections ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Active Institutions */}
        <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
          <div className="p-4 sm:px-5 sm:py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Active Institutions
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Overview of provisioned universities across the system.
              </p>
            </div>
            <Link
              href={ROUTES.SYSTEM_ADMIN.UNIVERSITIES}
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoadingUnis ? (
              <div className="p-4">
                <SkeletonTable rows={4} cols={3} />
              </div>
            ) : universities.length === 0 ? (
              <div className="p-8 text-center">
                <EmptyState
                  title="No universities registered"
                  description="No institutions have been provisioned in the system yet."
                  action={{
                    label: 'Add University',
                    onClick: () => {},
                  }}
                  className="py-6"
                />
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <th scope="col" className="py-2.5 px-4">Institution</th>
                    <th scope="col" className="py-2.5 px-4">Code</th>
                    <th scope="col" className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {universities.slice(0, 5).map((uni) => (
                    <tr key={uni.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground text-sm">{uni.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">ID: {uni.id.slice(0, 8)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/50">
                          {uni.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={ROUTES.SYSTEM_ADMIN.UNIVERSITIES}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Table 2: University & System Administrators */}
        <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
          <div className="p-4 sm:px-5 sm:py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Administrative Accounts
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Personnel holding System Administrator or Campus Administrator roles.
              </p>
            </div>
            <Link
              href={ROUTES.SYSTEM_ADMIN.USERS}
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoadingUsers ? (
              <div className="p-4">
                <SkeletonTable rows={4} cols={3} />
              </div>
            ) : adminUsers.length === 0 ? (
              <div className="p-8 text-center">
                <EmptyState
                  title="No administrators found"
                  description="No system or campus administrators match the criteria."
                  className="py-6"
                />
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <th scope="col" className="py-2.5 px-4">Administrator</th>
                    <th scope="col" className="py-2.5 px-4">Role</th>
                    <th scope="col" className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {adminUsers.map((user) => {
                    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
                    const isSysAdmin = user.role === 'SYSTEM_ADMIN';
                    return (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground text-sm">{fullName}</div>
                          <div className="text-xs text-muted-foreground font-mono truncate max-w-xs">{user.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'text-xs font-medium px-2 py-0.5 rounded border',
                              isSysAdmin
                                ? 'bg-primary/5 text-primary border-primary/20'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-border'
                            )}
                          >
                            {isSysAdmin ? 'System Admin' : 'Campus Admin'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={ROUTES.SYSTEM_ADMIN.USERS}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ─── Recent Activity / Notifications ──────────────────────────────── */}
      <section aria-labelledby="notifications-section-heading">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 sm:px-5 sm:py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 id="notifications-section-heading" className="text-sm font-semibold text-foreground">
                Recent System Activity & Notifications
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Authoritative platform notices and administrative alerts.
              </p>
            </div>
            <Link
              href={ROUTES.SYSTEM_ADMIN.NOTIFICATIONS}
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              View All Notifications <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div>
            {isLoadingNotifications ? (
              <div className="p-4">
                <SkeletonTable rows={3} cols={3} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <p className="text-sm text-muted-foreground">No recent system notifications.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.slice(0, 5).map((notification) => {
                  let formattedDate = notification.created_at;
                  try {
                    formattedDate = new Date(notification.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                  } catch {
                    formattedDate = notification.created_at;
                  }

                  return (
                    <div
                      key={notification.id}
                      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/20 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className={cn('text-sm', notification.is_read ? 'text-foreground' : 'font-semibold text-foreground')}>
                          {notification.message_body}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {formattedDate}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {!notification.is_read && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
