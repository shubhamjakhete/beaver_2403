"use client";

import { useEffect, useState } from "react";
import { useDashboard, useIsLive } from "@/lib/hooks";

export default function TitleBar() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const { data } = useDashboard();
  const isLive = useIsLive(data?.is_live);

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false }));
      setDate(
        now.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const statusColor = isLive ? "var(--good)" : "var(--alarm)";
  const statusLabel = isLive ? "LIVE" : "STALE";

  return (
    <header
      style={{ background: "var(--bg-header)", borderColor: "var(--line)" }}
      className="flex items-center justify-between border rounded-[10px] px-[18px] py-[10px]"
    >
      {/* Left — logos + device tag */}
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/projects/2403/village-logo.png"
          alt="Village of Indiantown"
          width={48}
          height={48}
          className="rounded"
          style={{ background: "#ffffff", padding: "2px" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div>
          <div
            className="font-grotesk font-bold text-[1.05rem] tracking-[.06em]"
            style={{ color: "var(--text-hi)" }}
          >
            BEW&#8209;CF15&#8209;2403
          </div>
          <div className="text-[.72rem] tracking-[.03em]" style={{ color: "var(--text-mid)" }}>
            Effluent Treatment Skid &middot; Beaver EcoWorks
          </div>
        </div>
      </div>

      {/* Right — clock + user chip + beaver logo */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div
            className="font-mono text-[.95rem] tracking-[.02em]"
            style={{ color: "var(--text-hi)" }}
          >
            {time}
          </div>
          <div className="text-[.7rem]" style={{ color: "var(--text-mid)" }}>
            {date}
          </div>
        </div>

        {/* divider */}
        <div className="w-px h-[26px]" style={{ background: "var(--line)" }} />

        <div
          style={{
            background: "var(--bg-panel-alt)",
            borderColor: "var(--line)",
            color: "var(--text-mid)",
          }}
          className="flex items-center gap-2 border rounded-[20px] px-3 py-[6px] text-[.75rem]"
          title={isLive ? "Receiving samples within the last 10 minutes" : "No new samples within the last 10 minutes"}
        >
          <span
            className={`w-2 h-2 rounded-full${isLive ? " animate-pulse" : ""}`}
            style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
          />
          _SystemOperator &middot; {statusLabel}
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/projects/2403/beaver-logo.jpeg"
          alt="Beaver EcoWorks"
          width={48}
          height={48}
          className="rounded"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
    </header>
  );
}
