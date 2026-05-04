"use client";

import Image from "next/image";
import { CheckCircle2, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatPV } from "@/lib/utils";
import type { Package } from "@/types/api";

const packageMeta: Record<string, { image: string; tagline: string; accent: string }> = {
  START: {
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=80",
    tagline: "Daily essentials, starter PV, simple onboarding",
    accent: "from-acid-500/22"
  },
  BUSINESS: {
    image:
      "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=80",
    tagline: "Cosmetics plus supplements for active sellers",
    accent: "from-cyan-400/22"
  },
  VIP: {
    image:
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=80",
    tagline: "Premium wellness basket with accelerated PV",
    accent: "from-rosegold-500/24"
  },
  ELITE: {
    image:
      "https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?auto=format&fit=crop&w=900&q=80",
    tagline: "High-volume БАД and skincare leadership pack",
    accent: "from-mint-500/22"
  }
};

export function PackageCard({
  item,
  activePackageId,
  onPurchase,
  loading
}: {
  item: Package;
  activePackageId?: number | null;
  onPurchase: (item: Package) => void;
  loading?: boolean;
}) {
  const meta = packageMeta[item.name] ?? packageMeta.START;
  const isCurrent = activePackageId === item.id;
  const isUpgrade = activePackageId ? item.id > activePackageId : false;

  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={meta.image}
          alt={`${item.name} cosmetics and supplements package`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 25vw"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${meta.accent} via-ink-950/20 to-transparent`} />
        <div className="absolute left-4 top-4 rounded-lg bg-ink-950/80 px-3 py-2 text-xs font-black uppercase tracking-wide text-white backdrop-blur">
          {item.name}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-400">{meta.tagline}</p>
            <p className="mt-3 text-3xl font-black text-white">{formatCurrency(item.price)}</p>
          </div>
          {isCurrent ? (
            <div className="rounded-lg bg-emerald-400/15 p-2 text-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <Zap className="h-3.5 w-3.5 text-acid-400" />
              PV value
            </div>
            <p className="text-lg font-black text-white">{formatPV(item.pv_value)}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <ShoppingBag className="h-3.5 w-3.5 text-rosegold-400" />
              Category
            </div>
            <p className="text-lg font-black text-white">БАД + beauty</p>
          </div>
        </div>

        <Button
          className="mt-5 w-full"
          type="button"
          disabled={isCurrent || !item.is_active}
          isLoading={loading}
          onClick={() => onPurchase(item)}
        >
          {isCurrent ? "Active package" : isUpgrade ? "Upgrade" : "Buy"}
        </Button>
      </div>
    </Card>
  );
}
