export default function AlarmsPage() {
  return (
    <div
      className="flex-1 rounded-[10px] flex flex-col items-center justify-center gap-[10px] min-h-[240px] text-center"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--line)" }}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-[34px] h-[34px]"
        fill="none"
        stroke="var(--text-low)"
        strokeWidth={1.5}
      >
        <path d="M12 4a6 6 0 0 0-6 6c0 4-2 5-2 7h16c0-2-2-3-2-7a6 6 0 0 0-6-6Z" />
        <path d="M10 21a2 2 0 0 0 4 0" />
      </svg>
      <div
        className="font-grotesk text-[.85rem] tracking-[.06em] uppercase"
        style={{ color: "var(--text-mid)" }}
      >
        Alarms
      </div>
      <div className="text-[.72rem] max-w-[280px]" style={{ color: "var(--text-low)" }}>
        Not built in this prototype yet.
      </div>
    </div>
  );
}
