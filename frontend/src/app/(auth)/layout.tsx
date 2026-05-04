import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-dashboard-mesh px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-acid-400">
              БАД + cosmetics fintech
            </p>
            <h2 className="mt-5 text-6xl font-black leading-[1.02] text-white">
              Build volume with a cleaner binary engine.
            </h2>
            <p className="mt-5 text-lg leading-8 text-zinc-300">
              Track wallet balance, PV strength, package upgrades, bonuses, and referral
              placement from one premium dashboard.
            </p>
          </div>
          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {["Wallet safety", "PV network", "Premium packs"].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/10 bg-white/[0.06] p-4 text-sm font-semibold text-white"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
        <section className="flex justify-center">{children}</section>
      </div>
    </main>
  );
}
