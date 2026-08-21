'use client';

import {
  User,
  Shield,
  Mail,
  Calendar,
  BookOpen,
  Building,
  GraduationCap,
  Users,
  Award,
} from 'lucide-react';
import * as React from 'react';

import { PageHeader } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { Skeleton } from '@/components/feedback';
import { Avatar, Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ROUTES } from '@/constants';
import { useAuthStore } from '@/features/auth/store';
import { getUserDisplayName } from '@/utils/string';
import { lecturerService } from '../services';
import type { Course } from '../types';

interface ProfileDetails {
  departmentName?: string;
  collegeName?: string;
  assignedCoursesCount: number;
  totalStudentsCount: number;
  activeExamsCount: number;
  courses: Course[];
}

export function LecturerProfile() {
  const user = useAuthStore((state) => state.user);
  const [details, setDetails] = React.useState<ProfileDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    lecturerService
      .getProfileDetails()
      .then((data) => {
        if (mounted) {
          setDetails(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setDetails({
            assignedCoursesCount: 0,
            totalStudentsCount: 0,
            activeExamsCount: 0,
            courses: [],
          });
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">No authenticated lecturer session found.</p>
      </Card>
    );
  }

  const displayName = getUserDisplayName(user);
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not provided';

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: ROUTES.LECTURER.DASHBOARD },
              { label: 'My Profile' },
            ]}
          />
        }
        title="Lecturer Profile"
        description="View your authenticated academic identity, department credentials, and assigned courses."
      />

      {/* Header Banner Card */}
      <Card className="p-6 md:p-8 bg-gradient-to-r from-[#102A7A]/10 via-background to-background border-border">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <Avatar
            src={user.avatarUrl}
            alt={displayName}
            fallback={initials || 'LC'}
            size="lg"
            className="h-20 w-20 text-xl font-bold ring-4 ring-[#102A7A]/20"
          />
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-2xl font-bold text-[#102A7A] dark:text-foreground">{displayName}</h1>
              <Badge className="w-fit mx-auto md:mx-0 bg-[#102A7A] text-white dark:bg-sidebar-accent">
                <Shield className="h-3 w-3 mr-1" /> Lecturer
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" /> {user.email || 'Not provided'}
            </p>
            {isLoading ? (
              <Skeleton className="h-4 w-48 mx-auto md:mx-0" />
            ) : (
              <p className="text-xs text-muted-foreground flex items-center justify-center md:justify-start gap-1.5 pt-1">
                <Building className="h-3.5 w-3.5 text-primary" />
                {details?.departmentName ? `${details.departmentName}` : 'Department: Not provided'}
                {details?.collegeName ? ` • ${details.collegeName}` : ''}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Academic Overview Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#102A7A] dark:text-blue-400 shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Assigned Courses</p>
            {isLoading ? (
              <Skeleton className="h-6 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{details?.assignedCoursesCount ?? 0}</p>
            )}
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60 text-[#D4AF37] dark:text-amber-400 shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Enrolled Students</p>
            {isLoading ? (
              <Skeleton className="h-6 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{details?.totalStudentsCount ?? 0}</p>
            )}
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Active Examinations</p>
            {isLoading ? (
              <Skeleton className="h-6 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{details?.activeExamsCount ?? 0}</p>
            )}
          </div>
        </Card>
      </div>

      {/* Main Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Personal & Account Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-6">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#102A7A] dark:text-foreground flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Personal Identity Details
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Official personal credentials verified from your authenticated session.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                Read-Only
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <DetailBox label="First Name" value={user.firstName || 'Not provided'} />
              <DetailBox label="Last Name" value={user.lastName || 'Not provided'} />
              <DetailBox label="Full Name" value={displayName || 'Not provided'} />
              <DetailBox label="Email Address" value={user.email || 'Not provided'} />
              <DetailBox label="Lecturer Identifier (User ID)" value={user.id || 'Not provided'} isMono />
              <DetailBox label="Role" value={user.role ? user.role.toUpperCase() : 'LECTURER'} />
            </div>
          </Card>

          {/* Academic Information Section */}
          <Card className="p-6 space-y-6">
            <div className="border-b border-border pb-3">
              <h2 className="text-lg font-semibold text-[#102A7A] dark:text-foreground flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" /> Academic Information
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Departmental affiliation and active teaching courses.
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <DetailBox label="Department" value={details?.departmentName || 'Not provided'} />
                  <DetailBox label="College" value={details?.collegeName || 'Not provided'} />
                </div>

                <div className="pt-3 border-t border-border space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Assigned Course Offerings ({details?.courses?.length ?? 0})
                  </h3>
                  {!details?.courses || details.courses.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">
                      No course offerings currently assigned to this account.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {details.courses.map((course) => (
                        <div
                          key={course.id}
                          className="rounded-lg border border-border/80 p-3 bg-muted/20 hover:border-[#102A7A]/30 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-[#102A7A] dark:text-blue-400">
                              {course.code}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {course.studentCount} students
                            </span>
                          </div>
                          <p className="text-xs font-medium text-foreground mt-1 truncate">{course.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Semester: {course.semester} ({course.academicYear})
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Account Metadata */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Session Metadata
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-muted-foreground">Account Creation Date</p>
                <p className="font-semibold text-foreground mt-0.5">{formattedDate}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailBox({ label, value, isMono = false }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div className="rounded-lg border border-border/80 p-3.5 bg-muted/20">
      <span className="block text-xs text-muted-foreground font-medium">{label}</span>
      <span
        className={`block text-sm font-semibold text-foreground mt-1 ${
          isMono ? 'font-mono break-all text-xs' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}
