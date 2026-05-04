"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-acid-500 text-ink-950 shadow-glow hover:bg-acid-400 focus-visible:ring-acid-400",
  secondary:
    "border border-white/10 bg-white/[0.07] text-white hover:bg-white/[0.11] focus-visible:ring-white/30",
  ghost: "text-zinc-300 hover:bg-white/[0.08] hover:text-white focus-visible:ring-white/25",
  danger:
    "bg-red-500/15 text-red-100 ring-1 ring-red-400/30 hover:bg-red-500/25 focus-visible:ring-red-300"
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 gap-2 px-3 text-sm",
  md: "h-11 gap-2.5 px-4 text-sm",
  lg: "h-12 gap-3 px-5 text-base",
  icon: "h-10 w-10 p-0"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-55",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
