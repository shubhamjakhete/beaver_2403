"use client";

import Link from "next/link";

interface SparkItem {
  label: string;
  value: string;
  delta: number;
  points: string; // SVG polyline points string
}

const DEMO_ITEMS: SparkItem[] = [
  {
    label: "pH",
    value: "—",
    delta: 0,
    points: "0,18 12,16 24,19 36,14 48,17 60,12 72,15 84,10 96,13 108,9 120,11",
  },
  {
    label: "Tank Level",
    value: "—",
    delta: 0,
    points: "0,8 12,11 24,9 36,14 48,13 60,18 72,17 84,21 96,19 108,23 120,21",
  },
  {
    label: "Flow Rate",
    value: "—",
    delta: 0,
    points: "0,22 12,20 24,21 36,16 48,18 60,13 72,15 84,11 96,14 108,9 120,10",
  },
];

interface TrendStripPreviewProps {
  ph?: number | null;
  tankLevel?: number | null;
  flowLevel?: number | null;
}

export default function TrendStripPreview({
  ph,
  tankLevel,
  flowLevel,
}: TrendStripPreviewProps) {
  const items = [
    { ...DEMO_ITEMS[0], value: ph != null ? ph.toFixed(2) : "—", delta: 0 },
    {
      ...DEMO_ITEMS[1],
      value: tankLevel != null ? `${Math.round(tankLevel)}%` : "—",
      delta: 0,
    },
    {
      ...DEMO_ITEMS[2],
      value: flowLevel != null ? `${Math.round(flowLevel)}` : "—",
      delta: 0,
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
            <svg
              viewBox="0 0 120 32"
              preserveAspectRatio="none"
              className="w-[120px] h-[32px]"
            >
              <polygon
                points={`0,32 ${item.points} 120,32`}
                fill="var(--accent-glow)"
                stroke="none"
              />
              <polyline
                points={item.points}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.6"
              />
            </svg>
          </div>
        ))}
      </div>
    </Link>
  );
}
