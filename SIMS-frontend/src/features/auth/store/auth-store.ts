import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { mockAuthService } from '../mock';

import type { AuthState, AuthActions } from '../types';
import type { AuthSession, AuthTokens, BaseUser } from '@/types';

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

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Global authentication store.
 *
 * Persisted fields: `user`, `tokens`, `isAuthenticated`, `rememberMe`.
 * Non-persisted: `isLoading`, `error` (ephemeral UI state).
 *
 * The store is wrapped in Redux DevTools (`devtools`) for debugging.
 * Session cookie management is handled by the mock/api service.
 *
 * Integration with real backend (Phase 4+):
 *   Replace `mockAuthService` calls in `logout` with `authApi.logout()`.
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ── Setters ─────────────────────────────────────────────────────────────

        setUser: (user: BaseUser) =>
          set({ user }, false, 'auth/setUser'),

        setTokens: (tokens: AuthTokens) =>
          set({ tokens }, false, 'auth/setTokens'),

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
         */
        login: (session: AuthSession, rememberMe: boolean) =>
          set(
            {
              user:            session.user,
              tokens:          session.tokens,
              isAuthenticated: true,
              isLoading:       false,
              rememberMe,
              error:           null,
            },
            false,
            'auth/login',
          ),

        /**
         * Full logout — clears the session cookie via API, then resets the store.
         */
        logout: async () => {
          set({ isLoading: true }, false, 'auth/logout/start');
          try {
            // Only call the service if we were authenticated
            if (get().isAuthenticated) {
              await mockAuthService.logout();
            }
          } finally {
            set({ ...initialState }, false, 'auth/logout/complete');
          }
        },

        /**
         * Clear local state only — used on 401 or when the session cookie is gone.
         * Does not call the server.
         */
        clearSession: () =>
          set({ ...initialState }, false, 'auth/clearSession'),

        /**
         * Update access + refresh tokens without modifying the user.
         * Called by the token-refresh interceptor.
         */
        refreshSession: (tokens: AuthTokens) =>
          set(
            { tokens, isAuthenticated: true },
            false,
            'auth/refreshSession',
          ),

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
        name: 'examsphere_auth',
        // Only persist session-relevant fields.
        // isLoading and error are ephemeral and should not survive a page reload.
        partialize: (state): Partial<AuthState> => ({
          user:            state.user,
          tokens:          state.tokens,
          isAuthenticated: state.isAuthenticated,
          rememberMe:      state.rememberMe,
        }),
      },
    ),
    { name: 'AuthStore' },
  ),
);
