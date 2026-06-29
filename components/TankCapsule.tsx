"use client";

interface TankCapsuleProps {
  name: string;
  pct: number | null;
}

export default function TankCapsule({ name, pct }: TankCapsuleProps) {
  const safePct = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  const topPct = 100 - safePct;

  return (
    <div
      className="flex-1 min-w-[140px] flex items-center gap-[14px] rounded-[10px] p-[12px_14px]"
      style={{ background: "var(--bg-panel-alt)", border: "1px solid var(--line-soft)" }}
    >
      {/* Capsule */}
      <div
        className="relative w-[46px] h-[108px] flex-shrink-0 rounded-[23px] overflow-hidden"
        style={{
          background: "var(--bg-deep)",
          border: "1px solid var(--line)",
          boxShadow: "inset 0 2px 5px rgba(0,0,0,.4)",
        }}
      >
        {/* fill */}
        <div
          className="absolute left-0 right-0 bottom-0 capsule-fill"
          style={{
            height: `${safePct}%`,
            background: "linear-gradient(180deg, var(--accent) 0%, var(--accent-dim) 100%)",
          }}
        >
          {/* waterline highlight */}
          <div
            className="absolute left-0 right-0 top-0 h-[2px]"
            style={{
              background: "rgba(255,255,255,.55)",
              boxShadow: "0 0 6px var(--accent-glow)",
            }}
          />
        </div>

        {/* % badge floating at waterline */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[14px] px-2 py-[3px] font-mono font-semibold text-[.66rem] whitespace-nowrap"
          style={{
            top: `${topPct}%`,
            background: "var(--bg-deep)",
            border: "1px solid var(--accent-dim)",
            color: "var(--text-hi)",
            boxShadow: "0 0 8px rgba(0,0,0,.5), 0 0 0 2px var(--bg-panel-alt)",
          }}
        >
          {pct == null ? "—" : `${Math.round(safePct)}%`}
        </div>
      </div>

      {/* Text */}
      <div>
        <div
          className="font-grotesk font-semibold text-[.8rem]"
          style={{ color: "var(--text-hi)" }}
        >
          {name}
        </div>
        <div
          className="text-[.64rem] leading-[1.45] mt-1"
          style={{ color: "var(--text-low)" }}
        >
          Illustrative scale, pending
          <br />
          confirmed tank capacity
        </div>
      </div>
    </div>
  );
}
