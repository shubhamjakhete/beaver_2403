"use client";

import Link from "next/link";

interface SparkProps {
  series: (number | null)[];
  width?: number;
  height?: number;
}

/** Converts a series array to SVG polyline/polygon points, auto-scaled to the data range. */
function buildPoints(series: (number | null)[], w: number, h: number): string {
  const vals = series.filter((v): v is number => v != null);
  if (vals.length < 2) return "";

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const n = series.length;

  return series
    .map((v, i) => {
      const x = (i / (n - 1)) * w;
      const y = v == null ? h : h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function Spark({ series, width = 120, height = 32 }: SparkProps) {
  const pts = buildPoints(series, width, height);
  if (!pts) {
    // No data — flat line in the middle
    return (
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-[120px] h-[32px]">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="var(--line-soft)" strokeWidth="1" />
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-[120px] h-[32px]">
      <polygon
        points={`0,${height} ${pts} ${width},${height}`}
        fill="var(--accent-glow)"
        stroke="none"
      />
      <polyline
        points={pts}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.6"
      />
    </svg>
  );
}

interface TrendStripPreviewProps {
  ph?: number | null;
  phSeries?: (number | null)[];
  tankLevel?: number | null;
  tankSeries?: (number | null)[];
  flowLevel?: number | null;
  flowSeries?: (number | null)[];
}

export default function TrendStripPreview({
  ph,
  phSeries = [],
  tankLevel,
  tankSeries = [],
  flowLevel,
  flowSeries = [],
}: TrendStripPreviewProps) {
  const items = [
    {
      label: "pH",
      value: ph != null ? ph.toFixed(2) : "—",
      series: phSeries,
    },
    {
      label: "Tank Level",
      value: tankLevel != null ? `${Math.round(tankLevel)}%` : "—",
      series: tankSeries,
    },
    {
      label: "Flow Rate",
      value: flowLevel != null ? `${Math.round(flowLevel)}` : "—",
      series: flowSeries,
    },
  ];

  return (
    <Link
      href="/trends"
      className="block rounded-[10px] p-[10px_16px] hover:border-[var(--accent-dim)] transition-colors"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--line)" }}
    >
      <div className="flex items-center gap-6 flex-wrap">
        <div
          className="text-[.66rem] tracking-[.1em] uppercase mr-auto pr-[10px]"
          style={{ color: "var(--text-low)" }}
        >
          Trend &middot; Last 24h
        </div>

        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-[10px]">
            <div className="min-w-[88px]">
              <div
                className="text-[.62rem] tracking-[.07em] uppercase"
                style={{ color: "var(--text-low)" }}
              >
                {item.label}
              </div>
              <div className="font-mono text-[.92rem]" style={{ color: "var(--text-hi)" }}>
                {item.value}
              </div>
            </div>
            <Spark series={item.series} />
          </div>
        ))}
      </div>
    </Link>
  );
}
