"use client";

/**
 * 270° sweep radial gauge.
 * Each gauge has its own min/max range — do NOT share a scale across PT-1/2/3.
 */
interface RadialGaugeProps {
  value: number | null;
  min: number;
  max: number;
  unit: string;
  label: string;
}

const CIRC = 251.3; // circumference for r=40
const TRACK = 188.5; // 270/360 * CIRC

export default function RadialGauge({ value, min, max, unit, label }: RadialGaugeProps) {
  const frac =
    value == null ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const arcLen = (TRACK * frac).toFixed(1);
  const displayVal = value == null ? "—" : Math.round(value).toString();

  return (
    <div className="flex flex-col items-center flex-1">
      <svg viewBox="0 0 100 100" className="w-[84px] h-[84px]">
        {/* track */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="var(--line-soft)"
          strokeWidth="7"
          transform="rotate(135 50 50)"
          strokeDasharray={`${TRACK} ${CIRC}`}
        />
        {/* value arc */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="7"
          strokeLinecap="round"
          transform="rotate(135 50 50)"
          strokeDasharray={`${arcLen} ${CIRC}`}
          style={{ transition: "stroke-dasharray .6s ease" }}
        />
        {/* numeric value */}
        <text
          x="50"
          y="48"
          textAnchor="middle"
          fontFamily="var(--font-mono), monospace"
          fontSize="13"
          fontWeight="600"
          fill="var(--text-hi)"
        >
          {displayVal}
        </text>
        {/* unit */}
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="12"
          fill="var(--text-mid)"
          letterSpacing="0.5"
        >
          {unit}
        </text>
      </svg>
      <div
        className="text-[.62rem] tracking-[.05em] mt-[2px]"
        style={{ color: "var(--text-mid)" }}
      >
        {label}
      </div>
    </div>
  );
}
