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

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const defaultUserMenu = user ? (
    <UserDropdown
      user={{
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }}
      onLogout={handleLogout}
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
        aria-label="ExamSphere home"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-ai-primary text-white text-xs font-bold">
          E
        </span>
        <span className="font-semibold text-sm">ExamSphere</span>
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
    </header>
  );
}
