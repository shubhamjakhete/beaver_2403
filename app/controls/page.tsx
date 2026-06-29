export default function ControlsPage() {
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
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.6-1.3-2-3.3-1.9.6a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.5a7.6 7.6 0 0 0-2.6 1.5l-1.9-.6-2 3.3L4.6 10.5a7.6 7.6 0 0 0 0 3L3 14.8l2 3.3 1.9-.6c.8.7 1.6 1.2 2.6 1.5l.5 2.5h4l.5-2.5a7.6 7.6 0 0 0 2.6-1.5l1.9.6 2-3.3-1.6-1.3Z" />
      </svg>
      <div
        className="font-grotesk text-[.85rem] tracking-[.06em] uppercase"
        style={{ color: "var(--text-mid)" }}
      >
        Controls
      </div>
      <div className="text-[.72rem] max-w-[280px]" style={{ color: "var(--text-low)" }}>
        Not built in this prototype yet.
      </div>
    </div>
  );
}
