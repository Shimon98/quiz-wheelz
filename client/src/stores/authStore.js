import { create } from "zustand";
import { getCurrentUser, logoutUser } from "../api/authApi";

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
    } catch (error) {
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