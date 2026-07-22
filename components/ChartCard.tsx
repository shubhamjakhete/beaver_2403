"use client";

import { useEffect, useRef, useState } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { SensorKey, Period, HistoryPoint } from "@/lib/types";
import { useSensorHistory } from "@/lib/hooks";
import { thresholds } from "@/lib/thresholds";

interface ChartCardProps {
  sensor: SensorKey;
  label: string;
  unit: string;
  decimals?: number;
  period: Period;
  yAxisTicks?: number[];
  yDomain?: [number | string, number | string];
  /** Extra Tailwind classes applied to the outer card div (e.g. min-h-[280px]) */
  className?: string;
  /** When true the chart region grows to fill remaining card height instead of fixed 88px */
  fillBody?: boolean;
  /**
   * When true, render a full Y axis: axisLine + tickLine visible, domain auto-padded
   * ±20 around the data range so the trace fills the chart height instead of
   * being compressed against the top.  tickFormatter rounds to integers; ~4 ticks.
   * Takes precedence over yAxisTicks / yDomain.
   */
  showYAxis?: boolean;
}

type ThresholdConfig = {
  warnLow: number | null;
  alarmLow: number | null;
  warnHigh: number | null;
  alarmHigh: number | null;
};

type ThresholdTier = "warn" | "alarm";

type ThresholdLineSpec = {
  key: string;
  y: number;
  tier: ThresholdTier;
  label: string;
};

const ROLLUP_PERIODS: Period[] = ["30d", "1y"];
/** Drop a warn line when it sits within this many plot-pixels of a critical line. */
const NEAR_OVERLAP_PX = 6;

function formatTimestamp(ts: string, period: Period): string {
  const d = new Date(ts);
  if (period === "12h" || period === "24h") {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  if (period === "7d") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (period === "30d") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

/**
 * Pick which threshold ReferenceLines to draw for the current visible Y domain.
 * - Each configured setpoint yields at most one line (HIHI / HI / LO / LOLO).
 * - Lines outside the visible domain are omitted (domain is never padded for them).
 * - Identical y values keep the critical tier only.
 * - Warn + critical within ~NEAR_OVERLAP_PX keep critical only.
 */
function selectThresholdLines(
  t: ThresholdConfig,
  domainMin: number,
  domainMax: number,
  plotHeightPx: number,
): ThresholdLineSpec[] {
  const candidates: ThresholdLineSpec[] = [];
  if (t.warnLow != null) candidates.push({ key: "warnLow", y: t.warnLow, tier: "warn", label: `LO ${t.warnLow}` });
  if (t.alarmLow != null) candidates.push({ key: "alarmLow", y: t.alarmLow, tier: "alarm", label: `LOLO ${t.alarmLow}` });
  if (t.warnHigh != null) candidates.push({ key: "warnHigh", y: t.warnHigh, tier: "warn", label: `HI ${t.warnHigh}` });
  if (t.alarmHigh != null) candidates.push({ key: "alarmHigh", y: t.alarmHigh, tier: "alarm", label: `HIHI ${t.alarmHigh}` });

  // Visible domain only — do not extend the axis to fit far setpoints
  let visible = candidates.filter((c) => c.y >= domainMin && c.y <= domainMax);

  // Same y value from config → keep critical, warn once in dev
  const byY = new Map<number, ThresholdLineSpec[]>();
  for (const c of visible) {
    const group = byY.get(c.y) ?? [];
    group.push(c);
    byY.set(c.y, group);
  }
  visible = [];
  Array.from(byY.values()).forEach((group) => {
    if (group.length === 1) {
      visible.push(group[0]);
    } else {
      const alarm = group.find((g) => g.tier === "alarm");
      visible.push(alarm ?? group[0]);
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[ChartCard] duplicate threshold y values — keeping critical only:",
          group.map((g) => `${g.key}=${g.y}`).join(", "),
        );
      }
    }
  });

  // Near-overlap in pixels: prefer the tighter (critical) line
  const domainSpan = domainMax - domainMin;
  if (domainSpan > 0 && plotHeightPx > 0) {
    const pxPerUnit = plotHeightPx / domainSpan;
    const alarms = visible.filter((v) => v.tier === "alarm");
    visible = visible.filter((v) => {
      if (v.tier !== "warn") return true;
      return !alarms.some((a) => Math.abs(a.y - v.y) * pxPerUnit < NEAR_OVERLAP_PX);
    });
  }

  return visible;
}

/** Resolve the numeric Y domain used for filtering thresholds (mirrors the axis). */
function resolveDomain(
  values: number[],
  showYAxis: boolean | undefined,
  yDomain: [number | string, number | string] | undefined,
): { min: number; max: number } | null {
  if (!values.length) return null;

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);

  if (showYAxis) {
    return {
      min: Math.floor(dataMin - 20),
      max: Math.ceil(dataMax + 20),
    };
  }

  if (
    yDomain &&
    typeof yDomain[0] === "number" &&
    typeof yDomain[1] === "number"
  ) {
    return { min: yDomain[0], max: yDomain[1] };
  }

  // Auto domain = data extents only (no padding for setpoints)
  return { min: dataMin, max: dataMax };
}

export default function ChartCard({ sensor, label, unit, decimals = 1, period, yAxisTicks, yDomain, className, fillBody, showYAxis }: ChartCardProps) {
  const { data, isLoading } = useSensorHistory(sensor, period);
  const isRollup = ROLLUP_PERIODS.includes(period);

  const chartBodyRef = useRef<HTMLDivElement>(null);
  const [plotHeight, setPlotHeight] = useState(88);

  useEffect(() => {
    const el = chartBodyRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h > 0) setPlotHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pts: HistoryPoint[] = data?.data ?? [];

  // Compute stats from value/avg field
  const values = pts
    .map((p) => (isRollup ? (p.avg ?? p.value) : p.value))
    .filter((v): v is number => v != null);

  const current = values[values.length - 1] ?? null;
  const first = values[0] ?? null;
  const delta = current != null && first != null ? current - first : null;
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

  const deltaClass = delta == null ? "" : delta >= 0 ? "text-[var(--good)]" : "text-[var(--alarm)]";
  const deltaArrow = delta == null ? "" : delta >= 0 ? "▲" : "▼";

  // Threshold status for current value colour
  const t = sensor in thresholds ? thresholds[sensor as keyof typeof thresholds] : null;
  const isAlarm = current != null && t != null && (
    (t.alarmLow  != null && current < t.alarmLow)  ||
    (t.alarmHigh != null && current > t.alarmHigh)
  );
  const isWarn = !isAlarm && current != null && t != null && (
    (t.warnLow  != null && current < t.warnLow)  ||
    (t.warnHigh != null && current > t.warnHigh)
  );
  const currentColor = isAlarm ? "var(--alarm)" : isWarn ? "var(--warn)" : "var(--text-hi)";

  // Build chart data
  const chartData = pts.map((p) => ({
    ts: formatTimestamp(p.event_timestamp, period),
    value: isRollup ? (p.avg ?? p.value) : p.value,
    ...(isRollup ? { lo: p.min, hi: p.max } : {}),
  }));

  const fmtVal = (v: number | null | undefined) =>
    v == null ? "—" : v.toFixed(decimals);

  const domain = resolveDomain(values, showYAxis, yDomain);
  const thresholdLines =
    t != null && domain != null
      ? selectThresholdLines(t, domain.min, domain.max, plotHeight)
      : [];

  return (
    <div
      className={`rounded-[10px] p-[13px_15px_10px] flex flex-col gap-2${className ? ` ${className}` : ""}`}
      style={{ background: "var(--bg-panel)", border: "1px solid var(--line)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div
            className="font-grotesk text-[.72rem] font-semibold tracking-[.08em] uppercase"
            style={{ color: "#ffffff" }}
          >
            {label}
          </div>
          <div className="flex items-baseline gap-1 mt-[2px]">
            <span className="font-mono text-[1.15rem] font-semibold" style={{ color: currentColor }}>
              {fmtVal(current)}
              {unit && (
                <span className="text-[.62rem] ml-[3px] font-sans" style={{ color: "var(--text-mid)" }}>
                  {unit}
                </span>
              )}
            </span>
            {delta != null && (
              <span className={`text-[.66rem] font-sans ${deltaClass}`}>
                {deltaArrow} {Math.abs(delta).toFixed(decimals)}
              </span>
            )}
          </div>
        </div>

        {/* Min/Max/Avg */}
        <div className="flex gap-[10px] text-right">
          {([["MIN", min], ["MAX", max], ["AVG", avg]] as [string, number | null][]).map(
            ([stat, val]) => (
              <div key={stat} className="flex flex-col">
                <span className="text-[.56rem] tracking-[.06em]" style={{ color: "#ffffff" }}>
                  {stat}
                </span>
                <span className="font-mono text-[.7rem]" style={{ color: "#ffffff" }}>
                  {fmtVal(val)}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Chart — fillBody uses absolute fill so ResponsiveContainer always gets a
          real pixel height (percentage height fails when the parent only has
          min-height / flex-1, which is how the detail modal mounts). */}
      <div
        ref={chartBodyRef}
        className={fillBody ? "relative flex-1 min-h-[200px]" : "h-[88px]"}
      >
        {isLoading && !chartData.length ? (
          <div className="h-full flex items-center justify-center text-[.65rem]" style={{ color: "var(--text-low)" }}>
            Loading…
          </div>
        ) : (
          <div className={fillBody ? "absolute inset-0" : "h-full w-full"}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 2, right: showYAxis ? 60 : 0, left: showYAxis ? 4 : 0, bottom: 0 }}
            >
              <XAxis dataKey="ts" hide />
              {showYAxis ? (
                <YAxis
                  domain={[
                    (dataMin: number) => Math.floor(dataMin - 20),
                    (dataMax: number) => Math.ceil(dataMax + 20),
                  ]}
                  tickCount={4}
                  tickFormatter={(v: number) => Math.round(v).toString()}
                  tick={{ fontSize: 9, fill: "var(--text-low)", fontFamily: "monospace" }}
                  width={44}
                  axisLine={{ stroke: "var(--line)" }}
                  tickLine={{ stroke: "var(--line)" }}
                />
              ) : (
                <YAxis
                  hide={!yAxisTicks}
                  domain={yDomain ?? ["auto", "auto"]}
                  ticks={yAxisTicks}
                  tick={{ fontSize: 9, fill: "var(--text-low)", fontFamily: "monospace" }}
                  width={yAxisTicks ? 32 : 0}
                  axisLine={false}
                  tickLine={false}
                />
              )}
              <Tooltip
                contentStyle={{
                  background: "var(--bg-panel-alt)",
                  border: "1px solid var(--line)",
                  borderRadius: "6px",
                  fontSize: "0.7rem",
                  color: "var(--text-hi)",
                }}
                itemStyle={{ color: "var(--accent)" }}
                labelStyle={{ color: "var(--text-mid)" }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [typeof v === "number" ? v.toFixed(decimals) : v, ""]}
              />
              {isRollup && (
                <Area
                  type="basis"
                  dataKey="hi"
                  stroke="none"
                  fill="var(--accent-glow)"
                  fillOpacity={0.5}
                  isAnimationActive={false}
                />
              )}
              {isRollup && (
                <Area
                  type="basis"
                  dataKey="lo"
                  stroke="none"
                  fill="var(--bg-panel)"
                  fillOpacity={1}
                  isAnimationActive={false}
                />
              )}
              {/* Threshold lines — one per setpoint, decluttered (shared by all cards) */}
              {thresholdLines.map((line) => (
                <ReferenceLine
                  key={line.key}
                  y={line.y}
                  stroke={line.tier === "warn" ? "var(--warn)" : "var(--alarm)"}
                  strokeDasharray="3 5"
                  strokeWidth={1}
                  strokeOpacity={line.tier === "warn" ? 0.5 : 0.65}
                  ifOverflow="discard"
                  label={
                    showYAxis
                      ? {
                          value: line.label,
                          position: "right",
                          fill: line.tier === "warn" ? "var(--warn)" : "var(--alarm)",
                          fontSize: 10,
                          fontFamily: "monospace",
                        }
                      : undefined
                  }
                />
              ))}
              <Line
                type="basis"
                dataKey="value"
                stroke="var(--accent)"
                strokeWidth={1.8}
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-[.62rem]" style={{ color: "var(--text-low)" }}>
        {period === "12h" && "15-min avg · 12h"}
        {period === "24h" && "15-min avg · 24h"}
        {period === "7d" && "1-hour avg · 7d"}
        {period === "30d" && "Daily avg · 30d"}
        {period === "1y" && "Monthly avg · 1y"}
      </div>
    </div>
  );
}
