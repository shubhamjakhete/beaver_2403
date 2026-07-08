"use client";

import Link from "next/link";

interface SparkProps {
  series: (number | null)[];
  width?: number;
  height?: number;
}

/** Light moving-average to reduce noise before rendering. */
function movingAvg(series: (number | null)[], win = 5): (number | null)[] {
  const half = Math.floor(win / 2);
  return series.map((_, i) => {
    const slice = series
      .slice(Math.max(0, i - half), Math.min(series.length, i + half + 1))
      .filter((v): v is number => v != null);
    return slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : null;
  });
}

/** Builds a smooth cubic-bezier SVG path string from a series, auto-scaled to [min, max]. */
function buildSmoothPath(series: (number | null)[], w: number, h: number): string {
  const vals = series.filter((v): v is number => v != null);
  if (vals.length < 2) return "";

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const n = series.length;
  const pad = h * 0.08; // vertical breathing room so line doesn't touch edges

  const pts = series.map((v, i) => ({
    x: (i / (n - 1)) * w,
    y: v == null ? null as null : h - pad - ((v - min) / range) * (h - pad * 2),
  }));

  let d = "";
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].y == null) continue;
    if (d === "") {
      d = `M ${pts[i].x.toFixed(1)},${pts[i].y!.toFixed(1)}`;
    } else {
      // find the last non-null point
      let prev = i - 1;
      while (prev >= 0 && pts[prev].y == null) prev--;
      if (prev < 0) {
        d += ` M ${pts[i].x.toFixed(1)},${pts[i].y!.toFixed(1)}`;
      } else {
        const cpx = ((pts[prev].x + pts[i].x) / 2).toFixed(1);
        d += ` C ${cpx},${pts[prev].y!.toFixed(1)} ${cpx},${pts[i].y!.toFixed(1)} ${pts[i].x.toFixed(1)},${pts[i].y!.toFixed(1)}`;
      }
    }
  }
  return d;
}

/** Builds closed area path (line path + bottom closing) for the fill. */
function buildAreaPath(series: (number | null)[], linePath: string, w: number, h: number): string {
  if (!linePath) return "";
  // find first and last non-null x positions
  const n = series.length;
  let firstI = 0, lastI = n - 1;
  while (firstI < n && series[firstI] == null) firstI++;
  while (lastI > 0 && series[lastI] == null) lastI--;
  const x0 = ((firstI / (n - 1)) * w).toFixed(1);
  const x1 = ((lastI / (n - 1)) * w).toFixed(1);
  return `${linePath} L ${x1},${h} L ${x0},${h} Z`;
}

function Spark({ series, width = 120, height = 32 }: SparkProps) {
  const smoothed = movingAvg(series, 5);
  const linePath = buildSmoothPath(smoothed, width, height);

  if (!linePath) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-[120px] h-[32px]">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="var(--line-soft)" strokeWidth="1" />
      </svg>
    );
  }

  const areaPath = buildAreaPath(smoothed, linePath, width, height);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-[120px] h-[32px]">
      {areaPath && (
        <path d={areaPath} fill="var(--accent-glow)" stroke="none" />
      )}
      <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
