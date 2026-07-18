"use client";

import { useDashboard, useIsLive } from "@/lib/hooks";
import StatusStrip from "@/components/StatusStrip";
import PanelShell from "@/components/PanelShell";
import RadialGauge from "@/components/RadialGauge";
import LcdCard from "@/components/LcdCard";
import TankCapsule from "@/components/TankCapsule";
import TrendStripPreview from "@/components/TrendStripPreview";
import ChartCard from "@/components/ChartCard";
import { fmt, fmtSigned } from "@/lib/utils";

export default function OverviewPage() {
  const { data, isError } = useDashboard();
  const row = data?.latest;
  const isLive = useIsLive(data?.is_live);

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
          <div className="grid grid-cols-2 gap-2 flex-1">
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
            <LcdCard
              label="Effluent Tank Level"
              value={row?.tank_level_1 != null ? fmt(row.tank_level_1, 0) : null}
              variant="good"
            />
            {/* Efficiency = actual flow / design-point flow (950 GPM @ 80% VFD max)
                Hidden when VFD < 20% to avoid misleading low-flow readings */}
            <LcdCard
              label="Efficiency"
              value={
                row?.vfd_output_display != null &&
                row.vfd_output_display >= 20 &&
                row?.flow_level != null
                  ? fmt((row.flow_level / 950) * 100, 0)
                  : null
              }
              unit="%"
              variant="good"
            />
          </div>
        </PanelShell>
      </div>

      {/* Tank Levels */}
      <PanelShell title="Tank Levels">
        <div className="flex gap-4 flex-wrap items-stretch">
          <div className="flex items-center">
            <TankCapsule
              name="Process Tank"
              pct={row?.tank_level_2 ?? null}
              max={200}
            />
          </div>
          <div className="flex-1 min-w-[260px]">
            <ChartCard
              sensor="flow_level"
              label="Flow Sensor"
              unit="GPM"
              decimals={0}
              period="24h"
            />
          </div>
        </div>
      </PanelShell>

      {/* Trend strip preview → /trends (series from bundled 24h data) */}
      <TrendStripPreview
        ph={row?.ph}
        phSeries={data?.series?.ph ?? []}
        tankLevel={row?.tank_level_1}
        tankSeries={data?.series?.tank_level_1 ?? []}
        flowLevel={row?.flow_level}
        flowSeries={data?.series?.flow_level ?? []}
      />
    </>
  );
}
