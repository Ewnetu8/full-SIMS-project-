'use client';

import { usePathname } from 'next/navigation';
import * as React from 'react';

import { cn } from '@/lib';

import { Footer } from './footer';
import { MobileNav } from './mobile-nav';
import { Sidebar, type SidebarProps } from './sidebar';
import { TopNav, type TopNavProps } from './top-nav';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardLayoutProps {
  children:    React.ReactNode;
  sidebarProps?: Omit<SidebarProps, 'collapsed' | 'onCollapse'>;
  topNavProps?:  Omit<TopNavProps, 'onMenuOpen'>;
  /** Show footer at the bottom. Default: false */
  showFooter?:   boolean;
  className?:    string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * The primary authenticated dashboard layout:
 * - Collapsible desktop sidebar (left)
 * - Sticky top nav (top)
 * - Mobile drawer nav
 * - Main content area (right)
 *
 * @example
 * <DashboardLayout>
 *   <PageHeader title="Dashboard" />
 *   {children}
 * </DashboardLayout>
 */
export function DashboardLayout({
  children,
  sidebarProps,
  topNavProps,
  showFooter = false,
  className,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [collapsed,   setCollapsed]   = React.useState(false);
  const [mobileOpen, setMobileOpen]   = React.useState(false);

  // Automatically close mobile sidebar on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className={cn('flex h-screen overflow-hidden bg-background', className)}>
      {/* Desktop Sidebar */}
      <Sidebar
        {...sidebarProps}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="hidden lg:flex"
      />

      {/* Mobile Drawer */}
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        {...sidebarProps}
      />

      {/* Right panel */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopNav
          {...topNavProps}
          onMenuOpen={() => setMobileOpen(true)}
        />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>

        {showFooter && <Footer />}
      </div>
    </div>
  );
}
