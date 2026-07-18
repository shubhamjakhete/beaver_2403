"use client";

import { useState } from "react";
import type { Period } from "@/lib/types";
import ChartCard from "@/components/ChartCard";
import PanelShell from "@/components/PanelShell";

const PERIODS: { value: Period; label: string }[] = [
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "1y", label: "1Y" },
];

const ROLLUP_PERIODS: Period[] = ["30d", "1y"];

const CHART_METRICS = [
  { sensor: "ph" as const, label: "pH", unit: "", decimals: 2 },
  { sensor: "tds" as const, label: "TDS", unit: "ppm", decimals: 0 },
  { sensor: "do_oxy" as const, label: "DO", unit: "mg/L", decimals: 1 },
  { sensor: "tank_level_1" as const, label: "Tank Level", unit: "%", decimals: 0 },
  { sensor: "flow_level" as const, label: "Flow Sensor", unit: "GPM", decimals: 0 },
  { sensor: "vfd_output_display" as const, label: "VFD Output", unit: "%", decimals: 0 },
  { sensor: "air_tank_pt1_psi" as const, label: "PT-1 · System Pressure", unit: "PSI", decimals: 1 },
  { sensor: "air_tank_pt2_psi" as const, label: "PT-2 · Compressor", unit: "PSI", decimals: 1 },
];

export default function TrendsPage() {
  const [period, setPeriod] = useState<Period>("24h");
  const isRollup = ROLLUP_PERIODS.includes(period);

  return (
    <>
      {/* Range tabs */}
      <PanelShell title="Trends" note="6 of 12 tracked tags shown">
        <div className="flex gap-[7px] flex-wrap">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className="font-grotesk text-[.72rem] font-semibold tracking-[.04em] rounded-[7px] px-4 py-[7px] border transition-all"
              style={
                period === value
                  ? {
                      color: "var(--accent)",
                      borderColor: "var(--accent)",
                      background: "var(--bg-panel-alt)",
                      boxShadow: "inset 0 0 0 1px var(--accent)",
                    }
                  : {
                      color: "var(--text-mid)",
                      borderColor: "var(--line)",
                      background: "var(--bg-panel-alt)",
                    }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </PanelShell>

      {/* Rollup disclaimer */}
      {isRollup && (
        <div
          className="text-[.68rem] rounded-[7px] px-3 py-2 flex items-center gap-2"
          style={{
            color: "var(--warn)",
            background: "rgba(255,182,72,.08)",
            border: "1px solid rgba(255,182,72,.3)",
          }}
        >
          <span>⚠️</span>
          <span>
            Illustrative aggregation — the daily/monthly rollup pipeline this view depends on
            isn&apos;t built yet. Real 30D/1Y data should come from pre-aggregated tables, not
            live queries over raw rows.
          </span>
        </div>
      )}

      {/* Chart grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[10px]">
        {CHART_METRICS.map((m) => (
          <ChartCard
            key={m.sensor}
            sensor={m.sensor}
            label={m.label}
            unit={m.unit}
            decimals={m.decimals}
            period={period}
          />
        ))}
      </div>
    </>
  );
}
