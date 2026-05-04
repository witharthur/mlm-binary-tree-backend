import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(toNumber(value));
}

export function formatPV(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(toNumber(value));
}

export function shortId(value?: string | null) {
  if (!value) return "N/A";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function makeIdempotencyKey(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function normalizeStatus(status: string) {
  return status.toLowerCase().replace(/_/g, " ");
}
