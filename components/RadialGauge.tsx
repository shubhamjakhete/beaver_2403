"use client";

/**
 * 270° sweep radial gauge.
 * Each gauge has its own min/max range — do NOT share a scale across PT-1/2/3.
 *
 * Arc coordinate system:
 *   The <circle> strokes start at the SVG default 3-o'clock position and are
 *   rotated 135° clockwise by transform="rotate(135 50 50)".
 *   A value at fraction `frac` ends at:
 *     theta = (135 + frac × 270) degrees  (clockwise from 3-o'clock)
 *     x = cx + r · cos(theta_rad)
 *     y = cy + r · sin(theta_rad)
 *   At frac=0  → bottom-left  (~22, 78)  — 7:30 dial position
 *   At frac=0.5 → top-center (~50, 10)   — 12:00 dial position
 *   At frac=1  → bottom-right (~78, 78) — 4:30 dial position
 */
interface RadialGaugeProps {
  value: number | null;
  min: number;
  max: number;
  unit: string;
  label: string;
  sublabel?: string;
}

const CIRC = 251.3; // circumference for r=40
const TRACK = 188.5; // 270/360 * CIRC
const CX = 50;
const CY = 50;
const R = 40;

/** Cartesian (SVG) coords of the value arc's tip at the given fraction. */
function arcTip(frac: number): { x: number; y: number } {
  const theta = ((135 + frac * 270) * Math.PI) / 180;
  return {
    x: CX + R * Math.cos(theta),
    y: CY + R * Math.sin(theta),
  };
}

export default function RadialGauge({ value, min, max, unit, label, sublabel }: RadialGaugeProps) {
  const frac =
    value == null ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const arcLen = (TRACK * frac).toFixed(1);
  const displayVal = value == null ? "—" : Math.round(value).toString();
  const tip = arcTip(frac);

  return (
    <div className="flex flex-col items-center flex-1">
      {/* overflow:visible so the drop-shadow glow isn't clipped at the viewBox edge */}
      <svg viewBox="0 0 100 100" className="w-[84px] h-[84px]" style={{ overflow: "visible" }}>
        {/* track */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="var(--line-soft)"
          strokeWidth="7"
          transform="rotate(135 50 50)"
          strokeDasharray={`${TRACK} ${CIRC}`}
        />
        {/* value arc */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="7"
          strokeLinecap="round"
          transform="rotate(135 50 50)"
          strokeDasharray={`${arcLen} ${CIRC}`}
          style={{ transition: "stroke-dasharray .6s ease" }}
        />
        {/* Pulsing endpoint dot — sits at the arc tip, breathes with the TitleBar LIVE chip */}
        <circle
          cx={tip.x}
          cy={tip.y}
          r="6.5"
          fill="var(--accent)"
          stroke="#fff"
          strokeWidth="2"
          className="animate-pulse motion-reduce:animate-none"
          style={{
            filter: "drop-shadow(0 0 8px var(--accent))",
            transition: "cx .6s ease, cy .6s ease",
          }}
        />
        {/* numeric value */}
        <text
          x="50"
          y="44"
          textAnchor="middle"
          fontFamily="var(--font-mono), monospace"
          fontSize="13"
          fontWeight="600"
          fill="var(--text-hi)"
        >
          {displayVal}
        </text>
        {/* unit — 12px, separated from number by ~10 SVG units of breathing room */}
        <text
          x="50"
          y="66"
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
      {sublabel && (
        <div
          className="text-[.58rem] tracking-[.03em] mt-[1px] text-center"
          style={{ color: "#ffffff" }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}
