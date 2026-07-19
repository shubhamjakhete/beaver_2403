"use client";

import { useDashboard, useIsLive } from "@/lib/hooks";
import StatusStrip from "@/components/StatusStrip";
import PanelShell from "@/components/PanelShell";
import RadialGauge from "@/components/RadialGauge";
import LcdCard from "@/components/LcdCard";
import TankCapsule from "@/components/TankCapsule";
import ChartCard from "@/components/ChartCard";
import { fmt, fmtSigned } from "@/lib/utils";

// Narrow-typed helper: compute min/max/avg from a nullable number series
function seriesStats(series: (number | null)[]): { min: number | null; max: number | null; avg: number | null } {
  const vals = series.filter((v): v is number => v != null);
  if (!vals.length) return { min: null, max: null, avg: null };
  return {
    min: Math.min(...vals),
    max: Math.max(...vals),
    avg: vals.reduce((a, b) => a + b, 0) / vals.length,
  };
}

export default function OverviewPage() {
  const { data, isError } = useDashboard();
  const row = data?.latest;
  const isLive = useIsLive(data?.is_live);

  // 24h stats for Process Tank bento card — derived from bundled series, no extra fetch
  const tankStats = seriesStats(data?.series?.tank_level_2 ?? []);
  const fmtStat = (v: number | null) => (v == null ? "—" : Math.round(v).toString());

  return (
    <>
      <StatusStrip isLive={isLive} />

      {isError && (
        <div
          className="text-[.75rem] rounded-[8px] px-3 py-2"
          style={{ background: "rgba(255,84,104,.08)", border: "1px solid rgba(255,84,104,.3)", color: "var(--alarm)" }}
        >
          Unable to reach API — showing last cached values.
        </div>
      )}

      {/* Top 3-panel grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[10px]">

        {/* 1. Pressure — each gauge independently scaled */}
        <PanelShell title="Pressure">
          <div className="flex justify-between gap-[6px]">
            <RadialGauge
              value={row?.air_tank_pt1_psi ?? null}
              min={0}
              max={50}
              unit="PSI"
              label="PT‑1"
              sublabel="System Pressure"
            />
            <RadialGauge
              value={row?.air_tank_pt2_psi ?? null}
              min={0}
              max={150}
              unit="PSI"
              label="PT‑2"
              sublabel="Compressor"
            />
            <RadialGauge
              value={row?.air_tank_pt3_psi ?? null}
              min={0}
              max={10}
              unit="PSI"
              label="PT‑3"
              sublabel="Chem. Inj. Pr."
            />
          </div>
        </PanelShell>

        {/* 2. Water Quality — cyan LCD readouts */}
        <PanelShell title="Water Quality">
          <div className="grid grid-cols-2 gap-2 flex-1">
            <LcdCard
              label="pH"
              value={row?.ph != null ? row.ph.toFixed(2) : null}
              variant="accent"
              labelColor="#ffffff"
            />
            <LcdCard
              label="ORP"
              value={row?.orp != null ? fmtSigned(row.orp, 0) : null}
              unit="mV"
              variant="accent"
            />
            <LcdCard
              label="TDS"
              value={row?.tds != null ? fmt(row.tds, 0) : null}
              unit="ppm"
              variant="accent"
            />
            <LcdCard
              label="DO"
              value={row?.do_oxy != null ? fmt(row.do_oxy, 1) : null}
              unit="mg/L"
              variant="accent"
            />
          </div>
        </PanelShell>

        {/* 3. Process Readouts — green LCD readouts */}
        <PanelShell title="Process Readouts">
          {/* flex-1 fillers above/below center the 2-card row vertically while
              preserving the panel's original height (Effluent Tank Level and
              Efficiency were removed, but the panel must stay the same size) */}
          <div className="flex flex-col flex-1">
            <div className="flex-1" aria-hidden="true" />
            <div className="grid grid-cols-2 gap-2">
              <LcdCard
                label="Flow Sensor"
                value={row?.flow_level != null ? fmt(row.flow_level, 0) : null}
                unit="GPM"
                variant="good"
              />
              <LcdCard
                label="VFD Output"
                value={row?.vfd_output_display != null ? fmt(row.vfd_output_display, 0) : null}
                unit="%"
                variant="good"
              />
            </div>
            <div className="flex-1" aria-hidden="true" />
          </div>
        </PanelShell>
      </div>

      {/* Tank Levels — three equal bento cards */}
      <PanelShell title="Tank Levels">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Card 1: Process Tank */}
          <div
            className="rounded-[10px] p-[13px_15px_10px] flex flex-col gap-2 min-h-[280px]"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--line)" }}
          >
            {/* Header — matches ChartCard header exactly */}
            <div className="flex items-start justify-between">
              <div
                className="font-grotesk text-[.72rem] font-semibold tracking-[.08em] uppercase"
                style={{ color: "#ffffff" }}
              >
                Process Tank
              </div>
              <div className="flex gap-[10px] text-right">
                {(
                  [
                    ["MIN", tankStats.min],
                    ["MAX", tankStats.max],
                    ["AVG", tankStats.avg],
                  ] as [string, number | null][]
                ).map(([stat, val]) => (
                  <div key={stat} className="flex flex-col">
                    <span
                      className="text-[.56rem] tracking-[.06em]"
                      style={{ color: "#ffffff" }}
                    >
                      {stat}
                    </span>
                    <span className="font-mono text-[.7rem]" style={{ color: "#ffffff" }}>
                      {fmtStat(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Body — tank capsule centered, grows to fill card height */}
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <TankCapsule
                name="Process Tank"
                pct={row?.tank_level_2 ?? null}
                max={200}
                variant="bento"
              />
            </div>

            {/* Footer */}
            <div className="text-[.62rem]" style={{ color: "var(--text-low)" }}>
              15-min avg · 24h
            </div>
          </div>

          {/* Card 2: VFD Output */}
          <ChartCard
            sensor="vfd_output_display"
            label="VFD Output"
            unit="%"
            decimals={0}
            period="24h"
            className="min-h-[280px]"
            fillBody
          />

          {/* Card 3: Flow Sensor — showYAxis gives a proper dynamic-domain axis */}
          <ChartCard
            sensor="flow_level"
            label="Flow Sensor"
            unit="GPM"
            decimals={0}
            period="24h"
            showYAxis
            className="min-h-[280px]"
            fillBody
          />
        </div>
      </PanelShell>
    </>
  );
}
