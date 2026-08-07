'use client';

import { KeyRound, Save, UserRound } from 'lucide-react';
import * as React from 'react';

import { SuccessState, toast } from '@/components/feedback';
import { CollegeDepartmentSelect, Label } from '@/components/forms';
import { PageHeader } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { Avatar, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { ROUTES } from '@/constants';

import { studentService } from '../services';

import type { StudentProfile } from '../types';

export function ProfilePage() {
  const [profile, setProfile] = React.useState<StudentProfile>(() => studentService.getProfile());
  const [collegeId, setCollegeId] = React.useState('col-coe-001');
  const [errors, setErrors] = React.useState<Partial<Record<keyof StudentProfile, string>>>({});
  const [saved, setSaved] = React.useState(false);

  const update = (key: keyof StudentProfile, value: string) => {
    setSaved(false);
    setProfile((current) => ({ ...current, [key]: value }));
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
        description="Manage your personal and academic information."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Avatar className="h-24 w-24" size="2xl" fallback="AN" alt={profile.fullName} />
            <h2 className="mt-4 text-lg font-semibold">{profile.fullName}</h2>
            <p className="text-sm text-muted-foreground">{profile.studentId}</p>
            <p className="mt-4 text-sm text-muted-foreground">{profile.program}</p>
            <Button
              variant="outline"
              className="mt-6 w-full"
              leftIcon={<KeyRound className="h-4 w-4" />}
              onClick={() =>
                toast.info('Password changes will be connected to the authentication API.', {
                  description: 'This action is intentionally UI-only for Phase 5.',
                })
              }
            >
              Change password
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              Personal & Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form noValidate onSubmit={submit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-sm font-medium">Full name</span>
                  <Input
                    value={profile.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                    error={Boolean(errors.fullName)}
                  />
                  {errors.fullName && <span className="mt-1 block text-xs text-destructive">{errors.fullName}</span>}
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium">Student ID</span>
                  <Input
                    value={profile.studentId}
                    onChange={(e) => update('studentId', e.target.value)}
                    error={Boolean(errors.studentId)}
                  />
                  {errors.studentId && <span className="mt-1 block text-xs text-destructive">{errors.studentId}</span>}
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium">Email address</span>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => update('email', e.target.value)}
                    error={Boolean(errors.email)}
                  />
                  {errors.email && <span className="mt-1 block text-xs text-destructive">{errors.email}</span>}
                </label>
              </div>

              {/* Dependent College & Department Selection */}
              <div className="pt-2 border-t border-border">
                <CollegeDepartmentSelect
                  collegeValue={collegeId}
                  onCollegeChange={(colId) => setCollegeId(colId)}
                  departmentValue={profile.department}
                  onDepartmentChange={(deptVal) => update('department', deptVal)}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-sm font-medium">Program</span>
                  <Input value={profile.program} onChange={(e) => update('program', e.target.value)} />
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium">Year of study</span>
                  <Input value={profile.yearOfStudy} onChange={(e) => update('yearOfStudy', e.target.value)} />
                </label>
              </div>

              <div className="flex justify-end">
                <Button type="submit" leftIcon={<Save className="h-4 w-4" />}>
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {saved && (
        <SuccessState
          className="rounded-xl border border-success/20 bg-success/5"
          title="Profile updated"
          description="Your changes have been validated and saved locally."
        />
      )}
    </div>
  );
}