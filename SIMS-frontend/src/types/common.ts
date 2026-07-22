// ─── Common / Shared Types ────────────────────────────────────────────────────

/** Generic option used in dropdowns and select menus. */
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

/** A key-value record with string values, useful for query params. */
export type StringRecord = Record<string, string>;

/** Represents a node with nested children (e.g. navigation trees). */
export interface TreeNode<T = unknown> {
  id: string;
  label: string;
  data?: T;
  children?: TreeNode<T>[];
}

/** Generic status for any async operation. */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/** Nullable wrapper — a value that is either T or null. */
export type Nullable<T> = T | null;

/** Optionally defined wrapper. */
export type Maybe<T> = T | null | undefined;

/** An object with an id field. */
export interface WithId {
  id: string;
}

/** Timestamp fields added to persisted entities. */
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

/** Entity with id + timestamps — a base for all domain entities. */
export type Entity = WithId & Timestamps;
