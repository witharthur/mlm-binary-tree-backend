import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-acid-400">
          BioBinary
        </p>
        <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{description}</p>
      </div>
      {action}
    </div>
  );
}
