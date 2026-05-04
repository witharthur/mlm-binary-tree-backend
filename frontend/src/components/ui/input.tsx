"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes
} from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-acid-400/70 focus:ring-2 focus:ring-acid-400/20",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-32 w-full resize-y rounded-lg border border-white/10 bg-white/[0.06] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-acid-400/70 focus:ring-2 focus:ring-acid-400/20",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";

export function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-zinc-200">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-zinc-500">{hint}</span> : null}
    </label>
  );
}
