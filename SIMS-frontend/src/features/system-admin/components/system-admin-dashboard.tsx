'use client';

import {
  School,
  Users,
  Shield,
  GraduationCap,
  UserCheck,
  Plus,
  ArrowRight,
  RefreshCw,
  Building2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Card, Badge, Button } from '@/components/ui';
import { ROUTES } from '@/constants';
import { useAuthStore } from '@/features/auth/store';
import { useUniversities } from '@/features/universities';
import { useAdminStore } from '@/features/admin/store';

export function SystemAdminDashboard() {
  const authUser = useAuthStore((state) => state.user);
  const { data: universities = [], isLoading: isLoadingUnis, refetch: refetchUnis } = useUniversities();
  const { users, isLoadingUsers, fetchUsers } = useAdminStore();

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const stats = React.useMemo(() => {
    const totalUnis = universities.length;
    const totalUsers = users.length;
    const systemAdmins = users.filter((u) => u.role === 'SYSTEM_ADMIN').length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    const lecturers = users.filter((u) => u.role === 'LECTURER').length;
    const students = users.filter((u) => u.role === 'STUDENT').length;
    const activeUsers = users.filter((u) => u.is_active).length;

    return {
      totalUnis,
      totalUsers,
      systemAdmins,
      admins,
      lecturers,
      students,
      activeUsers,
    };
  }, [universities, users]);

  const handleRefresh = () => {
    refetchUnis();
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#102A7A] via-[#1a388f] to-[#0a1b52] p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/20">
              <Shield className="h-3.5 w-3.5 text-[#D4AF37]" /> Global System Administrator
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, {authUser?.firstName || 'System Administrator'}
            </h1>
            <p className="text-sm sm:text-base text-white/80">
              Centralized administration console for managing universities, institutions, and global user accounts across the SIMS platform.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh Data
            </Button>
            <Link href={ROUTES.SYSTEM_ADMIN.UNIVERSITIES}>
              <Button
                size="sm"
                className="bg-[#D4AF37] text-[#102A7A] hover:bg-[#c49f27] font-semibold"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add University
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Universities */}
        <Card className="p-5 relative overflow-hidden border-border/80 hover:border-primary/50 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Universities
            </span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <School className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-foreground">
              {isLoadingUnis ? '—' : stats.totalUnis}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>Active educational institutions</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60">
            <Link
              href={ROUTES.SYSTEM_ADMIN.UNIVERSITIES}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Manage Universities <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* Total Users */}
        <Card className="p-5 relative overflow-hidden border-border/80 hover:border-primary/50 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Accounts
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-foreground">
              {isLoadingUsers ? '—' : stats.totalUsers}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-success font-medium">{stats.activeUsers} active</span>
              <span>accounts across all roles</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60">
            <Link
              href={ROUTES.SYSTEM_ADMIN.USERS}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Manage Administrators <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* Administrators */}
        <Card className="p-5 relative overflow-hidden border-border/80 hover:border-primary/50 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Administrators
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-foreground">
              {isLoadingUsers ? '—' : stats.admins + stats.systemAdmins}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <span>{stats.systemAdmins} System Admins, {stats.admins} Campus Admins</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60">
            <Link
              href={ROUTES.SYSTEM_ADMIN.USERS}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Provision & Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* Faculty & Students */}
        <Card className="p-5 relative overflow-hidden border-border/80 hover:border-primary/50 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Academic Population
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-foreground">
              {isLoadingUsers ? '—' : stats.lecturers + stats.students}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <span>{stats.lecturers} Lecturers, {stats.students} Students</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60">
            <span className="text-xs text-muted-foreground">Managed by University Admins</span>
          </div>
        </Card>
      </div>

      {/* Analytics & Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* University Capacity Overview */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <School className="h-5 w-5 text-primary" /> Active Institutions
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Overview of provisioned universities across the federation.
              </p>
            </div>
            <Link href={ROUTES.SYSTEM_ADMIN.UNIVERSITIES}>
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-border border rounded-xl overflow-hidden">
            {isLoadingUnis ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                Loading universities...
              </div>
            ) : universities.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <School className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No universities registered yet.
              </div>
            ) : (
              universities.slice(0, 5).map((uni) => (
                <div key={uni.id} className="p-4 flex items-center justify-between hover:bg-accent/40 transition-colors">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{uni.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">Code: {uni.code}</p>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono shrink-0">
                    {uni.code}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Global User Distribution */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> University Administrators
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Provisioned administrators managing partner universities.
              </p>
            </div>
            <Link href={ROUTES.SYSTEM_ADMIN.USERS}>
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-border border rounded-xl overflow-hidden">
            {isLoadingUsers ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No users found.
              </div>
            ) : (
              users.slice(0, 5).map((user) => {
                const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
                return (
                  <div key={user.id} className="p-4 flex items-center justify-between hover:bg-accent/40 transition-colors">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{fullName}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{user.email}</p>
                    </div>
                    <Badge
                      variant={
                        user.role === 'SYSTEM_ADMIN'
                          ? 'default'
                          : user.role === 'ADMIN'
                            ? 'default'
                            : user.role === 'LECTURER'
                              ? 'secondary'
                              : 'outline'
                      }
                      className={`text-xs font-semibold shrink-0 ${
                        user.role === 'SYSTEM_ADMIN'
                          ? 'bg-purple-600/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                          : ''
                      }`}
                    >
                      {user.role === 'SYSTEM_ADMIN' ? 'System Admin' : user.role}
                    </Badge>
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
