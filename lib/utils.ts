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

/** Parse API timestamps (naive Eastern or ISO) for display / age. */
function parseStamp(stamp: string | null | undefined): Date | null {
  if (!stamp) return null;
  const d = new Date(stamp);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Human age since last sample, e.g. "14h 12m" or "3m". */
export function fmtDataAge(stamp: string | null | undefined, nowMs = Date.now()): string {
  const d = parseStamp(stamp);
  if (!d) return "unknown duration";
  const sec = Math.max(0, Math.floor((nowMs - d.getTime()) / 1000));
  if (sec < 60) return `${sec}s`;
  const mins = Math.floor(sec / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remM = mins % 60;
  if (hours < 48) return remM ? `${hours}h ${remM}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return remH ? `${days}d ${remH}h` : `${days}d`;
}

/** Format last-sample stamp for operators (Eastern wall clock if naive). */
export function fmtEasternStamp(stamp: string | null | undefined): string | null {
  const d = parseStamp(stamp);
  if (!d) return null;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
