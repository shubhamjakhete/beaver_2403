"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import type { Period, SensorKey } from "@/lib/types";
import ChartCard from "@/components/ChartCard";

const PERIODS: { value: Period; label: string }[] = [
  { value: "12h", label: "12H" },
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "1y", label: "1Y" },
];

export interface SensorDetailModalProps {
  open: boolean;
  onClose: () => void;
  /** Sensor key — same prop shape ORP/TDS/DO can reuse later */
  sensor: SensorKey;
  label: string;
  unit: string;
  decimals?: number;
  yDomain?: [number | string, number | string];
  yAxisTicks?: number[];
  /** Element that opened the dialog — receives focus on close */
  returnFocusRef?: RefObject<HTMLElement | null>;
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
  );
}

export default function SensorDetailModal({
  open,
  onClose,
  sensor,
  label,
  unit,
  decimals = 1,
  yDomain,
  yAxisTicks,
  returnFocusRef,
}: SensorDetailModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [period, setPeriod] = useState<Period>("24h");

  // Reset period when opening a fresh session for a sensor
  useEffect(() => {
    if (open) setPeriod("24h");
  }, [open, sensor]);

  // Focus close button on open; restore trigger focus on close
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trigger = returnFocusRef?.current ?? null;
    // Defer so the dialog is in the DOM
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      trigger?.focus();
    };
  }, [open, returnFocusRef]);

  // Escape + focus trap
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = getFocusable(dialogRef.current);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !dialogRef.current.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{
        background: "rgba(3,7,14,.72)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[760px] rounded-2xl p-5 sm:p-[20px_24px_22px] flex flex-col gap-3"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--line)",
          boxShadow: "0 24px 64px rgba(0,0,0,.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div
            id={titleId}
            className="font-grotesk text-[.74rem] font-semibold tracking-[.16em] uppercase flex items-center"
            style={{ color: "var(--text-hi)" }}
          >
            <span
              className="inline-block w-[3px] h-[11px] mr-2.5 rounded-[1px]"
              style={{ background: "var(--accent)" }}
              aria-hidden
            />
            {label} · Detailed Trend
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            aria-label={`Close ${label} detail`}
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-[8px] text-[16px] leading-none flex items-center justify-center transition-colors"
            style={{
              background: "none",
              border: "1px solid var(--line)",
              color: "var(--text-mid)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--text-hi)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--line)";
              e.currentTarget.style.color = "var(--text-mid)";
            }}
          >
            ✕
          </button>
        </div>

        {/* Period chips — same set as Trends page */}
        <div className="flex gap-2 flex-wrap">
          {PERIODS.map(({ value, label: chipLabel }) => {
            const active = period === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className="font-mono text-[.68rem] font-bold tracking-[.1em] rounded-[7px] px-[11px] py-[5px] border transition-colors"
                style={
                  active
                    ? {
                        color: "var(--text-hi)",
                        borderColor: "var(--accent)",
                        background: "var(--bg-deep)",
                      }
                    : {
                        color: "var(--text-mid)",
                        borderColor: "var(--line)",
                        background: "var(--bg-deep)",
                      }
                }
              >
                {chipLabel}
              </button>
            );
          })}
        </div>

        {/* Same ChartCard used on Trends — larger body for the overlay */}
        <ChartCard
          sensor={sensor}
          label={label}
          unit={unit}
          decimals={decimals}
          period={period}
          yDomain={yDomain}
          yAxisTicks={yAxisTicks}
          className="h-[380px]"
          fillBody
        />
      </div>
    </div>
  );
}
