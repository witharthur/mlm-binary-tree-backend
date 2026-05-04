"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useUIStore, type ToastVariant } from "@/store/ui-store";
import { cn } from "@/lib/utils";

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle
} satisfies Record<ToastVariant, typeof CheckCircle2>;

const toneMap = {
  success: "border-emerald-300/25 bg-emerald-500/12 text-emerald-100",
  error: "border-red-300/25 bg-red-500/12 text-red-100",
  info: "border-cyan-300/25 bg-cyan-500/12 text-cyan-100",
  warning: "border-yellow-300/25 bg-yellow-500/12 text-yellow-100"
} satisfies Record<ToastVariant, string>;

function ToastItem({
  id,
  title,
  description,
  variant
}: {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}) {
  const removeToast = useUIStore((state) => state.removeToast);
  const Icon = iconMap[variant];

  useEffect(() => {
    const timeout = window.setTimeout(() => removeToast(id), 4500);
    return () => window.clearTimeout(timeout);
  }, [id, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      className={cn(
        "w-full rounded-lg border p-4 shadow-panel backdrop-blur-xl",
        toneMap[variant]
      )}
    >
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          {description ? <p className="mt-1 text-sm opacity-80">{description}</p> : null}
        </div>
        <button
          type="button"
          aria-label="Dismiss toast"
          className="rounded-md p-1 opacity-70 transition hover:bg-white/10 hover:opacity-100"
          onClick={() => removeToast(id)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function ToastViewport() {
  const toasts = useUIStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div className="pointer-events-auto" key={toast.id}>
            <ToastItem {...toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
