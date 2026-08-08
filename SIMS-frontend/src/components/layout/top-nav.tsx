'use client';

import { Bell, Menu } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { ThemeToggle } from '@/components/common/theme-toggle';
import { UserDropdown } from '@/components/navigation';
import { IconButton, Tooltip } from '@/components/ui';
import { useAuthStore } from '@/features/auth/store';
import { cn } from '@/lib';
import { getUserDisplayName } from '@/utils/string';
import { ConfirmationDialog, toast } from '@/components/feedback';
import { ROUTES } from '@/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TopNavProps {
  /** Called when the mobile menu button is pressed. */
  onMenuOpen?: () => void;
  /** Extra content to inject in the centre slot (e.g. a search bar). */
  centerSlot?: React.ReactNode;
  /** Extra actions rendered in the right action group. */
  actions?: React.ReactNode;
  /** Right-side user/avatar control. */
  userMenu?: React.ReactNode;
  /** Notification bell slot. */
  notificationMenu?: React.ReactNode;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Fixed top navigation bar.
 * Composes with `<UserDropdown>` and `<NotificationDropdown>` from the navigation layer.
 *
 * @example
 * <TopNav userMenu={<UserDropdown />} notificationMenu={<NotificationDropdown />} />
 */
export function TopNav({
  onMenuOpen,
  centerSlot,
  actions,
  userMenu,
  notificationMenu,
  className,
}: TopNavProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = React.useState(false);

  const handleConfirmLogout = async () => {
    setIsLogoutDialogOpen(false);
    await logout();
    toast.success('You have been signed out successfully.', { id: 'auth-logout' });
    router.replace('/login');
  };

  const handleProfileNavigation = () => {
    if (!user) return;
    if (user.role === 'admin') {
      router.push(ROUTES.ADMIN.PROFILE);
    } else if (user.role === 'lecturer') {
      router.push(ROUTES.LECTURER.PROFILE);
    } else {
      router.push(ROUTES.STUDENT.PROFILE);
    }
  };

  const handleSettingsNavigation = () => {
    if (!user) return;
    if (user.role === 'admin') {
      router.push(ROUTES.ADMIN.SETTINGS);
    } else {
      router.push('/settings');
    }
  };

  const defaultUserMenu = user ? (
    <UserDropdown
      user={{
        name: getUserDisplayName(user),
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }}
      onProfile={handleProfileNavigation}
      onSettings={handleSettingsNavigation}
      onLogout={() => setIsLogoutDialogOpen(true)}
    />
  ) : null;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center gap-3',
        'border-b border-border bg-background/80 backdrop-blur-md',
        'px-4 lg:px-6',
        className,
      )}
    >
      {/* Mobile menu button */}
      <IconButton
        aria-label="Open navigation menu"
        variant="ghost"
        size="md"
        className="lg:hidden"
        onClick={onMenuOpen}
      >
        <Menu className="h-5 w-5" />
      </IconButton>

      {/* Brand (mobile only) */}
      <Link
        href="/"
        className="flex items-center gap-2 lg:hidden"
        aria-label="AASTU home"
      >
        <img src="/images/aastu-logo.jpg" alt="AASTU Logo" className="h-6 w-auto rounded-md bg-white p-0.5 shrink-0" />
        <span className="font-semibold text-sm">AASTU Grading</span>
      </Link>

      {/* Centre slot */}
      <div className="flex-1">
        {centerSlot}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {actions}

        <Tooltip content="Toggle theme">
          <ThemeToggle variant="cycle" />
        </Tooltip>

        {notificationMenu ?? (
          <Tooltip content="Notifications">
            <IconButton aria-label="Notifications" variant="ghost">
              <Bell className="h-5 w-5" />
            </IconButton>
          </Tooltip>
        )}

        {userMenu ?? defaultUserMenu}
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
        title="Sign Out"
        description="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        destructive
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />
    </header>
  );
}
