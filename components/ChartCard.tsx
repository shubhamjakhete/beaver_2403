"use client";

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
}

const ROLLUP_PERIODS: Period[] = ["30d", "1y"];

function formatTimestamp(ts: string, period: Period): string {
  const d = new Date(ts);
  if (period === "24h") return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (period === "7d") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (period === "30d") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export default function ChartCard({ sensor, label, unit, decimals = 1, period, yAxisTicks, yDomain, className, fillBody }: ChartCardProps) {
  const { data, isLoading } = useSensorHistory(sensor, period);
  const isRollup = ROLLUP_PERIODS.includes(period);

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

      {/* Chart */}
      <div className={fillBody ? "flex-1 min-h-0" : "h-[88px]"}>
        {isLoading && !chartData.length ? (
          <div className="h-full flex items-center justify-center text-[.65rem]" style={{ color: "var(--text-low)" }}>
            Loading…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="ts" hide />
              <YAxis
                hide={!yAxisTicks}
                domain={yDomain ?? ["auto", "auto"]}
                ticks={yAxisTicks}
                tick={{ fontSize: 9, fill: "var(--text-low)", fontFamily: "monospace" }}
                width={yAxisTicks ? 32 : 0}
                axisLine={false}
                tickLine={false}
              />
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
              {/* Threshold reference lines */}
              {t?.warnLow  != null && <ReferenceLine y={t.warnLow}  stroke="var(--warn)"  strokeDasharray="3 3" strokeWidth={1} />}
              {t?.warnHigh != null && <ReferenceLine y={t.warnHigh} stroke="var(--warn)"  strokeDasharray="3 3" strokeWidth={1} />}
              {t?.alarmLow  != null && <ReferenceLine y={t.alarmLow}  stroke="var(--alarm)" strokeDasharray="3 3" strokeWidth={1} />}
              {t?.alarmHigh != null && <ReferenceLine y={t.alarmHigh} stroke="var(--alarm)" strokeDasharray="3 3" strokeWidth={1} />}
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
        )}
      </div>

      {/* Footer */}
      <div className="text-[.62rem]" style={{ color: "var(--text-low)" }}>
        {period === "24h" && "15-min avg · 24h"}
        {period === "7d" && "1-hour avg · 7d"}
        {period === "30d" && "Daily avg · 30d"}
        {period === "1y" && "Monthly avg · 1y"}
      </div>
    </div>
  );
}
