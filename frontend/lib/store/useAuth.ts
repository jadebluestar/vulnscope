"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authApi } from "@/lib/api";
import { AuthContext, User } from "@/lib/types";

interface AuthStore extends AuthContext {
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  hydrateSession: () => Promise<void>;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hydrated: false,

      setHydrated: (value) => set({ hydrated: value }),

      hydrateSession: async () => {
        if (get().hydrated) {
          return;
        }
        const sessionUser = await authApi.getSession();
        set({
          user: sessionUser,
          isAuthenticated: Boolean(sessionUser),
          hydrated: true,
        });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const user = await authApi.login(email, password);
          set({ user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        try {
          const user = await authApi.register(email, password, name);
          set({ user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        await authApi.logout();
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: "vulnscope-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }) satisfies Partial<AuthStore>,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<AuthStore>),
      }),
    }
  )
);

export const getCurrentUser = (): User | null => useAuth.getState().user;
