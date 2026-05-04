"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "@/types/api";

interface AuthState {
  token: string | null;
  user: User | null;
  hasHydrated: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hasHydrated: false,
      setToken: (token) => {
        if (typeof window !== "undefined") {
          if (token) {
            window.localStorage.setItem("mlm-auth-token", token);
          } else {
            window.localStorage.removeItem("mlm-auth-token");
          }
        }
        set({ token });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("mlm-auth-token");
        }
        set({ token: null, user: null });
      },
      setHasHydrated: (hasHydrated) => set({ hasHydrated })
    }),
    {
      name: "mlm-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state?.token && typeof window !== "undefined") {
          window.localStorage.setItem("mlm-auth-token", state.token);
        }
      }
    }
  )
);
