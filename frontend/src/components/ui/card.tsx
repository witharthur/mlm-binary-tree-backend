import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("glass-panel rounded-lg p-5", className)}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  title,
  action,
  children
}: {
  className?: string;
  title: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={cn("mb-5 flex items-start justify-between gap-4", className)}>
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {children ? <div className="mt-1 text-sm text-zinc-400">{children}</div> : null}
      </div>
      {action}
    </div>
  );
}
