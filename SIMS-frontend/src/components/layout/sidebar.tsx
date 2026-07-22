'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, GraduationCap, BookOpen, Brain, Users,
  ClipboardCheck, ChartColumn, FileText, Settings,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { Tooltip } from '@/components/ui';
import { cn } from '@/lib';

// ─── Nav Item Config ──────────────────────────────────────────────────────────

export interface NavItem {
  label:   string;
  href:    string;
  icon:    React.ReactNode;
  badge?:  string | number;
  /** Only show if user has one of these roles */
  roles?:  string[];
}

// ─── Default nav items (shared across roles) ─────────────────────────────────

export const defaultNavItems: NavItem[] = [
  { label: 'Dashboard',  href: '/dashboard',  icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Exams',      href: '/exams',       icon: <ClipboardCheck  className="h-4 w-4" /> },
  { label: 'Grades',     href: '/grades',      icon: <GraduationCap   className="h-4 w-4" /> },
  { label: 'Courses',    href: '/courses',     icon: <BookOpen        className="h-4 w-4" /> },
  { label: 'Analytics',  href: '/analytics',   icon: <ChartColumn     className="h-4 w-4" /> },
  { label: 'AI Insights',href: '/ai',          icon: <Brain           className="h-4 w-4" /> },
  { label: 'Users',      href: '/users',       icon: <Users           className="h-4 w-4" />, roles: ['admin'] },
  { label: 'Reports',    href: '/reports',     icon: <FileText        className="h-4 w-4" /> },
  { label: 'Settings',   href: '/settings',    icon: <Settings        className="h-4 w-4" /> },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  navItems?:   NavItem[];
  collapsed?:  boolean;
  onCollapse?: (v: boolean) => void;
  className?:  string;
  logo?:       React.ReactNode;
  footer?:     React.ReactNode;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

/**
 * Collapsible sidebar navigation.
 *
 * @example
 * <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
 */
export function Sidebar({
  navItems = defaultNavItems,
  collapsed = false,
  onCollapse,
  className,
  logo,
  footer,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={cn(
        'relative flex flex-col border-r border-sidebar-border bg-sidebar h-full',
        'overflow-hidden shrink-0',
        className,
      )}
      aria-label="Sidebar navigation"
    >
      {/* Logo / Brand */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4 shrink-0">
        {logo ?? (
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-ai-primary text-white text-sm font-bold shadow-sm">
              E
            </span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  key="brand"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-semibold text-sidebar-foreground text-sm overflow-hidden whitespace-nowrap"
                >
                  ExamSphere
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5 scrollbar-hide">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Footer slot */}
      {footer && (
        <div className="border-t border-sidebar-border p-2 shrink-0">
          {footer}
        </div>
      )}

      {/* Collapse toggle */}
      {onCollapse && (
        <button
          type="button"
          onClick={() => onCollapse(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'absolute -right-3 top-16 z-10',
            'flex h-6 w-6 items-center justify-center rounded-full',
            'border border-sidebar-border bg-sidebar shadow-sm',
            'text-sidebar-muted hover:text-sidebar-foreground',
            'transition-colors duration-200',
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      )}
    </motion.aside>
  );
}

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

interface SidebarNavItemProps {
  item:      NavItem;
  isActive:  boolean;
  collapsed: boolean;
}

function SidebarNavItem({ item, isActive, collapsed }: SidebarNavItemProps) {
  const link = (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-2 py-2 text-sm',
        'transition-all duration-200 relative',
        isActive
          ? 'bg-sidebar-primary text-white font-medium shadow-sm'
          : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="shrink-0 flex items-center">{item.icon}</span>
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            key="label"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 truncate overflow-hidden whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {!collapsed && item.badge !== undefined && (
        <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary">
          {item.badge}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip content={item.label} side="right">
        {link}
      </Tooltip>
    );
  }

  return link;
}
