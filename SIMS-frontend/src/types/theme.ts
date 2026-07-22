// ─── Theme Types ──────────────────────────────────────────────────────────────

/** The three supported colour modes. */
export type ThemeMode = 'light' | 'dark' | 'system';

/** A named colour token in the design system. */
export type ColorToken =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'destructive'
  | 'muted'
  | 'popover'
  | 'card'
  | 'background'
  | 'foreground'
  | 'border'
  | 'input'
  | 'ring';

/** Semantic intent used for badges, alerts, and status indicators. */
export type IntentVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

/** Standard component size tokens. */
export type SizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
