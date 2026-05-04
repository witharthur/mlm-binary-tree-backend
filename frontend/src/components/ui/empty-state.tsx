import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-white/12 bg-white/[0.03] p-8 text-center">
      <div className="mb-4 rounded-full bg-white/[0.07] p-3 text-acid-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-400">{description}</p>
    </div>
  );
}
