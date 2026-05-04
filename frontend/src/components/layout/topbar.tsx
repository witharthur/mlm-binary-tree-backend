"use client";

import { Bell, Copy, LogOut, Menu, QrCode, Search } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { getOrigin } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import type { User } from "@/types/api";

function ReferralButton({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);
  const addToast = useUIStore((state) => state.addToast);
  const leftLink = `${getOrigin()}/ref/${user?.id ?? "demo-user"}/L`;
  const rightLink = `${getOrigin()}/ref/${user?.id ?? "demo-user"}/R`;

  const copyLink = async (value: string, side: string) => {
    await navigator.clipboard.writeText(value);
    addToast({
      title: `${side} referral link copied`,
      description: "Ready to share with your next partner.",
      variant: "success"
    });
  };

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <QrCode className="h-4 w-4" />
        Referral
      </Button>
      <Modal open={open} title="Referral Links" onClose={() => setOpen(false)}>
        <div className="grid gap-4 md:grid-cols-[160px_1fr]">
          <div className="flex items-center justify-center rounded-lg bg-white p-4">
            <QRCodeSVG value={leftLink} size={132} />
          </div>
          <div className="space-y-3">
            {[
              ["Left branch", leftLink],
              ["Right branch", rightLink]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {label}
                </p>
                <div className="flex gap-2">
                  <Input readOnly value={value} className="text-xs" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    aria-label={`Copy ${label}`}
                    onClick={() => copyLink(value, label)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}

export function Topbar({ user }: { user: User | null }) {
  const logout = useAuthStore((state) => state.logout);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const notifications = useUIStore((state) => state.notifications);
  const clearNotifications = useUIStore((state) => state.clearNotifications);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/72 px-4 py-3 backdrop-blur-2xl lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-zinc-500 md:flex">
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate text-sm">Search orders, transactions, packages</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ReferralButton user={user} />
          <button
            type="button"
            onClick={clearNotifications}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-zinc-300 transition hover:bg-white/[0.1] hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notifications > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rosegold-500 px-1 text-[10px] font-black text-white">
                {notifications}
              </span>
            ) : null}
          </button>

          <div className="hidden items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] py-1.5 pl-2 pr-3 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-acid-500 text-xs font-black text-ink-950">
              {user?.username?.slice(0, 2).toUpperCase() ?? "BB"}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{user?.username ?? "Demo user"}</p>
              <p className="text-xs text-zinc-500">{user?.email ?? "demo@biobinary.app"}</p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Log out"
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
