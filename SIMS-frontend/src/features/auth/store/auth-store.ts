import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

import { authApi } from '../services';
import { parseJwtExp } from '../utils';

import { toast } from '@/components/feedback';

import type { AuthState, AuthActions } from '../types';
import type { AuthSession, AuthTokens, BaseUser } from '@/types';
import type { StateStorage } from 'zustand/middleware';

// ─── Store Type ───────────────────────────────────────────────────────────────

type AuthStore = AuthState & AuthActions;

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user:            null,
  tokens:          null,
  isAuthenticated: false,
  isLoading:       false,
  rememberMe:      false,
  error:           null,
};

// ─── Remember Me Storage Adapter ──────────────────────────────────────────────

/**
 * Zustand persist key — the main data blob.
 * A tiny helper flag (`REMEMBER_FLAG_KEY`) stored in localStorage tells us
 * whether the session data lives in localStorage or sessionStorage.
 */
const STORAGE_KEY   = 'examsphere_auth';
const REMEMBER_FLAG = 'examsphere_auth_remember';

/**
 * Returns true when the last login used "Remember Me".
 * The flag itself is always in localStorage (it is a single boolean,
 * never contains sensitive data, and must survive browser close so
 * we know where to look for session data on the next visit).
 */
function isRemembered(): boolean {
  try {
    return localStorage.getItem(REMEMBER_FLAG) === 'true';
  } catch {
    return false;
  }
}

/**
 * Persists or clears the remember-me flag.
 */
function setRememberFlag(value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(REMEMBER_FLAG, 'true');
    } else {
      localStorage.removeItem(REMEMBER_FLAG);
    }
  } catch {
    // SSR or storage unavailable — silently ignore.
  }
}

/**
 * Removes session data from **both** storages + the flag.
 * Called on logout / clearSession to guarantee a clean slate.
 */
function purgeAllStorages(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REMEMBER_FLAG);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // SSR or storage unavailable.
  }
}

/**
 * Custom StateStorage for Zustand `persist`.
 *
 * - `getItem`: tries the "active" storage first (based on `REMEMBER_FLAG`),
 *   then falls back to the other. This covers the edge case where the flag
 *   was updated but data hasn't migrated yet.
 * - `setItem`: writes to the active storage and removes from the other.
 * - `removeItem`: clears both storages + the flag.
 */
const rememberMeStorage: StateStorage = {
  getItem(name: string): string | null {
    try {
      const primary   = isRemembered() ? localStorage : sessionStorage;
      const secondary = isRemembered() ? sessionStorage : localStorage;
      return primary.getItem(name) ?? secondary.getItem(name);
    } catch {
      return null;
    }
  },

  setItem(name: string, value: string): void {
    try {
      const target  = isRemembered() ? localStorage : sessionStorage;
      const other   = isRemembered() ? sessionStorage : localStorage;
      target.setItem(name, value);
      other.removeItem(name);
    } catch {
      // SSR or storage unavailable.
    }
  },

  removeItem(name: string): void {
    purgeAllStorages();
  },
};

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Global authentication store.
 *
 * Persisted fields: `user`, `tokens`, `isAuthenticated`, `rememberMe`.
 * Non-persisted: `isLoading`, `error` (ephemeral UI state).
 *
 * When `rememberMe` is **true** the data is stored in `localStorage`
 * (survives browser close). When **false** it goes into `sessionStorage`
 * (cleared when the browser tab/window is closed).
 *
 * The store is wrapped in Redux DevTools (`devtools`) for debugging.
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ── Setters ─────────────────────────────────────────────────────────────

        setUser: (user: BaseUser) =>
          set({ user }, false, 'auth/setUser'),

        setTokens: (tokens: AuthTokens) => {
          const jwtExp = parseJwtExp(tokens.accessToken);
          const expiresAt = tokens.expiresAt || jwtExp || (Date.now() + 15 * 60 * 1000);
          set(
            {
              tokens: {
                accessToken: tokens.accessToken,
                expiresAt,
              },
            },
            false,
            'auth/setTokens',
          );
        },

        setRememberMe: (rememberMe: boolean) =>
          set({ rememberMe }, false, 'auth/setRememberMe'),

        setLoading: (isLoading: boolean) =>
          set({ isLoading }, false, 'auth/setLoading'),

        setError: (error: string | null) =>
          set({ error }, false, 'auth/setError'),

        // ── Session Actions ──────────────────────────────────────────────────────

        /**
         * Called after a successful login response.
         * Stores user + tokens and marks the session as authenticated.
         *
         * Sets the remember-me flag **before** updating state so that when
         * Zustand's persist middleware serialises the new state it writes
         * to the correct storage (localStorage or sessionStorage).
         */
        login: (session: AuthSession, rememberMe: boolean) => {
          // 1. Update the flag so the custom storage adapter knows where to write.
          setRememberFlag(rememberMe);

          const jwtExp = parseJwtExp(session.tokens.accessToken);
          const expiresAt = session.tokens.expiresAt || jwtExp || (Date.now() + 15 * 60 * 1000);

          // 2. Update the store state — persist middleware will call setItem
          //    which now targets the correct storage.
          set(
            {
              user: session.user,
              tokens: {
                accessToken: session.tokens.accessToken,
                expiresAt,
              },
              isAuthenticated: true,
              isLoading: false,
              rememberMe,
              error: null,
            },
            false,
            'auth/login',
          );
        },

        /**
         * Full logout — clears authentication via backend API, then resets the store.
         */
        logout: async () => {
          set({ isLoading: true }, false, 'auth/logout/start');
          try {
            // Only call the service if we were authenticated
            if (get().isAuthenticated) {
              await authApi.logout();
            }
          } catch (e) {
            console.warn('Logout request error:', e);
          } finally {
            purgeAllStorages();
            set({ ...initialState }, false, 'auth/logout/complete');
          }
        },

        /**
         * Clear local state only — used on 401 or when credentials expire.
         * Does not call the server.
         */
        clearSession: () => {
          purgeAllStorages();
          set({ ...initialState }, false, 'auth/clearSession');
        },

        /**
         * Update access token without modifying the user.
         * Called by the token-refresh interceptor.
         */
        refreshSession: (tokens: AuthTokens) => {
          const jwtExp = parseJwtExp(tokens.accessToken);
          const expiresAt = tokens.expiresAt || jwtExp || (Date.now() + 15 * 60 * 1000);
          set(
            {
              tokens: {
                accessToken: tokens.accessToken,
                expiresAt,
              },
              isAuthenticated: true,
            },
            false,
            'auth/refreshSession',
          );
        },

        initializeAuth: async () => {
          set({ isLoading: true }, false, 'auth/initialize/start');

          const state = get();
          const token = state.tokens?.accessToken;
          const user = state.user;
          const jwtExp = token ? parseJwtExp(token) : null;
          const expiresAt = jwtExp || state.tokens?.expiresAt || 0;

          // CASE 1 — Valid access token exists and not expired
          if (token && user && Date.now() < expiresAt) {
            set(
              {
                user,
                tokens: {
                  accessToken: token,
                  expiresAt,
                },
                isAuthenticated: true,
                isLoading: false,
              },
              false,
              'auth/initialize/valid-session',
            );
            return;
          }

          // CASE 4 — No persisted session
          if (!token && !user) {
            set({ isAuthenticated: false, isLoading: false }, false, 'auth/initialize/no-session');
            return;
          }

          // CASE 2 — Access token expired: attempt refresh
          try {
            const res = await authApi.refreshToken();
            const newAccessToken = res.tokens?.accessToken || '';

            if (newAccessToken) {
              const newExp = parseJwtExp(newAccessToken) || (Date.now() + 15 * 60 * 1000);
              let currentUser = get().user;
              if (!currentUser) {
                try {
                  const meRes = await authApi.getMe();
                  currentUser = meRes.user;
                } catch {
                  // If getMe fails, continue with existing user or default
                }
              }

              set(
                {
                  user: currentUser || get().user,
                  tokens: {
                    accessToken: newAccessToken,
                    expiresAt: newExp,
                  },
                  isAuthenticated: true,
                  isLoading: false,
                },
                false,
                'auth/initialize/refreshed',
              );
              return;
            }

            // If refresh succeeded without access token, clear session cleanly
            get().clearSession();
          } catch (error: any) {
            // CASE 3 — Refresh fails (401, 403 CSRF, etc.): cleanly clear local session without crashing
            get().clearSession();
          } finally {
            set({ isLoading: false }, false, 'auth/initialize/complete');
          }
        },

        /**
         * Update the current user's profile data without resetting the session.
         */
        updateProfile: (user: BaseUser) =>
          set(
            { user, isAuthenticated: true },
            false,
            'auth/updateProfile',
          ),
      }),
      {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => rememberMeStorage),
        // Only persist session-relevant fields.
        // isLoading and error are ephemeral and should not survive a page reload.
        partialize: (state): Partial<AuthState> => ({
          user: state.user,
          tokens: state.tokens
            ? {
                accessToken: state.tokens.accessToken,
                expiresAt: state.tokens.expiresAt,
              }
            : null,
          isAuthenticated: state.isAuthenticated,
          rememberMe: state.rememberMe,
        }),
      },
    ),
    { name: 'AuthStore' },
  ),
);
