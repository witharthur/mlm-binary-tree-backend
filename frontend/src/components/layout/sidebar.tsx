"use client";

import {
  Boxes,
  CircleDollarSign,
  CreditCard,
  Gift,
  LayoutDashboard,
  Network,
  PackageCheck,
  ReceiptText,
  WalletCards,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Packages", icon: Boxes },
  { href: "/wallet", label: "Wallet", icon: WalletCards },
  { href: "/tree", label: "MLM Tree", icon: Network },
  { href: "/orders", label: "Orders", icon: PackageCheck },
  { href: "/bonuses", label: "Bonuses", icon: Gift },
  { href: "/withdrawals", label: "Withdrawals", icon: CreditCard }
];

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-ink-950/92 p-4 backdrop-blur-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="mb-8 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-acid-500 text-ink-950 shadow-glow">
                <CircleDollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-black tracking-wide text-white">BioBinary</p>
                <p className="text-xs font-medium text-zinc-500">commerce network</p>
              </div>
            </Link>
            <Button
              className="lg:hidden"
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition",
                    active
                      ? "bg-acid-500 text-ink-950 shadow-glow"
                      : "text-zinc-400 hover:bg-white/[0.07] hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.05] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <ReceiptText className="h-4 w-4 text-acid-400" />
              Binary safety
            </div>
            <p className="text-sm leading-6 text-zinc-400">
              All wallet actions use idempotency keys and visible transaction states.
            </p>
          </div>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
    </>
  );
}
