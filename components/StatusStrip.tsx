"use client";

interface StatusStripProps {
  isLive: boolean;
}

function Pill({
  label,
  value,
  dotColor,
}: {
  label: string;
  value: string;
  dotColor: "good" | "info" | "warn" | "alarm";
}) {
  const dotMap = {
    good: "var(--good)",
    info: "var(--accent)",
    warn: "var(--warn)",
    alarm: "var(--alarm)",
  };
  return (
    <div
      style={{ background: "var(--bg-panel-alt)", borderColor: "var(--line)", color: "var(--text-mid)" }}
      className="flex items-center gap-[7px] border rounded-[8px] px-3 py-[7px] text-[.74rem] tracking-[.04em]"
    >
      <span
        className="w-[7px] h-[7px] rounded-full flex-shrink-0"
        style={{ background: dotMap[dotColor] }}
      />
      {label}{" "}
      <span className="font-semibold ml-0.5" style={{ color: "var(--text-hi)" }}>
        {value}
      </span>
    </div>
  );
}

export default function StatusStrip({ isLive }: StatusStripProps) {
  return (
    <div className="flex items-center gap-[10px] flex-wrap">
      <Pill label="MODE" value="AUTO" dotColor="info" />
      <Pill
        label="STATE"
        value={isLive ? "RUNNING" : "STALE"}
        dotColor={isLive ? "good" : "warn"}
      />
      <Pill
        label="HEALTH"
        value={isLive ? "NORMAL" : "WARNING"}
        dotColor={isLive ? "good" : "warn"}
      />
      <Pill
        label="COMMS"
        value={isLive ? "ACTIVE" : "LOST"}
        dotColor={isLive ? "good" : "alarm"}
      />

      {/* System health row — pipeline freshness proxy only */}
      <div
        className="ml-auto hidden md:flex gap-[14px] text-[.7rem]"
        style={{ color: "var(--text-low)" }}
      >
        {(["DATA FEED", "PIPELINE", "NETWORK"] as const).map((label) => (
          <span key={label} className="flex items-center gap-[5px]">
            <span
              className="w-[6px] h-[6px] rounded-full"
              style={{ background: isLive ? "var(--good)" : "var(--warn)" }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
