"use client";

import { useDashboard, useIsLive } from "@/lib/hooks";
import { fmtDataAge, fmtEasternStamp } from "@/lib/utils";

/**
 * Site-wide alert when Supabase reports is_live=false
 * (no new fpl_2403 rows within ~10 minutes).
 */
export default function FeedStaleBanner() {
  const { data, isLoading, isError } = useDashboard();
  const isLive = useIsLive(data?.is_live);

  if (isLoading && !data) return null;
  if (isError && !data) return null;
  if (!data || isLive) return null;

  const stamp = data.updated_at ?? data.latest?.event_timestamp ?? null;
  const age = fmtDataAge(stamp);
  const when = fmtEasternStamp(stamp);

  return (
    <div
      role="status"
      aria-live="assertive"
      className="text-[.78rem] rounded-[8px] px-3 py-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1"
      style={{
        background: "rgba(255,84,104,.1)",
        border: "1px solid rgba(255,84,104,.45)",
        color: "var(--alarm)",
      }}
    >
      <span className="font-grotesk font-semibold tracking-[.04em] uppercase text-[.7rem]">
        Data feed stalled
      </span>
      <span style={{ color: "var(--text-hi)" }}>
        No new samples for {age}.
        {when ? (
          <>
            {" "}
            Last sample <span className="font-mono">{when}</span> (Eastern).
          </>
        ) : null}
      </span>
      <span style={{ color: "var(--text-mid)" }}>
        Charts may be empty until the OPC → Supabase bridge resumes.
      </span>
    </div>
  );
}
