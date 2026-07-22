import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/constants';

import type { ThemeMode } from '@/types';

// ─── UI Store — State & Actions ───────────────────────────────────────────────

interface UiState {
  // ── Sidebar ──────────────────────────────────────────────────────────────────
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // ── Theme preference (controlled by next-themes; stored here for sync) ───────
  themePreference: ThemeMode;

  // ── Global loading overlay ────────────────────────────────────────────────────
  globalLoading: boolean;

  // ── Toast / notification queue size ──────────────────────────────────────────
  toastCount: number;
}

interface UiActions {
  // Sidebar
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;

  // Theme
  setThemePreference: (theme: ThemeMode) => void;

  // Global loading
  setGlobalLoading: (loading: boolean) => void;

  // Toast
  incrementToastCount: () => void;
  decrementToastCount: () => void;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: UiState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  themePreference: DEFAULT_THEME,
  globalLoading: false,
  toastCount: 0,
};

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Global UI store — manages sidebar state, theme preference, and loading states.
 *
 * Persisted to localStorage under `ui-store` key.
 * Wrapped in `devtools` for Redux DevTools support in development.
 */
export const useUiStore = create<UiState & UiActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // ── Sidebar actions ─────────────────────────────────────────────────────
        openSidebar: () => set({ sidebarOpen: true }, false, 'ui/openSidebar'),
        closeSidebar: () => set({ sidebarOpen: false }, false, 'ui/closeSidebar'),
        toggleSidebar: () =>
          set((s) => ({ sidebarOpen: !s.sidebarOpen }), false, 'ui/toggleSidebar'),
        setSidebarCollapsed: (collapsed) =>
          set({ sidebarCollapsed: collapsed }, false, 'ui/setSidebarCollapsed'),
        toggleSidebarCollapsed: () =>
          set(
            (s) => ({ sidebarCollapsed: !s.sidebarCollapsed }),
            false,
            'ui/toggleSidebarCollapsed',
          ),

        // ── Theme actions ───────────────────────────────────────────────────────
        setThemePreference: (theme) =>
          set({ themePreference: theme }, false, 'ui/setThemePreference'),

        // ── Global loading actions ──────────────────────────────────────────────
        setGlobalLoading: (loading) =>
          set({ globalLoading: loading }, false, 'ui/setGlobalLoading'),

        // ── Toast actions ───────────────────────────────────────────────────────
        incrementToastCount: () =>
          set((s) => ({ toastCount: s.toastCount + 1 }), false, 'ui/incrementToast'),
        decrementToastCount: () =>
          set(
            (s) => ({ toastCount: Math.max(0, s.toastCount - 1) }),
            false,
            'ui/decrementToast',
          ),
      }),
      {
        name: THEME_STORAGE_KEY,
        // Only persist theme preference and sidebar state
        partialize: (state) => ({
          themePreference: state.themePreference,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      },
    ),
    { name: 'UiStore' },
  ),
);
