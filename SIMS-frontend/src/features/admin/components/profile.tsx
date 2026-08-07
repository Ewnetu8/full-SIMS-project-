'use client';

import { User, Shield, Mail, Calendar, Key, Save, CheckCircle2 } from 'lucide-react';
import * as React from 'react';

import { toast } from '@/components/feedback';
import { getUserFriendlyErrorMessage } from '@/lib/errors';
import { Label } from '@/components/forms';
import { Avatar, Badge, Button, Card, Input } from '@/components/ui';
import { useAuthStore } from '@/features/auth/store';
import { getUserDisplayName } from '@/utils/string';

export function AdminProfile() {
  const { user, updateProfile } = useAuthStore();

  const [formData, setFormData] = React.useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  // Sync state if user changes in store
  React.useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [user]);

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">No authenticated user session found.</p>
      </Card>
    );
  }

  const displayName = getUserDisplayName(user);
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required.';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const updatedUser = {
        ...user,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        updatedAt: new Date().toISOString(),
      };

      updateProfile(updatedUser);
      toast.success('Admin profile updated successfully.');
    } catch (err: any) {
      toast.error(getUserFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner Card */}
      <Card className="p-6 md:p-8 bg-gradient-to-r from-[#102A7A]/10 via-background to-background border-border">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <Avatar
            src={user.avatarUrl}
            alt={displayName}
            fallback={initials}
            size="lg"
            className="h-20 w-20 text-xl font-bold ring-4 ring-[#102A7A]/20"
          />
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-2xl font-bold text-[#102A7A] dark:text-foreground">{displayName}</h1>
              <Badge className="w-fit mx-auto md:mx-0 bg-[#102A7A] text-white dark:bg-sidebar-accent">
                <Shield className="h-3 w-3 mr-1" /> System Administrator
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center md:justify-start gap-1.5 pt-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Account Created: {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </Card>

      {/* Main Profile Form & Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Editable Information */}
        <Card className="md:col-span-2 p-6 space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="text-lg font-semibold text-[#102A7A] dark:text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Administrator Personal Details
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update your administrative profile information and display preferences.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label required>First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First name"
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                />
                {fieldErrors.firstName && <p className="text-xs text-destructive mt-1">{fieldErrors.firstName}</p>}
              </div>

              <div>
                <Label required>Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last name"
                  className="mt-1.5 focus:border-[#102A7A] focus:ring-[#D4AF37]/50"
                />
                {fieldErrors.lastName && <p className="text-xs text-destructive mt-1">{fieldErrors.lastName}</p>}
              </div>
            </div>

            <div>
              <Label>Email Address</Label>
              <Input
                value={formData.email}
                disabled
                className="mt-1.5 bg-muted/50 cursor-not-allowed text-muted-foreground"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Institutional email address is managed via central system administration.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={isSubmitting}
                leftIcon={<Save className="h-4 w-4" />}
                className="bg-[#102A7A] text-white hover:bg-[#D4AF37] hover:text-[#102A7A] transition-colors font-medium px-5"
              >
                {isSubmitting ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Right Column - System & Security Summary */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" /> Account Metadata
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-muted-foreground">User ID</p>
                <p className="font-mono font-semibold text-foreground break-all">{user.id}</p>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground">Assigned Role</p>
                <p className="font-semibold text-[#102A7A] dark:text-blue-400 capitalize">{user.role}</p>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground">Authentication Status</p>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active Authenticated Session
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-muted/20 border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Administrative Privileges
            </h3>
            <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
              <li>Full access to institutional academic structures (Colleges, Departments, Programs)</li>
              <li>User role management & account status controls</li>
              <li>Examination oversight & AI grading stream monitoring</li>
              <li>System configuration & audit trail inspection</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
