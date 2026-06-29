import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function fmt(
  value: number | null | undefined,
  decimals = 0,
  fallback = "—"
): string {
  if (value == null) return fallback;
  return value.toFixed(decimals);
}

export function fmtSigned(value: number | null | undefined, decimals = 0): string {
  if (value == null) return "—";
  return (value >= 0 ? "+" : "") + value.toFixed(decimals);
}
