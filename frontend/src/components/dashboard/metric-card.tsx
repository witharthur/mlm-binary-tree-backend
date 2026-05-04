import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  trend,
  icon: Icon,
  tone = "acid"
}: {
  title: string;
  value: ReactNode;
  trend: string;
  icon: LucideIcon;
  tone?: "acid" | "mint" | "rose" | "cyan";
}) {
  const toneClass = {
    acid: "bg-acid-500 text-ink-950",
    mint: "bg-mint-500 text-ink-950",
    rose: "bg-rosegold-500 text-white",
    cyan: "bg-cyan-400 text-ink-950"
  }[tone];

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-white/[0.04]" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>
          <div className="mt-3 text-2xl font-black text-white">{value}</div>
          <p className="mt-2 text-sm font-semibold text-emerald-300">{trend}</p>
        </div>
        <div className={cn("rounded-lg p-3", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
