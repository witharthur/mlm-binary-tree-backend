import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const toneStyles = {
  green: "bg-emerald-400/12 text-emerald-200 ring-emerald-300/25",
  yellow: "bg-yellow-400/12 text-yellow-100 ring-yellow-300/25",
  red: "bg-red-400/12 text-red-100 ring-red-300/25",
  blue: "bg-cyan-400/12 text-cyan-100 ring-cyan-300/25",
  gray: "bg-white/[0.07] text-zinc-300 ring-white/10",
  acid: "bg-acid-500/15 text-acid-400 ring-acid-400/25"
};

export function Badge({
  children,
  tone = "gray",
  className
}: {
  children: ReactNode;
  tone?: keyof typeof toneStyles;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1",
        toneStyles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): keyof typeof toneStyles {
  const normalized = status.toUpperCase();
  if (["COMPLETED", "APPROVED", "ACTIVE"].includes(normalized)) return "green";
  if (["PENDING", "PROCESSING"].includes(normalized)) return "yellow";
  if (["REJECTED", "CANCELLED", "FAILED"].includes(normalized)) return "red";
  return "gray";
}
