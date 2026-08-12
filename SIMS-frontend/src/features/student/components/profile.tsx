'use client';

import * as React from 'react';
import { KeyRound, UserRound, Save } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store';
import { PageHeader } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { Avatar, Button, Card, CardContent, CardHeader, CardTitle, Badge, Input } from '@/components/ui';
import { SuccessState, toast } from '@/components/feedback';
import { ROUTES } from '@/constants';
import { studentService } from '../services';
import type { StudentProfile } from '../types';

const fields: Array<{ key: keyof StudentProfile; label: string; type?: string }> = [
  { key: 'fullName', label: 'Full name' },
  { key: 'studentId', label: 'Student ID' },
  { key: 'email', label: 'Email address', type: 'email' },
  { key: 'department', label: 'Department' },
  { key: 'program', label: 'Program' },
  { key: 'yearOfStudy', label: 'Year of study' },
];

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = React.useState<StudentProfile>(() => studentService.getProfile());
  const [errors, setErrors] = React.useState<Partial<Record<keyof StudentProfile, string>>>({});
  const [saved, setSaved] = React.useState(false);

  const fullName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    : profile.fullName || 'Authenticated Student';

  const initials = fullName
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const update = (key: keyof StudentProfile, value: string) => {
    setSaved(false);
    setProfile((current: StudentProfile) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: Partial<Record<keyof StudentProfile, string>> = {};
    if (!profile.fullName.trim()) next.fullName = 'Please enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(profile.email)) next.email = 'Enter a valid email address.';
    if (!profile.studentId.trim()) next.studentId = 'Please enter your student ID.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaved(true);
    toast.success('Profile changes saved', {
      description: 'Your updated details are ready to sync with the student records API.',
    });
  };

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
        title="My profile"
        description="Manage your personal identity and academic profile information."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar & Summary Card */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Avatar className="h-24 w-24" size="2xl" fallback={initials || 'ST'} alt={fullName} />
            <h2 className="mt-4 text-lg font-semibold text-foreground">{fullName}</h2>
            <p className="text-sm text-muted-foreground">{user?.email || profile.email}</p>
            <div className="mt-3">
              <Badge variant="default" className="uppercase">
                Role: {user?.role || 'STUDENT'}
              </Badge>
            </div>
            <Button
              variant="outline"
              className="mt-6 w-full"
              leftIcon={<KeyRound className="h-4 w-4" />}
              onClick={() =>
                toast.info('Password changes will be connected to authentication API endpoints.', {
                  description: 'This action is managed via standard auth security settings.',
                })
              }
            >
              Account Security
            </Button>
          </CardContent>
        </Card>

        {/* Authenticated User Identity Details & Academic Form Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" />
                Authenticated User Identity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailField label="First Name" value={user?.firstName || 'N/A'} />
                <DetailField label="Last Name" value={user?.lastName || 'N/A'} />
                <DetailField label="Email Address" value={user?.email || 'N/A'} />
                <DetailField label="System User ID" value={user?.id || 'N/A'} />
                <DetailField label="Role Scoping" value={user?.role?.toUpperCase() || 'STUDENT'} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" />
                Academic Profile Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form noValidate onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
                {fields.map((field) => (
                  <label key={String(field.key)} className={field.key === 'program' ? 'sm:col-span-2' : ''}>
                    <span className="mb-1.5 block text-sm font-medium">{field.label}</span>
                    <Input
                      type={field.type}
                      value={profile[field.key]}
                      onChange={(event) => update(field.key, event.target.value)}
                      error={Boolean(errors[field.key])}
                      aria-describedby={errors[field.key] ? `${String(field.key)}-error` : undefined}
                    />
                    {errors[field.key] && (
                      <span id={`${String(field.key)}-error`} className="mt-1 block text-xs text-destructive">
                        {errors[field.key]}
                      </span>
                    )}
                  </label>
                ))}
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" leftIcon={<Save className="h-4 w-4" />}>
                    Save changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {saved && (
            <SuccessState
              className="rounded-xl border border-success/20 bg-success/5"
              title="Profile updated"
              description="Your changes have been validated and saved locally."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/80 p-3 bg-muted/20">
      <span className="block text-xs text-muted-foreground font-medium">{label}</span>
      <span className="block text-sm font-semibold text-foreground mt-0.5">{value}</span>
    </div>
  );
}
