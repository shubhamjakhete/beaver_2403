"use client";

import { useDashboard, useIsLive } from "@/lib/hooks";
import { thresholds } from "@/lib/thresholds";
import StatusStrip from "@/components/StatusStrip";
import type { SensorRow } from "@/lib/types";

// Human-readable config for each sensor that has thresholds
const SENSOR_META: Partial<Record<keyof typeof thresholds, { label: string; unit: string; decimals: number }>> = {
  ph:           { label: "pH",           unit: "",       decimals: 2 },
  orp:          { label: "ORP",          unit: "mV",     decimals: 0 },
  tds:          { label: "TDS",          unit: "ppm",    decimals: 0 },
  do_oxy:       { label: "DO",           unit: "ppm",    decimals: 1 },
  flow_level:   { label: "Flow Level",   unit: "GPM",    decimals: 0 },
  tank_level_2: { label: "Product Tank", unit: "inH₂O", decimals: 0 },
};

type Severity = "ALARM" | "WARN";

interface AlarmItem {
  key: string;
  label: string;
  unit: string;
  decimals: number;
  severity: Severity;
  value: number;
  limit: number;
  direction: "low" | "high";
}

function evaluateAlarms(row: SensorRow | undefined): AlarmItem[] {
  if (!row) return [];
  const items: AlarmItem[] = [];

  for (const [key, t] of Object.entries(thresholds)) {
    const meta = SENSOR_META[key as keyof typeof SENSOR_META];
    if (!meta) continue;
    const value = row[key as keyof SensorRow] as number | null;
    if (value == null) continue;

    // Check alarm first (higher priority), then warn
    if (t.alarmLow != null && value < t.alarmLow) {
      items.push({ key, ...meta, severity: "ALARM", value, limit: t.alarmLow, direction: "low" });
    } else if (t.warnLow != null && value < t.warnLow) {
      items.push({ key, ...meta, severity: "WARN", value, limit: t.warnLow, direction: "low" });
    }

    if (t.alarmHigh != null && value > t.alarmHigh) {
      items.push({ key, ...meta, severity: "ALARM", value, limit: t.alarmHigh, direction: "high" });
    } else if (t.warnHigh != null && value > t.warnHigh) {
      items.push({ key, ...meta, severity: "WARN", value, limit: t.warnHigh, direction: "high" });
    }
  }

  // Alarms first, then warns
  return items.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "ALARM" ? -1 : 1));
}

export default function AlarmsPage() {
  const { data, isError } = useDashboard();
  const row = data?.latest;
  const isLive = useIsLive(data?.is_live);
  const alarms = evaluateAlarms(row);
  const activeAlarms = alarms.filter((a) => a.severity === "ALARM");
  const activeWarns  = alarms.filter((a) => a.severity === "WARN");

  return (
    <>
      <StatusStrip isLive={isLive} />

      {isError && (
        <div
          className="text-[.75rem] rounded-[8px] px-3 py-2"
          style={{ background: "rgba(255,84,104,.08)", border: "1px solid rgba(255,84,104,.3)", color: "var(--alarm)" }}
        >
          Unable to reach API — alarm status may be stale.
        </div>
      )}

      {/* Summary bar */}
      <div
        className="rounded-[10px] p-[14px_16px] flex items-center gap-6 flex-wrap"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--line)" }}
      >
        <div>
          <div className="text-[.62rem] tracking-[.1em] uppercase mb-[2px]" style={{ color: "var(--text-low)" }}>Active Alarms</div>
          <div
            className="font-mono text-[1.6rem] font-bold"
            style={{ color: activeAlarms.length > 0 ? "var(--alarm)" : "var(--good)" }}
          >
            {activeAlarms.length}
          </div>
        </div>
        <div className="w-px h-[36px]" style={{ background: "var(--line)" }} />
        <div>
          <div className="text-[.62rem] tracking-[.1em] uppercase mb-[2px]" style={{ color: "var(--text-low)" }}>Active Warnings</div>
          <div
            className="font-mono text-[1.6rem] font-bold"
            style={{ color: activeWarns.length > 0 ? "var(--warn)" : "var(--good)" }}
          >
            {activeWarns.length}
          </div>
        </div>
        <div className="w-px h-[36px]" style={{ background: "var(--line)" }} />
        <div>
          <div className="text-[.62rem] tracking-[.1em] uppercase mb-[2px]" style={{ color: "var(--text-low)" }}>Last Updated</div>
          <div className="font-mono text-[.85rem]" style={{ color: "var(--text-hi)" }}>
            {data?.updated_at
              ? new Date(data.updated_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
              : "—"}
          </div>
        </div>
      </div>

      {/* Alarm list */}
      {alarms.length === 0 ? (
        <div
          className="flex-1 rounded-[10px] flex flex-col items-center justify-center gap-[10px] min-h-[200px] text-center"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--line)" }}
        >
          <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center" style={{ background: "rgba(47,226,160,.1)", border: "1px solid var(--good)" }}>
            <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="var(--good)" strokeWidth={2}>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div className="font-grotesk text-[.85rem] font-semibold tracking-[.06em]" style={{ color: "var(--good)" }}>
            ALL CLEAR
          </div>
          <div className="text-[.72rem]" style={{ color: "var(--text-low)" }}>
            All monitored sensors within normal operating range.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-[6px]">
          {alarms.map((item) => {
            const isAlarm = item.severity === "ALARM";
            const color = isAlarm ? "var(--alarm)" : "var(--warn)";
            const bgColor = isAlarm ? "rgba(255,84,104,.07)" : "rgba(255,182,72,.07)";
            const borderColor = isAlarm ? "rgba(255,84,104,.35)" : "rgba(255,182,72,.35)";
            const dirLabel = item.direction === "low" ? "Below" : "Above";

            return (
              <div
                key={`${item.key}-${item.severity}`}
                className="rounded-[10px] p-[13px_16px] flex items-center gap-4 flex-wrap"
                style={{ background: bgColor, border: `1px solid ${borderColor}` }}
              >
                {/* Severity badge */}
                <div
                  className="font-grotesk text-[.62rem] font-bold tracking-[.1em] rounded-[5px] px-[8px] py-[4px] flex-shrink-0"
                  style={{ background: `${color}22`, border: `1px solid ${color}`, color }}
                >
                  {item.severity}
                </div>

                {/* Sensor name */}
                <div className="flex-1 min-w-[120px]">
                  <div className="font-grotesk font-semibold text-[.82rem]" style={{ color: "var(--text-hi)" }}>
                    {item.label}
                  </div>
                  <div className="text-[.66rem] mt-[1px]" style={{ color: "var(--text-low)" }}>
                    {dirLabel} {item.severity === "ALARM" ? "alarm" : "warning"} threshold
                  </div>
                </div>

                {/* Current value */}
                <div className="text-right">
                  <div className="font-mono text-[1.1rem] font-semibold" style={{ color }}>
                    {item.value.toFixed(item.decimals)}
                    <span className="text-[.62rem] ml-[3px] font-sans" style={{ color: "var(--text-mid)" }}>
                      {item.unit}
                    </span>
                  </div>
                  <div className="text-[.64rem] mt-[1px]" style={{ color: "var(--text-low)" }}>
                    Limit: {item.limit.toFixed(item.decimals)} {item.unit}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Threshold reference table */}
      <div
        className="rounded-[10px] p-[14px_16px]"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--line)" }}
      >
        <div className="font-grotesk text-[.72rem] font-semibold tracking-[.1em] uppercase mb-[12px] flex items-center gap-2" style={{ color: "var(--text-mid)" }}>
          <span className="inline-block w-[3px] h-[11px] rounded-[1px]" style={{ background: "var(--accent)" }} />
          Configured Thresholds
        </div>
        <div className="flex flex-col gap-[6px]">
          {Object.entries(SENSOR_META).map(([key, meta]) => {
            const t = thresholds[key as keyof typeof thresholds];
            return (
              <div key={key} className="grid grid-cols-[1fr_repeat(4,_auto)] gap-x-4 gap-y-[2px] items-center text-[.68rem]">
                <div className="font-grotesk font-semibold" style={{ color: "var(--text-hi)" }}>
                  {meta.label}
                  {meta.unit && <span className="ml-1 font-normal" style={{ color: "var(--text-low)" }}>{meta.unit}</span>}
                </div>
                {(["alarmLow", "warnLow", "warnHigh", "alarmHigh"] as const).map((field) => {
                  const val = t[field];
                  const isAlarmField = field.startsWith("alarm");
                  const fieldColor = isAlarmField ? "var(--alarm)" : "var(--warn)";
                  const fieldLabel = field === "alarmLow" ? "AL↓" : field === "warnLow" ? "WN↓" : field === "warnHigh" ? "WN↑" : "AL↑";
                  return (
                    <div key={field} className="text-right">
                      <span className="text-[.56rem] mr-1" style={{ color: val != null ? fieldColor : "var(--text-low)" }}>
                        {fieldLabel}
                      </span>
                      <span className="font-mono" style={{ color: val != null ? "var(--text-hi)" : "var(--text-low)" }}>
                        {val != null ? val : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
