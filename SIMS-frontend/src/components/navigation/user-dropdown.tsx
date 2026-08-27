'use client';

import { LogOut, Settings, User, ChevronDown } from 'lucide-react';
import * as React from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserDropdownProps {
  user?: {
    name:      string;
    email:     string;
    role:      string;
    avatarUrl?: string;
  };
  onProfile?:  () => void;
  onSettings?: () => void;
  onLogout?:   () => void;
  className?:  string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * User avatar dropdown with profile, settings, and logout items.
 *
 * @example
 * <UserDropdown user={session.user} onLogout={handleLogout} />
 */
export function UserDropdown({
  user = { name: 'John Doe', email: 'john@example.com', role: 'student' },
  onProfile,
  onSettings,
  onLogout,
  className,
}: UserDropdownProps) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleLabel: Record<string, string> = {
    system_admin: 'System Administrator',
    admin:        'Administrator',
    lecturer:     'Lecturer',
    student:      'Student',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 rounded-lg p-1.5',
            'text-sm hover:bg-accent transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
          aria-label="User menu"
        >
          <Avatar
            src={user.avatarUrl}
            alt={user.name}
            fallback={initials}
            size="sm"
            status="online"
          />
          <div className="hidden md:flex flex-col items-start">
            <span className="text-xs font-medium leading-none">{user.name}</span>
            <span className="text-[10px] text-muted-foreground">{roleLabel[user.role] ?? user.role}</span>
          </div>
          <ChevronDown className="hidden md:block h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* User info header */}
        <div className="flex items-start gap-3 p-3">
          <Avatar
            src={user.avatarUrl}
            alt={user.name}
            fallback={initials}
            size="md"
          />
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-sm font-medium leading-none truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <Badge variant="secondary" size="sm" className="w-fit mt-0.5">
              {roleLabel[user.role] ?? user.role}
            </Badge>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onProfile}>
          <User className="h-4 w-4" />
          Profile
          <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
        </DropdownMenuItem>

        {onSettings && (
          <DropdownMenuItem onClick={onSettings}>
            <Settings className="h-4 w-4" />
            Settings
            <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem destructive onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          Sign out
          <DropdownMenuShortcut>⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
