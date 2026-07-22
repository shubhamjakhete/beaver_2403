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

/** PLC-style run accumulator: seconds → `D.HH:MM:SS` (e.g. 86.03:37:55). */
export function fmtRunDuration(
  seconds: number | null | undefined,
  fallback = "—"
): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return fallback;
  const total = Math.floor(seconds);
  const days = Math.floor(total / 86400);
  const rem = total % 86400;
  const hours = Math.floor(rem / 3600);
  const minutes = Math.floor((rem % 3600) / 60);
  const secs = rem % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${days}.${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}
