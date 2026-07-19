"use client";

interface TankCapsuleProps {
  name: string;
  pct: number | null;
  max?: number; // default 100; set higher (e.g. 200) to show values beyond 100%
  /** "default" = horizontal card with label; "bento" = bare capsule only, larger, for bento grid */
  variant?: "default" | "bento";
}

export default function TankCapsule({ name, pct, max = 100, variant = "default" }: TankCapsuleProps) {
  const rawPct = pct == null ? 0 : Math.max(0, pct);
  const fillPct = Math.min(100, (rawPct / max) * 100);
  const topPct = 100 - fillPct;

  const isBento = variant === "bento";
  const capsuleW = isBento ? 52 : 46;
  const capsuleH = isBento ? 160 : 108;
  const capsuleR = isBento ? 26 : 23;

  const capsule = (
    <div
      className="relative flex-shrink-0 overflow-hidden"
      style={{
        width: capsuleW,
        height: capsuleH,
        borderRadius: capsuleR,
        background: "var(--bg-deep)",
        border: "1px solid var(--line)",
        boxShadow: "inset 0 2px 5px rgba(0,0,0,.4)",
      }}
    >
      {/* fill */}
      <div
        className="absolute left-0 right-0 bottom-0 capsule-fill"
        style={{
          height: `${fillPct}%`,
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

      {/* value badge floating at waterline — clamped so it stays visible at extremes */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[14px] px-2 py-[3px] font-mono font-semibold whitespace-nowrap"
        style={{
          top: `${Math.min(88, Math.max(12, topPct))}%`,
          fontSize: isBento ? ".72rem" : ".66rem",
          background: "var(--bg-deep)",
          border: "1px solid var(--accent-dim)",
          color: "var(--text-hi)",
          boxShadow: "0 0 8px rgba(0,0,0,.5), 0 0 0 2px var(--bg-panel-alt)",
        }}
      >
        {pct == null ? "—" : `${Math.round(rawPct)}`}
      </div>
    </div>
  );

  if (isBento) return capsule;

  return (
    <div
      className="flex-1 min-w-[140px] flex items-center gap-[14px] rounded-[10px] p-[12px_14px]"
      style={{ background: "var(--bg-panel-alt)", border: "1px solid var(--line-soft)" }}
    >
      {capsule}
      <div className="font-grotesk font-semibold text-[.8rem]" style={{ color: "var(--text-hi)" }}>
        {name}
      </div>
    </div>
  );
}
