"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function TitleBar() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

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

  return (
    <header
      style={{ background: "var(--bg-header)", borderColor: "var(--line)" }}
      className="flex items-center justify-between border rounded-[10px] px-[18px] py-[10px]"
    >
      {/* Left — logos + device tag */}
      <div className="flex items-center gap-4">
        <Image
          src="village-logo.png"
          alt="Village of Indiantown"
          width={38}
          height={38}
          className="rounded"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div>
          <div
            className="font-grotesk font-bold text-[1.05rem] tracking-[.06em]"
            style={{ color: "var(--text-hi)" }}
          >
            BEW&#8209;2403
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
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "var(--good)", boxShadow: "0 0 8px var(--good)" }}
          />
          _SystemOperator &middot; LIVE
        </div>

        <Image
          src="beaver-logo.png"
          alt="Beaver EcoWorks"
          width={34}
          height={34}
          className="rounded"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
    </header>
  );
}
