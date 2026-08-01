import type { ThemeMode } from '@/types';

// ─── Theme Constants ──────────────────────────────────────────────────────────

export const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system'];

export const DEFAULT_THEME: ThemeMode = 'light';

export const THEME_STORAGE_KEY = 'examsphere-theme';

export const THEME_LABELS: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};
