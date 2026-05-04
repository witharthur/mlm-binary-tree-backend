"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/lib/queries";
import { useAuthStore } from "@/store/auth-store";

export function ProtectedShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const meQuery = useMe();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace("/login");
    }
  }, [hasHydrated, router, token]);

  useEffect(() => {
    if (meQuery.data) setUser(meQuery.data);
  }, [meQuery.data, setUser]);

  useEffect(() => {
    if (meQuery.error && token) {
      logout();
      router.replace("/login");
    }
  }, [logout, meQuery.error, router, token]);

  if (!hasHydrated || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dashboard-mesh p-6">
        <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.06] p-6">
          <Skeleton className="mb-4 h-12 w-12" />
          <Skeleton className="mb-3 h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-mesh">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Topbar user={meQuery.data ?? user} />
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 lg:px-6 lg:pb-10"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
