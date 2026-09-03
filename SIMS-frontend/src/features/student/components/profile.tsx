'use client';

import * as React from 'react';
import {
  UserRound,
  GraduationCap,
  Building,
  Building2,
  BookOpen,
  Calendar,
  Award,
  ShieldCheck,
  Info,
  Sun,
  Moon,
  Monitor,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store';
import { MfaSettings } from '@/features/auth/components';
import { useTheme } from '@/providers/theme-provider';
import { PageHeader } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { Skeleton } from '@/components/feedback';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { ROUTES } from '@/constants';
import { resolveStudentIdentifier } from '@/lib/user-identifier';
import { studentService } from '../services';
import type { AcademicProfileDetails } from '../types';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const { theme, setTheme } = useTheme();

  const [academicData, setAcademicData] = React.useState<AcademicProfileDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAcademicData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const details = await studentService.getAcademicProfileDetails();
      setAcademicData(details);
    } catch {
      setError("We couldn't load your academic profile details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAcademicData();
  }, [fetchAcademicData]);

  // Derived user details from authenticated user session
  const fullName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    : 'Authenticated Student';

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((part: string) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not provided';

  // Resolve the authentic Student Identifier entered during registration (guaranteeing no UUID is displayed)
  const resolvedStudentId = resolveStudentIdentifier(user, [academicData?.studentId]);
  const displayedAccountId = resolvedStudentId || 'Not available';

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Student portal', href: ROUTES.STUDENT.DASHBOARD },
              { label: 'My profile' },
            ]}
          />
        }
        title="Student Profile"
        description="View your verified personal identity and academic record details."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Avatar & Theme Preferences */}
        <div className="space-y-6 lg:col-span-1">
          {/* Identity Card */}
          <Card className="shadow-sm border-border">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <Avatar className="h-24 w-24 ring-2 ring-primary/20" size="2xl" fallback={initials || 'ST'} alt={fullName} />
              
              <h2 className="mt-4 text-xl font-bold text-foreground">{fullName}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{user?.email || 'Not provided'}</p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Badge variant="default" className="uppercase px-3 py-1 font-semibold">
                  {user?.role ? user.role.toUpperCase() : 'STUDENT'}
                </Badge>
                <Badge variant="secondary" className="px-3 py-1 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  Verified Record
                </Badge>
              </div>

              <div className="w-full mt-6 pt-4 border-t border-border/80 text-xs text-muted-foreground flex justify-between items-center">
                <span>Account Created</span>
                <span className="font-medium text-foreground">{formattedDate}</span>
              </div>
            </CardContent>
          </Card>

          {/* Theme & Display Settings */}
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sun className="h-4 w-4 text-primary" />
                Display Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Customize your visual interface appearance on this device.
              </p>
              
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  className="flex flex-col items-center gap-1 py-3 h-auto"
                  onClick={() => setTheme('light')}
                >
                  <Sun className="h-4 w-4" />
                  <span className="text-xs">Light</span>
                </Button>

                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  className="flex flex-col items-center gap-1 py-3 h-auto"
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="h-4 w-4" />
                  <span className="text-xs">Dark</span>
                </Button>

                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  className="flex flex-col items-center gap-1 py-3 h-auto"
                  onClick={() => setTheme('system')}
                >
                  <Monitor className="h-4 w-4" />
                  <span className="text-xs">System</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Read-Only Profile Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Error Banner */}
          {error && (
            <Card className="border-destructive/30 bg-destructive/5 text-destructive p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={fetchAcademicData}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Retry
              </Button>
            </Card>
          )}

          {/* Account Identity Details */}
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" />
                Account Identity Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyField label="First Name" value={user?.firstName || 'Not provided'} icon={<UserRound className="h-4 w-4" />} />
                <ReadOnlyField label="Last Name" value={user?.lastName || 'Not provided'} icon={<UserRound className="h-4 w-4" />} />
                <ReadOnlyField label="Email Address" value={user?.email || 'Not provided'} icon={<UserRound className="h-4 w-4" />} />
                <ReadOnlyField label="Account ID" value={displayedAccountId} icon={<ShieldCheck className="h-4 w-4" />} isMono />
                <ReadOnlyField label="User Role" value={user?.role ? user.role.toUpperCase() : 'STUDENT'} icon={<Award className="h-4 w-4" />} />
              </div>
            </CardContent>
          </Card>

          {/* Academic Information Card */}
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Academic & Institutional Information
              </CardTitle>
              <Badge variant="outline" className="text-xs font-normal">
                Read-Only Record
              </Badge>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadOnlyField
                    label="College"
                    value={academicData?.college || 'Not provided'}
                    icon={<Building className="h-4 w-4" />}
                  />
                  <ReadOnlyField
                    label="Department"
                    value={academicData?.department || 'Not provided'}
                    icon={<Building2 className="h-4 w-4" />}
                  />
                  <ReadOnlyField
                    label="Academic Program"
                    value={academicData?.program || 'Not provided'}
                    icon={<BookOpen className="h-4 w-4" />}
                  />
                  <ReadOnlyField
                    label="Student Identifier"
                    value={displayedAccountId}
                    icon={<GraduationCap className="h-4 w-4" />}
                    isMono
                  />
                  <ReadOnlyField
                    label="Academic Year"
                    value={academicData?.academicYear || 'Not provided'}
                    icon={<Calendar className="h-4 w-4" />}
                  />
                  <ReadOnlyField
                    label="Class Standing / Status"
                    value={academicData?.classStanding || 'Not provided'}
                    icon={<Award className="h-4 w-4" />}
                  />
                  <div className="sm:col-span-2 pt-2">
                    <ReadOnlyField
                      label="Enrolled Courses Count"
                      value={academicData ? `${academicData.totalEnrolledCourses} Active Enrollment(s)` : 'Not provided'}
                      icon={<BookOpen className="h-4 w-4" />}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Security & MFA */}
          <MfaSettings />
        </div>
      </div>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  icon,
  isMono = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  isMono?: boolean;
}) {
  const isMissing = value === 'Not provided' || value === 'Not available';

  return (
    <div className="rounded-lg border border-border/80 p-3.5 bg-muted/20 flex flex-col justify-between">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
        {icon && <span className="text-muted-foreground/80">{icon}</span>}
        <span>{label}</span>
      </div>
      <span
        className={`text-sm font-semibold ${
          isMono ? 'font-mono text-xs font-bold text-primary' : ''
        } ${isMissing ? 'text-muted-foreground/60 italic font-normal' : 'text-foreground'}`}
      >
        {value}
      </span>
    </div>
  );
}
