import { create } from "zustand";
import { getCurrentUser, logoutUser } from "../api/authApi";
import { normalizeApiError } from "../errors/normalizeApiError";
import { isTransientError } from "../errors/errorChecks";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  hasCheckedCurrentUser: false,
  error: null,

  setUser: (user) =>
      set({
        user,
        isAuthenticated: Boolean(user),
        hasCheckedCurrentUser: true,
        error: null,
      }),

  clearUser: () =>
      set({
        user: null,
        isAuthenticated: false,
        hasCheckedCurrentUser: true,
        error: null,
      }),

  loadCurrentUser: async () => {
    set({ isLoading: true, error: null });

    try {
      const user = await getCurrentUser();

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        hasCheckedCurrentUser: true,
        error: null,
      });

      return user;
    } catch (rawError) {
      const error = normalizeApiError(rawError);

      // A network blip or a 5xx is NOT a logout — keep whatever auth state
      // we already had and surface the transient failure instead.
      if (isTransientError(error)) {
        set({ isLoading: false, hasCheckedCurrentUser: true, error });

        return null;
      }

      // Genuinely no valid teacher session (guest /me probe, expired or
      // invalid token, inactive account) — clear.
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        hasCheckedCurrentUser: true,
        error: null,
      });

      return null;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      await logoutUser();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        hasCheckedCurrentUser: true,
        error: null,
      });
    }
  },
}));
