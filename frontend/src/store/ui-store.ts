"use client";

import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface UIState {
  sidebarOpen: boolean;
  notifications: number;
  toasts: Toast[];
  setSidebarOpen: (open: boolean) => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearNotifications: () => void;
  pushNotification: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  notifications: 3,
  toasts: [],
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`
        }
      ],
      notifications: state.notifications + 1
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    })),
  clearNotifications: () => set({ notifications: 0 }),
  pushNotification: () => set((state) => ({ notifications: state.notifications + 1 }))
}));
